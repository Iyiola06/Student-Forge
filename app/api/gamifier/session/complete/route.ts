import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAuthedRouteClient } from '@/lib/supabase/routeAuth';
import {
    calculateMasteryDelta,
    calculateSessionXp,
    hydrateSessionRecord,
    slugifyTopic,
    summarizeWeakConcepts,
} from '@/lib/gamifier/masteryArena';
import { recordExternalAnswer } from '@/lib/review/server';
import { recordStudyActivity } from '@/lib/progress/server';

const requestSchema = z.object({
    sessionId: z.string().uuid(),
});

export async function POST(request: Request) {
    const { supabase, user } = await createAuthedRouteClient(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const parsed = requestSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { sessionId } = parsed.data;

    const { data: session } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .maybeSingle();

    if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const { data: rounds } = await supabase
        .from('game_session_rounds')
        .select('*')
        .eq('session_id', sessionId)
        .order('round_order', { ascending: true });

    const hydrated = hydrateSessionRecord(session, rounds || []);
    const today = new Date().toISOString().slice(0, 10);

    const { data: todayStats } = await supabase
        .from('game_daily_stats')
        .select('*')
        .eq('user_id', user.id)
        .eq('played_on', today)
        .maybeSingle();

    const xp = calculateSessionXp(hydrated.current_state, hydrated.mode, !todayStats);
    const masteryDelta = calculateMasteryDelta(hydrated.current_state, hydrated.mode);
    const weakConcepts = summarizeWeakConcepts(hydrated.rounds);
    const topicKey = slugifyTopic(hydrated.topic);
    const totalScore = hydrated.score || hydrated.current_state.score || 0;
    const nextBestScore = Math.max(todayStats?.best_score || 0, totalScore);

    const { data: masteryRow } = await supabase
        .from('game_mastery')
        .select('*')
        .eq('user_id', user.id)
        .eq('topic_key', topicKey)
        .maybeSingle();

    const nextMastery = Math.max(0, Math.min(100, (masteryRow?.mastery_score || 50) + masteryDelta));

    const { data: awardResult, error: awardError } = await supabase.rpc('award_xp', {
        p_user_id: user.id,
        p_xp_to_add: xp.totalXp,
        p_source: 'mastery_arena_session',
    });

    if (awardError) {
        console.error(awardError);
        return NextResponse.json({ error: 'Failed to award session XP' }, { status: 500 });
    }

    const finishStatus = hydrated.current_state.shields <= 0 ? 'failed' : 'completed';

    await Promise.all([
        supabase
            .from('game_sessions')
            .update({
                status: finishStatus,
                finished_at: new Date().toISOString(),
                score: totalScore,
                best_streak: hydrated.best_streak,
            })
            .eq('id', sessionId)
            .eq('user_id', user.id),
        supabase
            .from('game_mastery')
            .upsert({
                user_id: user.id,
                topic_key: topicKey,
                topic: hydrated.topic,
                subject: hydrated.subject,
                mastery_score: nextMastery,
                last_mode: hydrated.mode,
                last_seen_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id,topic_key' }),
        supabase
            .from('game_daily_stats')
            .upsert({
                user_id: user.id,
                played_on: today,
                sessions_count: (todayStats?.sessions_count || 0) + 1,
                best_score: nextBestScore,
                xp_earned: (todayStats?.xp_earned || 0) + xp.totalXp,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id,played_on' }),
        supabase.from('study_history').insert({
            user_id: user.id,
            action_type: 'gamifier_session_completed',
            entity_id: sessionId,
            entity_type: 'game_session',
            details: {
                mode: hydrated.mode,
                topic: hydrated.topic,
                subject: hydrated.subject,
                score: totalScore,
                xp_earned: xp.totalXp,
                best_streak: hydrated.best_streak,
                accuracy: xp.accuracy,
                mastery_delta: masteryDelta,
            },
        }),
    ]);

    // One mastery system: every quest answer also updates the spaced-repetition model and
    // topic mastery. Missed questions that are not cards yet become new review items.
    let sentToReview = 0;
    const newMisses: Array<{ question: string; answer: string; explanation?: string }> = [];
    for (const round of hydrated.rounds) {
        if (!round.result || !round.payload?.prompt) continue;
        const outcome = await recordExternalAnswer({
            supabase,
            userId: user.id,
            correct: Boolean(round.result.correct),
            origin: 'quest',
            sourceId: round.payload.sourceItemId ?? null,
            question: round.payload.sourceItemId ? null : round.payload.prompt,
            submittedAnswer: round.result.answer,
        }).catch(() => null);
        if (outcome) sentToReview++;
        else if (!round.result.correct && round.payload.answer) {
            newMisses.push({ question: round.payload.prompt, answer: round.payload.answer, explanation: round.payload.explanation });
        }
    }
    if (newMisses.length) {
        const now = new Date().toISOString();
        await supabase.from('review_items').insert(
            newMisses.slice(0, 20).map((miss) => ({
                user_id: user.id,
                item_type: 'quiz_question',
                source_id: crypto.randomUUID(),
                source_topic: hydrated.topic || 'General',
                due_at: now,
                content_payload: { question: miss.question, answer: miss.answer, explanation: miss.explanation ?? null, options: [], source_kind: 'quest_miss' },
            }))
        );
    }
    await recordStudyActivity(supabase, user.id);

    return NextResponse.json({
        summary: {
            sentToReview: sentToReview + newMisses.length,
            totalXp: xp.totalXp,
            completionXp: xp.completionXp,
            streakBonusXp: xp.streakBonusXp,
            accuracyBonusXp: xp.accuracyBonusXp,
            weakSpotBonusXp: xp.weakSpotBonusXp,
            dailyBonusXp: xp.dailyBonusXp,
            totalScore,
            bestStreak: hydrated.best_streak,
            accuracy: xp.accuracy,
            masteryDelta,
            weakConcepts,
            topic: hydrated.topic,
            subject: hydrated.subject,
            mode: hydrated.mode,
            personalBest: totalScore >= nextBestScore,
            awardResult: Array.isArray(awardResult) ? awardResult[0] : awardResult,
        },
    });
}

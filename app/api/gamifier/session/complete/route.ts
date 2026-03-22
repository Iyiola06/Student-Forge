import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import {
    calculateMasteryDelta,
    calculateSessionXp,
    hydrateSessionRecord,
    slugifyTopic,
    summarizeWeakConcepts,
} from '@/lib/gamifier/masteryArena';

const requestSchema = z.object({
    sessionId: z.string().uuid(),
});

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
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

    return NextResponse.json({
        summary: {
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

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { missionXpConfig } from '@/lib/gamifier/adventure';

const requestSchema = z.object({
    runId: z.string().uuid(),
});

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const parsed = requestSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { runId } = parsed.data;

    const { data: run } = await supabase
        .from('game_runs')
        .select('*')
        .eq('id', runId)
        .eq('user_id', user.id)
        .maybeSingle();

    if (!run) {
        return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    if (run.status === 'completed') {
        return NextResponse.json({ summary: run.metadata?.completionSummary || null, alreadyCompleted: true });
    }

    const { data: nodes } = await supabase
        .from('game_run_nodes')
        .select('node_type, completed_at')
        .eq('run_id', runId);

    const completedNodes = (nodes || []).filter((node) => !!node.completed_at);
    const battleWins = completedNodes.filter((node) => node.node_type === 'battle').length;
    const bossWins = completedNodes.filter((node) => node.node_type === 'boss').length;
    const supportNodes = completedNodes.filter((node) => ['lore', 'mentor', 'recap', 'reward', 'choice'].includes(node.node_type)).length;

    const nodeXp = supportNodes * missionXpConfig.nodeCompletion + battleWins * missionXpConfig.battleWin;
    const bossXp = bossWins > 0 ? missionXpConfig.bossWin : 0;
    const streakBonusXp = run.current_state?.maxStreak >= 3 ? missionXpConfig.streakBonus : 0;
    const missionXp = missionXpConfig.missionComplete;

    let unlockBonusXp = 0;
    const unlocked: Array<{ unlockType: string; unlockKey: string; label: string }> = [];

    const { data: existingUnlock } = await supabase
        .from('game_unlocks')
        .select('id')
        .eq('user_id', user.id)
        .eq('unlock_type', 'chapter')
        .eq('unlock_key', run.chapter_id)
        .maybeSingle();

    if (!existingUnlock) {
        unlockBonusXp = missionXpConfig.firstTimeUnlock;
        await supabase.from('game_unlocks').insert({
            user_id: user.id,
            unlock_type: 'chapter',
            unlock_key: run.chapter_id,
            payload: { missionTitle: run.mission_title },
        });
        unlocked.push({
            unlockType: 'chapter',
            unlockKey: run.chapter_id,
            label: `${run.mission_title} cleared`,
        });
    }

    const totalXp = nodeXp + bossXp + streakBonusXp + missionXp + unlockBonusXp;

    const { data: awardResult, error: awardError } = await supabase.rpc('award_xp', {
        p_user_id: user.id,
        p_xp_to_add: totalXp,
        p_source: 'story_adventure_mission',
    });

    if (awardError) {
        console.error(awardError);
        return NextResponse.json({ error: 'Failed to award mission XP' }, { status: 500 });
    }

    const summary = {
        totalXp,
        nodeXp,
        missionXp,
        bossXp,
        streakBonusXp,
        unlockBonusXp,
        unlocked,
        awardResult: Array.isArray(awardResult) ? awardResult[0] : awardResult,
    };

    await supabase
        .from('game_runs')
        .update({
            status: 'completed',
            finished_at: new Date().toISOString(),
            metadata: {
                ...(run.metadata || {}),
                completionSummary: summary,
            },
        })
        .eq('id', runId)
        .eq('user_id', user.id);

    await supabase.from('study_history').insert({
        user_id: user.id,
        action_type: 'game_run_completed',
        entity_id: run.id,
        entity_type: 'game_run',
        details: {
            mission_title: run.mission_title,
            xp_earned: totalXp,
            max_streak: run.current_state?.maxStreak || 0,
            source_type: run.source_type,
        },
    });

    return NextResponse.json({ summary });
}

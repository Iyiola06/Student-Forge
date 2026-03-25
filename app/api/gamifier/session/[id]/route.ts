import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAuthedRouteClient } from '@/lib/supabase/routeAuth';
import { hydrateSessionRecord } from '@/lib/gamifier/masteryArena';

const patchSchema = z.object({
    currentRound: z.number().int().min(0),
    currentState: z.record(z.string(), z.any()),
    score: z.number().int().min(0),
    bestStreak: z.number().int().min(0),
    roundResult: z.object({
        roundOrder: z.number().int().min(0),
        answer: z.string(),
        elapsedMs: z.number().int().min(0),
        correct: z.boolean(),
        scoreDelta: z.number().int().min(0),
    }).optional(),
});

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { supabase, user } = await createAuthedRouteClient(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: session } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle();

    if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const { data: rounds } = await supabase
        .from('game_session_rounds')
        .select('*')
        .eq('session_id', id)
        .order('round_order', { ascending: true });

    return NextResponse.json({ session: hydrateSessionRecord(session, rounds || []) });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { supabase, user } = await createAuthedRouteClient(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const parsed = patchSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { currentRound, currentState, score, bestStreak, roundResult } = parsed.data;

    const nextStatus = currentState.shields <= 0 ? 'failed' : 'in_progress';
    const { error: sessionError } = await supabase
        .from('game_sessions')
        .update({
            current_round: currentRound,
            current_state: currentState,
            score,
            best_streak: bestStreak,
            status: nextStatus,
        })
        .eq('id', id)
        .eq('user_id', user.id);

    if (sessionError) {
        console.error(sessionError);
        return NextResponse.json({ error: 'Failed to save session state' }, { status: 500 });
    }

    if (roundResult) {
        const { error: roundError } = await supabase
            .from('game_session_rounds')
            .update({
                result: {
                    answer: roundResult.answer,
                    elapsedMs: roundResult.elapsedMs,
                    correct: roundResult.correct,
                    scoreDelta: roundResult.scoreDelta,
                },
                completed_at: new Date().toISOString(),
            })
            .eq('session_id', id)
            .eq('round_order', roundResult.roundOrder);

        if (roundError) {
            console.error(roundError);
            return NextResponse.json({ error: 'Failed to save round result' }, { status: 500 });
        }
    }

    return NextResponse.json({ success: true, status: nextStatus });
}

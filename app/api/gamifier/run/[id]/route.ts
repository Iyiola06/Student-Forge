import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const patchSchema = z.object({
    currentNodeId: z.string(),
    currentState: z.record(z.string(), z.any()),
    completedNodeId: z.string().optional(),
});

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: run } = await supabase
        .from('game_runs')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle();

    if (!run) {
        return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    const { data: nodes } = await supabase
        .from('game_run_nodes')
        .select('*')
        .eq('run_id', id)
        .order('node_order', { ascending: true });

    return NextResponse.json({
        run: {
            ...run,
            nodes: (nodes || []).map((node) => ({
                id: node.node_id,
                nodeType: node.node_type,
                title: node.title,
                subtitle: node.subtitle,
                contentSource: node.content_source,
                payload: node.payload,
                reward: node.reward,
                nextNodeId: node.next_node_id,
                branchMap: node.branch_map,
                completedAt: node.completed_at,
            })),
        },
    });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const parsed = patchSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { currentNodeId, currentState, completedNodeId } = parsed.data;

    const { error: runError } = await supabase
        .from('game_runs')
        .update({
            current_node_id: currentNodeId,
            current_state: currentState,
        })
        .eq('id', id)
        .eq('user_id', user.id);

    if (runError) {
        console.error(runError);
        return NextResponse.json({ error: 'Failed to save run state' }, { status: 500 });
    }

    if (completedNodeId) {
        await supabase
            .from('game_run_nodes')
            .update({ completed_at: new Date().toISOString() })
            .eq('run_id', id)
            .eq('node_id', completedNodeId);
    }

    return NextResponse.json({ success: true });
}

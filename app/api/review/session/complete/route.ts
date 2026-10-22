import { NextResponse } from 'next/server';
import { createAuthedRouteClient } from '@/lib/supabase/routeAuth';
import { trackServerEvent } from '@/lib/analytics/server';
import { awardXp, recordStudyActivity } from '@/lib/progress/server';

export async function POST(request: Request) {
  try {
    const { supabase, user } = await createAuthedRouteClient(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reviewSessionId } = await request.json();
    if (!reviewSessionId) {
      return NextResponse.json({ error: 'reviewSessionId is required' }, { status: 400 });
    }

    const { data: session } = await supabase
      .from('review_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', reviewSessionId)
      .eq('user_id', user.id)
      .select('id,session_type,completed_items,total_items,correct_items')
      .single();

    if (!session) {
      return NextResponse.json({ error: 'Review session not found' }, { status: 404 });
    }

    // 2 XP per card reviewed, +3 per card recalled; finishing the session keeps the streak alive.
    const completed = Number(session.completed_items || 0);
    const correctItems = Number(session.correct_items || 0);
    const xpEarned = Math.min(200, completed * 2 + correctItems * 3);
    await Promise.all([awardXp(supabase, user.id, xpEarned, 'review_session'), recordStudyActivity(supabase, user.id)]);

    await trackServerEvent({
      userId: user.id,
      eventName: 'review_completed',
      idempotencyKey: `review-completed:${session.id}`,
      properties: {
        sessionType: session.session_type,
        completedItems: session.completed_items,
        totalItems: session.total_items,
        correctItems: session.correct_items,
      },
    });

    return NextResponse.json({ success: true, session, xpEarned });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to complete review session' }, { status: 500 });
  }
}

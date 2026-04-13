import { NextResponse } from 'next/server';
import { createAuthedRouteClient } from '@/lib/supabase/routeAuth';
import { getOrCreateReviewSession, getReviewQueueForUser } from '@/lib/review/server';
import { trackServerEvent } from '@/lib/analytics/server';
import type { ReviewSessionType } from '@/types/product';

export async function POST(request: Request) {
  try {
    const { supabase, user } = await createAuthedRouteClient(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionType } = (await request.json()) as { sessionType: ReviewSessionType };
    const effectiveSessionType = sessionType || 'quick_review';
    const sessionState = await getOrCreateReviewSession({
      supabase,
      userId: user.id,
      sessionType: effectiveSessionType,
    });
    const queue = sessionState.queue ?? (await getReviewQueueForUser(supabase, user.id, effectiveSessionType));

    await trackServerEvent({
      userId: user.id,
      eventName: 'review_started',
      idempotencyKey: `review-started:${sessionState.sessionId}`,
      properties: {
        sessionType: effectiveSessionType,
        itemCount: sessionState.items.length,
        resumed: sessionState.resumed,
      },
    });

    return NextResponse.json({
      sessionId: sessionState.sessionId,
      sessionType: effectiveSessionType,
      resumed: sessionState.resumed,
      items: sessionState.items.map((item: any) => ({
        id: item.id,
        itemType: item.item_type,
        sourceId: item.source_id,
        sourceResourceId: item.source_resource_id,
        sourceTopic: item.source_topic,
        dueAt: item.due_at,
        masteryScore: item.mastery_score,
        lastReviewedAt: item.last_reviewed_at,
        reviewState: item.review_state,
        contentPayload: item.content_payload,
      })),
      dueCount: queue.totals.dueCount,
      weakTopicCount: queue.totals.weakTopicCount,
      weakTopics: queue.weakTopics,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to build review queue' }, { status: 500 });
  }
}

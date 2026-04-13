import { NextResponse } from 'next/server';
import { createAuthedRouteClient } from '@/lib/supabase/routeAuth';
import { applyReviewAnswer } from '@/lib/review/server';

export async function POST(request: Request) {
  try {
    const { supabase, user } = await createAuthedRouteClient(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reviewItemId, reviewSessionId, result, responseTimeMs, confidence, submittedAnswer } = await request.json();
    if (!reviewItemId || !reviewSessionId || !result) {
      return NextResponse.json({ error: 'Missing review answer payload' }, { status: 400 });
    }

    await applyReviewAnswer({
      supabase,
      userId: user.id,
      reviewItemId,
      reviewSessionId,
      result,
      responseTimeMs,
      confidence,
      submittedAnswer,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to submit review answer' }, { status: 500 });
  }
}

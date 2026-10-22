import { NextResponse } from 'next/server';
import { createAuthedRouteClient } from '@/lib/supabase/routeAuth';
import { applyReviewAnswer } from '@/lib/review/server';

export async function POST(request: Request) {
  try {
    const { supabase, user } = await createAuthedRouteClient(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reviewItemId, reviewSessionId, result, grade, responseTimeMs, confidence, submittedAnswer } = await request.json();
    const safeGrade = [1, 2, 3, 4].includes(Number(grade)) ? (Number(grade) as 1 | 2 | 3 | 4) : undefined;
    if (!reviewItemId || !reviewSessionId || (!result && !safeGrade)) {
      return NextResponse.json({ error: 'Missing review answer payload' }, { status: 400 });
    }

    const outcome = await applyReviewAnswer({
      supabase,
      userId: user.id,
      reviewItemId,
      reviewSessionId,
      result: result === 'correct' ? 'correct' : 'incorrect',
      grade: safeGrade,
      responseTimeMs: Number.isFinite(Number(responseTimeMs)) ? Math.round(Number(responseTimeMs)) : undefined,
      confidence,
      submittedAnswer: typeof submittedAnswer === 'string' ? submittedAnswer.slice(0, 2000) : undefined,
    });

    return NextResponse.json({ success: true, ...outcome });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to submit review answer' }, { status: 500 });
  }
}

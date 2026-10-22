import { NextResponse } from 'next/server';
import { createAuthedRouteClient } from '@/lib/supabase/routeAuth';
import { recordExternalAnswer } from '@/lib/review/server';

/** An answer given while practising in the studio: feeds the spaced-repetition queue. */
export async function POST(request: Request) {
  try {
    const { supabase, user } = await createAuthedRouteClient(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { question, correct, submittedAnswer } = await request.json();
    if (typeof question !== 'string' || !question.trim() || typeof correct !== 'boolean') {
      return NextResponse.json({ error: 'question and correct are required' }, { status: 400 });
    }

    const outcome = await recordExternalAnswer({
      supabase,
      userId: user.id,
      correct,
      origin: 'practice',
      question: question.trim(),
      submittedAnswer: typeof submittedAnswer === 'string' ? submittedAnswer.slice(0, 2000) : undefined,
    });

    return NextResponse.json({ success: true, scheduled: Boolean(outcome), ...(outcome ?? {}) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to record practice answer' }, { status: 500 });
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ReviewSessionType } from '@/types/product';
import { masteryFromStability, schedule, stateFromMastery, type FsrsParams, type Grade } from '@/lib/review/fsrs';
import { fitPersonalParams, MIN_OBSERVATIONS } from '@/lib/review/optimizer';
import { createAdminClient } from '@/lib/billing/server';
import { recordStudyActivity } from '@/lib/progress/server';

function slugifyTopic(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'general';
}

export async function syncLegacyReviewItems(supabase: any, userId: string) {
  const [{ data: flashcardItems }, { data: quizQuestions }] = await Promise.all([
    supabase
      .from('flashcard_items')
      .select('id,front_content,back_content,next_review_at,flashcards!inner(id,user_id,resource_id,subject)')
      .eq('flashcards.user_id', userId),
    supabase
      .from('quiz_questions')
      .select('id,question_text,options,correct_answer,explanation,quizzes!inner(id,user_id,resource_id,title,subject)')
      .eq('quizzes.user_id', userId),
  ]);

  const existingIds = new Set<string>();
  const { data: existing } = await supabase
    .from('review_items')
    .select('source_id')
    .eq('user_id', userId);

  for (const row of existing ?? []) {
    existingIds.add(String(row.source_id));
  }

  const inserts = [
    ...(flashcardItems ?? [])
      .filter((item: any) => !existingIds.has(item.id))
      .map((item: any) => ({
        user_id: userId,
        item_type: 'flashcard',
        source_id: item.id,
        source_resource_id: item.flashcards.resource_id,
        source_topic: item.flashcards.subject ?? 'General',
        review_state: 'new',
        due_at: item.next_review_at ?? new Date().toISOString(),
        content_payload: {
          front: item.front_content,
          back: item.back_content,
          source_kind: 'flashcard_item',
        },
      })),
    ...(quizQuestions ?? [])
      .filter((item: any) => !existingIds.has(item.id))
      .map((item: any) => ({
        user_id: userId,
        item_type: 'quiz_question',
        source_id: item.id,
        source_resource_id: item.quizzes.resource_id,
        source_topic: item.quizzes.subject ?? item.quizzes.title ?? 'General',
        review_state: 'new',
        due_at: new Date().toISOString(),
        content_payload: {
          question: item.question_text,
          options: item.options ?? [],
          answer: item.correct_answer,
          explanation: item.explanation,
          source_kind: 'quiz_question',
        },
      })),
  ];

  if (inserts.length) {
    await supabase.from('review_items').insert(inserts);
  }
}

export async function getReviewQueueForUser(supabase: any, userId: string, sessionType: ReviewSessionType) {
  await syncLegacyReviewItems(supabase, userId);

  const now = new Date().toISOString();
  const { data: items } = await supabase
    .from('review_items')
    .select(
      'id,item_type,source_id,source_resource_id,source_topic,review_state,mastery_score,mistakes_count,reviews_count,due_at,last_reviewed_at,stability,difficulty,consecutive_correct,lapse_count,overdue_count,content_payload'
    )
    .eq('user_id', userId)
    .order('due_at', { ascending: true })
    .limit(80);

  const dueItems = (items ?? []).filter((item: any) => item.due_at <= now && item.review_state !== 'mastered');
  const newItems = (items ?? []).filter((item: any) => item.review_state === 'new').slice(0, 10);
  const weakItems = [...(items ?? [])]
    .sort((a: any, b: any) => a.mastery_score - b.mastery_score || b.mistakes_count - a.mistakes_count)
    .slice(0, 12);

  let queue = dueItems;
  if (sessionType === 'quick_review') queue = dueItems.slice(0, 8);
  if (sessionType === 'streak_saver') queue = dueItems.slice(0, 3);
  if (sessionType === 'exam_prep') {
    queue = [...dueItems, ...weakItems.filter((item: any) => !dueItems.some((due: any) => due.id === item.id)), ...newItems]
      .slice(0, 16);
  }

  const weakTopicMap = new Map<string, { topic: string; score: number; dueCount: number; mistakes: number }>();
  for (const item of items ?? []) {
    const topic = item.source_topic || 'General';
    const current = weakTopicMap.get(topic) ?? { topic, score: 0, dueCount: 0, mistakes: 0 };
    current.score += Number(item.mastery_score || 0);
    current.mistakes += Number(item.mistakes_count || 0);
    if (item.due_at <= now && item.review_state !== 'mastered') current.dueCount += 1;
    weakTopicMap.set(topic, current);
  }

  return {
    items: queue,
    totals: {
      dueCount: dueItems.length,
      queueCount: queue.length,
      weakTopicCount: [...weakTopicMap.values()].filter((topic) => topic.dueCount > 0 || topic.mistakes > 0).length,
    },
    weakTopics: [...weakTopicMap.values()]
      .map((topic) => ({
        topic: topic.topic,
        masteryScore: Math.max(0, Math.min(100, Math.round(topic.score / Math.max(1, (items ?? []).filter((item: any) => (item.source_topic || 'General') === topic.topic).length)))),
        dueCount: topic.dueCount,
        mistakesCount: topic.mistakes,
      }))
      .sort((a, b) => a.masteryScore - b.masteryScore || b.dueCount - a.dueCount)
      .slice(0, 6),
  };
}

export async function getOrCreateReviewSession(params: {
  supabase: any;
  userId: string;
  sessionType: ReviewSessionType;
}) {
  const { supabase, userId, sessionType } = params;
  const existingSessionRes = await supabase
    .from('review_sessions')
    .select('id,session_type,status,completed_items,total_items,metadata')
    .eq('user_id', userId)
    .eq('session_type', sessionType)
    .eq('status', 'started')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const existingSession = existingSessionRes.data;
  if (existingSession?.id && Array.isArray(existingSession.metadata?.queue_item_ids)) {
    const attemptedRes = await supabase
      .from('review_attempts')
      .select('review_item_id')
      .eq('review_session_id', existingSession.id);

    const attemptedIds = new Set((attemptedRes.data ?? []).map((row: any) => String(row.review_item_id)));
    const { data: queuedItems } = await supabase
      .from('review_items')
      .select(
        'id,item_type,source_id,source_resource_id,source_topic,review_state,mastery_score,mistakes_count,reviews_count,due_at,last_reviewed_at,stability,difficulty,consecutive_correct,lapse_count,overdue_count,content_payload'
      )
      .in('id', existingSession.metadata.queue_item_ids);

    const remainingItems = (queuedItems ?? []).filter((item: any) => !attemptedIds.has(String(item.id)));
    if (remainingItems.length) {
      return {
        sessionId: existingSession.id,
        items: remainingItems,
        resumed: true,
      };
    }
  }

  const queue = await getReviewQueueForUser(supabase, userId, sessionType);
  const { data: session, error } = await supabase
    .from('review_sessions')
    .insert({
      user_id: userId,
      session_type: sessionType,
      total_items: queue.items.length,
      completed_items: 0,
      correct_items: 0,
      metadata: {
        due_count: queue.totals.dueCount,
        weak_topic_count: queue.totals.weakTopicCount,
        queue_item_ids: queue.items.map((item: any) => item.id),
      },
    })
    .select('id')
    .single();

  if (error || !session) {
    throw new Error('Failed to start review session');
  }

  return {
    sessionId: session.id,
    items: queue.items,
    queue,
    resumed: false,
  };
}

export async function applyReviewAnswer(params: {
  supabase: any;
  userId: string;
  reviewItemId: string;
  reviewSessionId?: string | null;
  result: 'correct' | 'incorrect';
  grade?: Grade;
  /** Where the answer came from when it was not a review session (quest mode, practice). */
  origin?: 'review' | 'practice' | 'quest';
  responseTimeMs?: number;
  confidence?: number;
  submittedAnswer?: string;
}) {
  const { supabase, userId, reviewItemId, responseTimeMs, submittedAnswer } = params;
  const reviewSessionId = params.reviewSessionId ?? null;
  const { data: item } = await supabase
    .from('review_items')
    .select('*')
    .eq('id', reviewItemId)
    .eq('user_id', userId)
    .single();

  if (!item) {
    throw new Error('Review item not found');
  }

  // Graded recall (FSRS). Binary callers map to Good / Again.
  const grade: Grade = params.grade ?? (params.result === 'correct' ? 3 : 1);
  const result: 'correct' | 'incorrect' = grade >= 2 ? 'correct' : 'incorrect';
  const correct = result === 'correct';
  const now = new Date();
  const wasDue = item.due_at <= now.toISOString();
  const { data: learner } = await supabase
    .from('profiles')
    .select('exam_date,desired_retention,fsrs_params')
    .eq('id', userId)
    .maybeSingle();
  const stabilityBefore = Number(item.stability ?? 0.3);
  const elapsedDays = item.last_reviewed_at ? Math.max(0, (now.getTime() - new Date(item.last_reviewed_at).getTime()) / 86_400_000) : 0;
  const memory = schedule(
    {
      stability: stabilityBefore,
      difficulty: Number(item.difficulty ?? 0.5),
      reviewsCount: Number(item.reviews_count || 0),
      lastReviewedAt: item.last_reviewed_at,
    },
    grade,
    now,
    {
      retention: learner?.desired_retention ? Number(learner.desired_retention) : undefined,
      params: (learner?.fsrs_params as FsrsParams | null) ?? null,
      examDate: learner?.exam_date ?? null,
    }
  );
  const nextMastery = masteryFromStability(memory.stability);
  const nextState = stateFromMastery(nextMastery, grade);
  const schedule_ = { nextDueAt: memory.nextDueAt, stability: memory.stability, difficulty: memory.difficulty };
  const newlyMastered = nextState === 'mastered' && item.review_state !== 'mastered';
  const confidence = params.confidence ?? grade;
  const topicLabel = item.source_topic || 'General';
  const topicSlug = slugifyTopic(topicLabel);

  await supabase.from('review_attempts').insert({
    user_id: userId,
    review_item_id: item.id,
    review_session_id: reviewSessionId,
    result,
    submitted_answer: submittedAnswer ?? null,
    expected_answer: item.content_payload?.answer ?? item.content_payload?.back ?? null,
    response_time_ms: responseTimeMs ?? null,
    confidence: confidence ?? null,
    was_due: wasDue,
    source_type: item.item_type,
    source_id: item.source_id,
    metadata: {
      topic: topicLabel,
      grade,
      origin: params.origin ?? 'review',
      interval_days: memory.intervalDays,
      retrievability: Math.round(memory.retrievability * 100) / 100,
      stability_before: Number(item.reviews_count || 0) ? stabilityBefore : null,
      elapsed_days: Math.round(elapsedDays * 100) / 100,
    },
  });

  await supabase
    .from('review_items')
    .update({
      mastery_score: nextMastery,
      review_state: nextState,
      due_at: schedule_.nextDueAt,
      last_reviewed_at: new Date().toISOString(),
      reviews_count: Number(item.reviews_count || 0) + 1,
      mistakes_count: Number(item.mistakes_count || 0) + (correct ? 0 : 1),
      consecutive_correct: correct ? Number(item.consecutive_correct || 0) + 1 : 0,
      lapse_count: Number(item.lapse_count || 0) + (correct ? 0 : 1),
      overdue_count: wasDue ? Number(item.overdue_count || 0) + 1 : Number(item.overdue_count || 0),
      stability: schedule_.stability,
      difficulty: schedule_.difficulty,
    })
    .eq('id', item.id)
    .eq('user_id', userId);

  const { data: topicMastery } = await supabase
    .from('topic_mastery')
    .select('id,mastery_score,mistakes_count,reviews_count,due_count')
    .eq('user_id', userId)
    .eq('topic_slug', topicSlug)
    .maybeSingle();

  if (topicMastery?.id) {
    await supabase
      .from('topic_mastery')
      .update({
        topic_label: topicLabel,
        mastery_score: Math.min(100, Math.max(0, Number(topicMastery.mastery_score || 0) + ({ 1: -8, 2: 2, 3: 6, 4: 9 } as const)[grade])),
        mistakes_count: Number(topicMastery.mistakes_count || 0) + (correct ? 0 : 1),
        reviews_count: Number(topicMastery.reviews_count || 0) + 1,
        // Only items that were due leave (or, on a miss, stay in) the due pile.
        due_count: Math.max(0, Number(topicMastery.due_count || 0) + (correct ? (wasDue ? -1 : 0) : wasDue ? 0 : 1)),
        last_reviewed_at: new Date().toISOString(),
      })
      .eq('id', topicMastery.id);
  } else {
    await supabase.from('topic_mastery').insert({
      user_id: userId,
      topic_slug: topicSlug,
      topic_label: topicLabel,
      mastery_score: correct ? 56 : 28,
      mistakes_count: correct ? 0 : 1,
      reviews_count: 1,
      due_count: correct ? 0 : 1,
      source_resource_id: item.source_resource_id,
      last_reviewed_at: new Date().toISOString(),
    });
  }

  const { data: session } = reviewSessionId
    ? await supabase
        .from('review_sessions')
        .select('completed_items,correct_items,total_items')
        .eq('id', reviewSessionId)
        .eq('user_id', userId)
        .single()
    : { data: null };

  if (session) {
    await supabase
      .from('review_sessions')
      .update({
        completed_items: Number(session.completed_items || 0) + 1,
        correct_items: Number(session.correct_items || 0) + (correct ? 1 : 0),
      })
      .eq('id', reviewSessionId)
      .eq('user_id', userId);
  }

  await recordStudyActivity(supabase, userId, newlyMastered ? 1 : 0);

  return { grade, result, intervalDays: memory.intervalDays, nextDueAt: memory.nextDueAt, masteryScore: nextMastery, reviewState: nextState };
}

/**
 * Routes an answer given outside the review queue (practice in the studio, quest mode) into
 * the same memory model, so mistakes anywhere are scheduled for review.
 */
export async function recordExternalAnswer(params: {
  supabase: any;
  userId: string;
  correct: boolean;
  origin: 'practice' | 'quest';
  reviewItemId?: string | null;
  sourceId?: string | null;
  question?: string | null;
  submittedAnswer?: string;
}) {
  const { supabase, userId } = params;
  let reviewItemId = params.reviewItemId ?? null;

  if (!reviewItemId && params.sourceId) {
    const { data } = await supabase
      .from('review_items')
      .select('id')
      .eq('user_id', userId)
      .eq('source_id', params.sourceId)
      .limit(1)
      .maybeSingle();
    reviewItemId = data?.id ?? null;
  }

  if (!reviewItemId && params.question) {
    const since = new Date(Date.now() - 2 * 86_400_000).toISOString();
    const { data } = await supabase
      .from('review_items')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', since)
      .eq('content_payload->>question', params.question)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    reviewItemId = data?.id ?? null;
  }

  if (!reviewItemId) return null;

  return applyReviewAnswer({
    supabase,
    userId,
    reviewItemId,
    reviewSessionId: null,
    result: params.correct ? 'correct' : 'incorrect',
    grade: params.correct ? 3 : 1,
    origin: params.origin,
    submittedAnswer: params.submittedAnswer,
  });
}

/** Refits the personal memory model once enough new reviews have accumulated. */
export async function maybeRefitMemoryModel(supabase: any, userId: string) {
  try {
    const { data: profile } = await supabase.from('profiles').select('fsrs_params').eq('id', userId).maybeSingle();
    const fittedOn = Number((profile?.fsrs_params as FsrsParams | null)?.fittedOn || 0);
    const { count } = await supabase
      .from('review_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
    if (!count || count < MIN_OBSERVATIONS || count < fittedOn + MIN_OBSERVATIONS) return null;

    const { data: attempts } = await supabase
      .from('review_attempts')
      .select('confidence,result,metadata')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5000);

    const fitted = fitPersonalParams(
      (attempts ?? [])
        .filter((a: any) => a.metadata?.stability_before != null && a.metadata?.elapsed_days != null)
        .map((a: any) => ({
          stability: Number(a.metadata.stability_before),
          elapsedDays: Number(a.metadata.elapsed_days),
          recalled: a.result === 'correct',
        }))
    );
    if (!fitted) return null;

    // fsrs_params is protected from client writes; store with the service role.
    const admin = createAdminClient();
    await admin
      .from('profiles')
      .update({ fsrs_params: { stabilityScale: fitted.stabilityScale, fittedOn: count, fittedAt: fitted.fittedAt } })
      .eq('id', userId);
    return fitted;
  } catch (error) {
    console.warn('[review] memory model refit skipped', error);
    return null;
  }
}

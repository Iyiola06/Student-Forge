/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ReviewSessionType } from '@/types/product';

const DAY_MS = 24 * 60 * 60 * 1000;

function slugifyTopic(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'general';
}

function addDays(days: number) {
  return new Date(Date.now() + days * DAY_MS).toISOString();
}

function buildIntervals(stability: number, difficulty: number, correct: boolean) {
  if (!correct) {
    return {
      stability: Math.max(0.25, stability * 0.55),
      difficulty: Math.min(0.95, difficulty + 0.12),
      nextDueAt: addDays(1),
    };
  }

  const nextStability = Math.min(12, stability * 1.65 + 0.35);
  const nextDifficulty = Math.max(0.2, difficulty - 0.05);
  const intervalDays = Math.max(1, Math.round(nextStability * (1.9 - nextDifficulty)));

  return {
    stability: nextStability,
    difficulty: nextDifficulty,
    nextDueAt: addDays(intervalDays),
  };
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
  reviewSessionId: string;
  result: 'correct' | 'incorrect';
  responseTimeMs?: number;
  confidence?: number;
  submittedAnswer?: string;
}) {
  const { supabase, userId, reviewItemId, reviewSessionId, result, responseTimeMs, confidence, submittedAnswer } = params;
  const { data: item } = await supabase
    .from('review_items')
    .select('*')
    .eq('id', reviewItemId)
    .eq('user_id', userId)
    .single();

  if (!item) {
    throw new Error('Review item not found');
  }

  const correct = result === 'correct';
  const schedule = buildIntervals(Number(item.stability ?? 0.3), Number(item.difficulty ?? 0.5), correct);
  const nextMastery = correct
    ? Math.min(100, Number(item.mastery_score || 0) + (item.review_state === 'new' ? 18 : 10))
    : Math.max(0, Number(item.mastery_score || 0) - 16);
  const nextState =
    nextMastery >= 92 ? 'mastered' : nextMastery >= 70 ? 'review' : nextMastery >= 35 ? 'learning' : 'new';
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
    was_due: item.due_at <= new Date().toISOString(),
    source_type: item.item_type,
    source_id: item.source_id,
    metadata: {
      topic: topicLabel,
    },
  });

  await supabase
    .from('review_items')
    .update({
      mastery_score: nextMastery,
      review_state: nextState,
      due_at: schedule.nextDueAt,
      last_reviewed_at: new Date().toISOString(),
      reviews_count: Number(item.reviews_count || 0) + 1,
      mistakes_count: Number(item.mistakes_count || 0) + (correct ? 0 : 1),
      consecutive_correct: correct ? Number(item.consecutive_correct || 0) + 1 : 0,
      lapse_count: Number(item.lapse_count || 0) + (correct ? 0 : 1),
      overdue_count: item.due_at <= new Date().toISOString() ? Number(item.overdue_count || 0) + 1 : Number(item.overdue_count || 0),
      stability: schedule.stability,
      difficulty: schedule.difficulty,
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
        mastery_score: correct
          ? Math.min(100, Number(topicMastery.mastery_score || 0) + 6)
          : Math.max(0, Number(topicMastery.mastery_score || 0) - 8),
        mistakes_count: Number(topicMastery.mistakes_count || 0) + (correct ? 0 : 1),
        reviews_count: Number(topicMastery.reviews_count || 0) + 1,
        due_count: Math.max(0, Number(topicMastery.due_count || 0) + (correct ? -1 : 1)),
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

  const { data: session } = await supabase
    .from('review_sessions')
    .select('completed_items,correct_items,total_items')
    .eq('id', reviewSessionId)
    .eq('user_id', userId)
    .single();

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
}

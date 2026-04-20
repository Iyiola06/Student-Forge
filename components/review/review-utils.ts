import type { ReviewSessionType, ReviewQueueItem } from '@/components/review/types';

const SESSION_TYPE_LABELS: Record<ReviewSessionType, string> = {
  quick_review: 'Quick review',
  exam_prep: 'Exam prep',
  streak_saver: 'Streak saver',
};

export function formatSessionType(value: ReviewSessionType) {
  return SESSION_TYPE_LABELS[value];
}

export function getReviewPrompt(item: ReviewQueueItem) {
  return (
    item.contentPayload?.front ||
    item.contentPayload?.question ||
    item.sourceTopic ||
    'Review item'
  );
}

export function getReviewAnswer(item: ReviewQueueItem) {
  return (
    item.contentPayload?.back ||
    item.contentPayload?.answer ||
    item.contentPayload?.model_answer ||
    'No answer stored yet.'
  );
}

export function getReviewExplanation(item: ReviewQueueItem) {
  return item.contentPayload?.explanation as string | undefined;
}

export function getReviewOptions(item: ReviewQueueItem) {
  return (item.contentPayload?.options as string[] | undefined) || [];
}

export function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (!minutes) return `${remainingSeconds}s`;
  return `${minutes}m ${remainingSeconds}s`;
}

import type { ReviewSessionType, ReviewQueueItem } from '@/components/review/types';

export function formatSessionType(value: ReviewSessionType) {
  switch (value) {
    case 'quick_review':
      return 'Quick review';
    case 'exam_prep':
      return 'Exam prep';
    case 'streak_saver':
      return 'Streak saver';
    default:
      return value.replace(/_/g, ' ');
  }
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

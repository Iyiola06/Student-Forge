export type ReviewSessionType = 'quick_review' | 'exam_prep' | 'streak_saver';

export type ReviewQueueItem = {
  id: string;
  itemType: 'flashcard' | 'quiz_question';
  sourceId?: string;
  sourceResourceId?: string | null;
  sourceTopic?: string | null;
  dueAt: string;
  masteryScore: number;
  reviewState: 'new' | 'learning' | 'review' | 'mastered';
  lastReviewedAt?: string | null;
  contentPayload?: Record<string, any>;
};

export type ReviewQueueResponse = {
  sessionId: string;
  sessionType: ReviewSessionType;
  resumed?: boolean;
  items: ReviewQueueItem[];
  dueCount: number;
  weakTopicCount: number;
  weakTopics: Array<{
    topic: string;
    masteryScore: number;
    dueCount: number;
    mistakesCount: number;
  }>;
};

export type ReviewSessionSummary = {
  sessionType: ReviewSessionType;
  totalItems: number;
  completedItems: number;
  correctItems: number;
  incorrectItems: number;
  weakTopicCount: number;
  weakTopics: ReviewQueueResponse['weakTopics'];
  durationSeconds: number;
};

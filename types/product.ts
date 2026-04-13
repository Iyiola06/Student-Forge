export type ResourceProcessingStatus =
  | 'uploaded'
  | 'queued'
  | 'extracting'
  | 'extracted'
  | 'generating'
  | 'ready'
  | 'retrying'
  | 'failed'
  | 'archived';

export type ReviewItemType = 'flashcard' | 'quiz_question';

export type ReviewSessionType = 'quick_review' | 'exam_prep' | 'streak_saver';

export type NotificationPreferenceType = 'due_review' | 'low_balance';

export type ProductAnalyticsEvent =
  | 'sign_up_completed'
  | 'upload_started'
  | 'upload_succeeded'
  | 'upload_failed'
  | 'extraction_failed'
  | 'generation_started'
  | 'generation_completed'
  | 'review_started'
  | 'review_completed'
  | 'credits_purchased'
  | 'referral_applied';

export interface ResourceProcessingSnapshot {
  status: ResourceProcessingStatus;
  extractionConfidence?: number | null;
  extractionMethod?: string | null;
  diagnostics?: Record<string, unknown> | null;
  extractedPreview?: string | null;
  sourceHealth?: 'strong' | 'usable' | 'needs_review' | null;
  diagnosticsSummary?: string | null;
}

export interface GenerationJobContract {
  id?: string;
  resourceId?: string | null;
  sourceText?: string;
  sourceType: 'resource' | 'pasted_text';
  outputType: 'mcq' | 'flashcards' | 'theory' | 'exam_snapshot';
  difficulty?: 'easy' | 'medium' | 'hard';
  count?: number;
  topic?: string | null;
  curriculum?: string | null;
  status?: 'queued' | 'processing' | 'completed' | 'failed';
}

export interface ReviewItemContract {
  id: string;
  itemType: ReviewItemType;
  sourceId: string;
  sourceResourceId?: string | null;
  sourceTopic?: string | null;
  dueAt: string;
  masteryScore: number;
  lastReviewedAt?: string | null;
  reviewState: 'new' | 'learning' | 'review' | 'mastered';
  contentPayload?: Record<string, unknown>;
}

export interface ReviewSessionContract {
  id?: string;
  sessionType: ReviewSessionType;
  itemCount: number;
  dueCount: number;
  weakTopicCount: number;
}

export interface TopicMasteryContract {
  topicSlug: string;
  topicLabel: string;
  masteryScore: number;
  mistakesCount: number;
  reviewsCount: number;
  dueCount: number;
  lastReviewedAt?: string | null;
}

export interface CreditEventContract {
  eventType?: 'purchase' | 'grant' | 'referral_bonus' | 'generation_spend' | 'advanced_extraction_spend' | 'adjustment' | 'expiry' | 'refund';
  source: string;
  amount: number;
  occurredAt: string;
  modelName?: string | null;
  inputSize?: number | null;
  outputSize?: number | null;
  estimatedProviderCost?: number | null;
  metadata?: Record<string, unknown>;
}

export interface NotificationPreferenceContract {
  preferenceType: NotificationPreferenceType;
  enabled: boolean;
  channel: 'email' | 'push';
}

export interface ReviewQueueContract {
  sessionId: string;
  sessionType: ReviewSessionType;
  items: ReviewItemContract[];
  dueCount: number;
  weakTopicCount: number;
  weakTopics: Array<{
    topic: string;
    masteryScore: number;
    dueCount: number;
    mistakesCount: number;
  }>;
}

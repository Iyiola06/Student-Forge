import type { SupabaseClient } from '@supabase/supabase-js';
import type { AiCreditFeature } from '@/lib/billing/config';
import { FEATURE_CREDIT_POLICIES } from '@/lib/billing/config';
import { recordCreditEvent } from '@/lib/billing/server';
import { trackServerEvent } from '@/lib/analytics/server';

export async function finalizeAiUsage(params: {
  supabase: SupabaseClient;
  userId: string;
  feature: AiCreditFeature;
  source: string;
  modelName: string;
  inputSize?: number | null;
  outputSize?: number | null;
  metadata?: Record<string, unknown>;
  analyticsEvent?: 'generation_completed' | 'credits_purchased' | 'referral_applied';
  analyticsKey?: string;
}) {
  const policy = FEATURE_CREDIT_POLICIES[params.feature];

  await recordCreditEvent({
    supabase: params.supabase,
    userId: params.userId,
    eventType: policy.creditEventType,
    source: params.source,
    amount: -policy.creditCost,
    modelName: params.modelName,
    inputSize: params.inputSize ?? null,
    outputSize: params.outputSize ?? null,
    estimatedProviderCost: policy.estimatedProviderCost,
    metadata: params.metadata ?? {},
  });

  if (params.analyticsEvent && params.analyticsKey) {
    await trackServerEvent({
      userId: params.userId,
      eventName: params.analyticsEvent,
      idempotencyKey: params.analyticsKey,
      properties: params.metadata ?? {},
    });
  }
}

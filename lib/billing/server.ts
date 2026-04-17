import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createAuthedRouteClient } from '@/lib/supabase/routeAuth';
import { FEATURE_CREDIT_POLICIES, type AiCreditFeature } from '@/lib/billing/config';
import type { WalletSummary } from '@/lib/billing/types';

type BillingGuardSuccess = {
  ok: true;
  user: any;
  supabase: SupabaseClient;
  cost: number;
  eventType: 'generation_spend' | 'advanced_extraction_spend';
};

type BillingGuardFailure = {
  ok: false;
  status: number;
  body: Record<string, unknown>;
};

export type AdminClientAvailability =
  | {
      enabled: true;
      client: SupabaseClient;
      missingKeys: [];
      reason: null;
    }
  | {
      enabled: false;
      client: null;
      missingKeys: string[];
      reason: string;
    };

export function getPaystackCallbackUrl() {
  const appUrl =
    process.env.PAYSTACK_CALLBACK_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'http://localhost:3000';

  return `${appUrl.replace(/\/$/, '')}/billing/callback`;
}

export function getPaystackSecretKey() {
  return process.env.PAYSTACK_SECRET_KEY || '';
}

export function getPaystackPublicKey() {
  return process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '';
}

export function getAdminClientAvailability(): AdminClientAvailability {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const missingKeys: string[] = [];

  if (!supabaseUrl) {
    missingKeys.push('SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL');
  }

  if (!serviceRoleKey) {
    missingKeys.push('SUPABASE_SERVICE_ROLE_KEY');
  }

  if (missingKeys.length) {
    return {
      enabled: false,
      client: null,
      missingKeys,
      reason: 'Missing Supabase admin credentials',
    };
  }

  const resolvedSupabaseUrl = supabaseUrl as string;
  const resolvedServiceRoleKey = serviceRoleKey as string;

  return {
    enabled: true,
    client: createSupabaseAdminClient(resolvedSupabaseUrl, resolvedServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }),
    missingKeys: [],
    reason: null,
  };
}

export function buildAdminConfigFailure(feature: string) {
  const availability = getAdminClientAvailability();

  return {
    status: 503,
    body: {
      error: `${feature} is temporarily unavailable while admin services are being configured.`,
      code: 'ADMIN_CONFIG_MISSING',
      missingKeys: availability.enabled ? [] : availability.missingKeys,
    },
  };
}

export function createAdminClient() {
  const availability = getAdminClientAvailability();

  if (!availability.enabled) {
    const error = new Error('Supabase admin services are not configured.');
    (error as Error & { code?: string; status?: number; missingKeys?: string[] }).code = 'ADMIN_CONFIG_MISSING';
    (error as Error & { code?: string; status?: number; missingKeys?: string[] }).status = 503;
    (error as Error & { code?: string; status?: number; missingKeys?: string[] }).missingKeys = availability.missingKeys;
    throw error;
  }

  return availability.client;
}

export async function getWalletSummaryForUser(userId: string): Promise<WalletSummary> {
  const supabase = await createServerClient();

  const [{ data: profile }, { data: grants }, { data: transactions }, { data: events }, { data: referralCode }, { data: referralRedemptions }, { data: notifications }] = await Promise.all([
    supabase
      .from('profiles')
      .select('credit_balance, next_credit_expiry')
      .eq('id', userId)
      .single(),
    supabase
      .from('credit_grants')
      .select('id, source, credits_awarded, credits_remaining, expires_at, created_at, metadata')
      .eq('user_id', userId)
      .order('expires_at', { ascending: true })
      .limit(10),
    supabase
      .from('credit_transactions')
      .select('id, transaction_type, source, amount, description, created_at, metadata')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('credit_events')
      .select('id,event_type,source,amount,model_name,input_size,output_size,estimated_provider_cost,metadata,created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase.from('referral_codes').select('code').eq('user_id', userId).maybeSingle(),
    supabase
      .from('referral_redemptions')
      .select('id,status,suspicious,created_at')
      .or(`referrer_user_id.eq.${userId},referred_user_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('notification_events')
      .select('id,notification_type,status,payload,created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  return {
    balance: profile?.credit_balance ?? 0,
    nextExpiry: profile?.next_credit_expiry ?? null,
    grants: grants ?? [],
    transactions: transactions ?? [],
    events: events ?? [],
    referralCode: referralCode?.code ?? null,
    referralRedemptions: referralRedemptions ?? [],
    notifications: notifications ?? [],
  };
}

export async function requireCredits(
  request: Request,
  feature: AiCreditFeature
): Promise<BillingGuardSuccess | BillingGuardFailure> {
  const { supabase, user } = await createAuthedRouteClient(request);

  if (!user) {
    return {
      ok: false,
      status: 401,
      body: { error: 'Unauthorized' },
    };
  }

  const policy = FEATURE_CREDIT_POLICIES[feature];
  const { data, error } = await supabase.rpc('consume_user_credits', {
    target_user_id: user.id,
    requested_credits: policy.creditCost,
    usage_source: feature,
    usage_metadata: {
      route: feature,
    },
  });

  if (error) {
    return {
      ok: false,
      status: 500,
      body: { error: error.message || 'Failed to check credits' },
    };
  }

  if (!data?.success) {
    return {
      ok: false,
      status: 402,
      body: {
        error: 'Insufficient credits',
        code: 'INSUFFICIENT_CREDITS',
        cost: policy.creditCost,
        available: data?.available ?? 0,
      },
    };
  }

  return {
    ok: true,
    user,
    supabase,
    cost: policy.creditCost,
    eventType: policy.creditEventType,
  };
}

export async function recordCreditEvent(params: {
  supabase: SupabaseClient;
  userId: string;
  eventType: 'purchase' | 'grant' | 'referral_bonus' | 'generation_spend' | 'advanced_extraction_spend' | 'adjustment' | 'expiry' | 'refund';
  source: string;
  amount: number;
  modelName?: string | null;
  inputSize?: number | null;
  outputSize?: number | null;
  estimatedProviderCost?: number;
  metadata?: Record<string, unknown>;
}) {
  await params.supabase.from('credit_events').insert({
    user_id: params.userId,
    event_type: params.eventType,
    source: params.source,
    amount: params.amount,
    model_name: params.modelName ?? null,
    input_size: params.inputSize ?? null,
    output_size: params.outputSize ?? null,
    estimated_provider_cost: params.estimatedProviderCost ?? 0,
    metadata: params.metadata ?? {},
  });
}

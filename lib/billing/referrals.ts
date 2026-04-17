import { getAdminClientAvailability, recordCreditEvent } from '@/lib/billing/server';
import { trackServerEvent } from '@/lib/analytics/server';

function buildReferralCode(userId: string) {
  return `VUI-${userId.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

export async function ensureReferralCode(userId: string) {
  const adminAvailability = getAdminClientAvailability();
  if (!adminAvailability.enabled) {
    return null;
  }

  const admin = adminAvailability.client;
  const { data: existing } = await admin.from('referral_codes').select('id,code,is_active').eq('user_id', userId).maybeSingle();
  if (existing) return existing;

  const code = buildReferralCode(userId);
  const { data } = await admin
    .from('referral_codes')
    .insert({
      user_id: userId,
      code,
      is_active: true,
    })
    .select('id,code,is_active')
    .single();

  return data;
}

export async function redeemReferralCode(params: {
  referredUserId: string;
  code: string;
  metadata?: Record<string, unknown>;
}) {
  const adminAvailability = getAdminClientAvailability();
  if (!adminAvailability.enabled) {
    const error = new Error('Referral credits are temporarily unavailable while admin services are being configured.');
    (error as Error & { code?: string; status?: number; missingKeys?: string[] }).code = 'ADMIN_CONFIG_MISSING';
    (error as Error & { code?: string; status?: number; missingKeys?: string[] }).status = 503;
    (error as Error & { code?: string; status?: number; missingKeys?: string[] }).missingKeys = adminAvailability.missingKeys;
    throw error;
  }

  const admin = adminAvailability.client;
  const referral = await ensureReferralCode(params.referredUserId);
  if (referral?.code === params.code) {
    throw new Error('You cannot redeem your own referral code');
  }

  const { data: codeRow } = await admin
    .from('referral_codes')
    .select('id,user_id,code,is_active')
    .eq('code', params.code)
    .eq('is_active', true)
    .single();

  if (!codeRow) {
    throw new Error('Referral code not found');
  }

  const { data: existing } = await admin
    .from('referral_redemptions')
    .select('id')
    .eq('referred_user_id', params.referredUserId)
    .maybeSingle();

  if (existing) {
    throw new Error('Referral already redeemed for this account');
  }

  const suspicious = params.metadata?.deviceFingerprint === params.metadata?.referrerDeviceFingerprint;

  const { data: redemption } = await admin
    .from('referral_redemptions')
    .insert({
      referral_code_id: codeRow.id,
      referrer_user_id: codeRow.user_id,
      referred_user_id: params.referredUserId,
      status: suspicious ? 'pending_review' : 'approved',
      suspicious,
      suspicious_reason: suspicious ? 'matching_device_fingerprint' : null,
      review_status: suspicious ? 'needs_review' : 'approved',
      metadata: params.metadata ?? {},
    })
    .select('*')
    .single();

  if (!redemption) {
    throw new Error('Failed to record referral redemption');
  }

  if (!suspicious) {
    const grantMetadata = {
      grant_kind: 'referral_bonus',
      referred_user_id: params.referredUserId,
      referral_code: params.code,
    };

    await admin.rpc('grant_credit_lot', {
      target_user_id: codeRow.user_id,
      granted_credits: 200,
      grant_source: 'admin_adjustment',
      grant_expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString(),
      grant_metadata: grantMetadata,
      grant_description: 'Referral bonus',
    });

    await recordCreditEvent({
      supabase: admin,
      userId: codeRow.user_id,
      eventType: 'referral_bonus',
      source: 'referral_program',
      amount: 200,
      metadata: grantMetadata,
    });

    await admin.from('notification_events').upsert(
      {
        user_id: codeRow.user_id,
        notification_type: 'referral_success',
        channel: 'in_app',
        dedupe_key: `referral-success:${redemption.id}`,
        status: 'queued',
        payload: {
          code: params.code,
          credits: 200,
        },
      },
      { onConflict: 'dedupe_key' }
    );

    await trackServerEvent({
      userId: codeRow.user_id,
      eventName: 'referral_applied',
      idempotencyKey: `referral-applied:${redemption.id}`,
      properties: {
        referredUserId: params.referredUserId,
        code: params.code,
      },
    });
  }

  return redemption;
}

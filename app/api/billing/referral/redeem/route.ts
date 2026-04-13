import { NextResponse } from 'next/server';
import { createAuthedRouteClient } from '@/lib/supabase/routeAuth';
import { redeemReferralCode } from '@/lib/billing/referrals';

export async function POST(request: Request) {
  try {
    const { user } = await createAuthedRouteClient(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code, deviceFingerprint } = await request.json();
    if (!code) {
      return NextResponse.json({ error: 'Referral code is required' }, { status: 400 });
    }

    const redemption = await redeemReferralCode({
      referredUserId: user.id,
      code: String(code).trim().toUpperCase(),
      metadata: {
        deviceFingerprint: deviceFingerprint ?? null,
      },
    });

    return NextResponse.json({ success: true, redemption });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to redeem referral code' }, { status: 400 });
  }
}

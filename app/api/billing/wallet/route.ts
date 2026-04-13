import { NextResponse } from 'next/server';
import { createAuthedRouteClient } from '@/lib/supabase/routeAuth';
import { getWalletSummaryForUser } from '@/lib/billing/server';
import { ensureReferralCode } from '@/lib/billing/referrals';
import { ensureLifecycleNotifications } from '@/lib/billing/lifecycle';

export async function GET(request: Request) {
  try {
    const { user } = await createAuthedRouteClient(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureReferralCode(user.id);
    const wallet = await getWalletSummaryForUser(user.id);
    await ensureLifecycleNotifications(user.id, wallet);
    return NextResponse.json(wallet);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to load wallet' }, { status: 500 });
  }
}

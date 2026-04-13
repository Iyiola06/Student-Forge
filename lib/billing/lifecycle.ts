import { createAdminClient } from '@/lib/billing/server';
import type { WalletSummary } from '@/lib/billing/types';

export async function ensureLifecycleNotifications(userId: string, wallet: WalletSummary) {
  const admin = createAdminClient();

  if (wallet.balance > 0 && wallet.balance <= 120) {
    await admin.from('notification_events').upsert(
      {
        user_id: userId,
        notification_type: 'low_balance_warning',
        channel: 'in_app',
        dedupe_key: `low-balance:${userId}:${wallet.balance <= 60 ? 'critical' : 'warning'}`,
        status: 'queued',
        payload: { balance: wallet.balance },
      },
      { onConflict: 'dedupe_key' }
    );
  }

  if (wallet.nextExpiry) {
    const expiry = new Date(wallet.nextExpiry).getTime();
    const days = Math.ceil((expiry - Date.now()) / (1000 * 60 * 60 * 24));
    if (days >= 0 && days <= 7) {
      await admin.from('notification_events').upsert(
        {
          user_id: userId,
          notification_type: 'upcoming_expiry_warning',
          channel: 'in_app',
          dedupe_key: `expiry-warning:${userId}:${wallet.nextExpiry}`,
          status: 'queued',
          payload: { nextExpiry: wallet.nextExpiry, daysRemaining: days },
        },
        { onConflict: 'dedupe_key' }
      );
    }
  }
}

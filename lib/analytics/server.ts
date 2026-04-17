import { getAdminClientAvailability } from '@/lib/billing/server';
import type { ProductAnalyticsEvent } from '@/types/product';

export async function trackServerEvent(options: {
  userId?: string | null;
  eventName: ProductAnalyticsEvent;
  idempotencyKey: string;
  properties?: Record<string, unknown>;
}) {
  const adminAvailability = getAdminClientAvailability();
  if (!adminAvailability.enabled) {
    return;
  }

  const admin = adminAvailability.client;
  await admin.from('app_analytics_events').upsert(
    {
      user_id: options.userId ?? null,
      event_name: options.eventName,
      idempotency_key: options.idempotencyKey,
      properties: options.properties ?? {},
    },
    { onConflict: 'idempotency_key' }
  );
}

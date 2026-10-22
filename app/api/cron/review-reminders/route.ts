import { NextResponse } from 'next/server';
import webPush from 'web-push';
import { createAdminClient } from '@/lib/billing/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_USERS_PER_RUN = 500;

/**
 * Daily push reminder: "You have N cards due". Runs from Vercel Cron (vercel.json).
 * Skips students who opted out, already studied today, or were reminded in the last 20 hours.
 */
export async function GET(request: Request) {
  if (process.env.CRON_SECRET && request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const publicKey = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    return NextResponse.json({ error: 'VAPID keys are not configured' }, { status: 500 });
  }
  webPush.setVapidDetails('mailto:hello@sulvatech.com', publicKey, privateKey);

  const admin = createAdminClient();
  const now = new Date();
  const today = new Date(now.getTime() + 60 * 60 * 1000).toISOString().slice(0, 10); // Africa/Lagos date
  const cutoff = new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString();

  const { data: subscriptions } = await admin.from('push_subscriptions').select('id,user_id,subscription').limit(5000);
  const byUser = new Map<string, Array<{ id: string; subscription: unknown }>>();
  for (const sub of subscriptions ?? []) {
    if (!sub.user_id) continue;
    byUser.set(sub.user_id, [...(byUser.get(sub.user_id) ?? []), { id: sub.id, subscription: sub.subscription }]);
  }

  const userIds = [...byUser.keys()].slice(0, MAX_USERS_PER_RUN);
  if (!userIds.length) return NextResponse.json({ sent: 0, users: 0 });

  const [{ data: profiles }, { data: optOuts }] = await Promise.all([
    admin.from('profiles').select('id,full_name,streak_days,last_active_date,last_reminder_sent_at').in('id', userIds),
    admin.from('notification_preferences').select('user_id').eq('preference_type', 'due_review').eq('channel', 'push').eq('enabled', false).in('user_id', userIds),
  ]);
  const optedOut = new Set((optOuts ?? []).map((row) => row.user_id));

  let sent = 0;
  for (const profile of profiles ?? []) {
    if (optedOut.has(profile.id)) continue;
    if (profile.last_active_date && String(profile.last_active_date).slice(0, 10) === today) continue;
    if (profile.last_reminder_sent_at && profile.last_reminder_sent_at > cutoff) continue;

    const { count } = await admin
      .from('review_items')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .lte('due_at', now.toISOString())
      .neq('review_state', 'mastered');
    if (!count) continue;

    const minutes = Math.max(2, Math.round(count * 0.5));
    const streak = Number(profile.streak_days || 0);
    const payload = JSON.stringify({
      title: streak >= 2 ? `Keep your ${streak}-day streak alive` : 'Your cards are ready',
      body: `${count} card${count === 1 ? '' : 's'} due. About ${minutes} min locks them into memory before they fade.`,
      url: '/review',
    });

    let delivered = false;
    for (const sub of byUser.get(profile.id) ?? []) {
      try {
        await webPush.sendNotification(sub.subscription as webPush.PushSubscription, payload);
        delivered = true;
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) await admin.from('push_subscriptions').delete().eq('id', sub.id);
      }
    }
    if (delivered) {
      sent++;
      await admin.from('profiles').update({ last_reminder_sent_at: now.toISOString() }).eq('id', profile.id);
    }
  }

  return NextResponse.json({ sent, users: userIds.length });
}

import { NextResponse } from 'next/server';
import { buildAdminConfigFailure, getAdminClientAvailability, getPaystackSecretKey, recordCreditEvent } from '@/lib/billing/server';
import { trackServerEvent } from '@/lib/analytics/server';
import { verifyPaystackSignature } from '@/lib/billing/paystackWebhook';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-paystack-signature');

  try {
    if (!verifyPaystackSignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const data = event?.data;
    const reference = data?.reference;
    const userId = data?.metadata?.user_id;
    const bundleId = data?.metadata?.bundle_id;
    const credits = Number(data?.metadata?.credits || 0);

    if (!reference || !userId) {
      return NextResponse.json({ received: true });
    }

    const secretKey = getPaystackSecretKey();
    if (!secretKey) {
      return NextResponse.json({ error: 'Paystack secret key is missing' }, { status: 500 });
    }

    const adminAvailability = getAdminClientAvailability();
    if (!adminAvailability.enabled) {
      const failure = buildAdminConfigFailure('Wallet webhooks');
      return NextResponse.json(failure.body, { status: failure.status });
    }

    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
      cache: 'no-store',
    });
    const payload = await verifyRes.json();

    if (verifyRes.ok && payload.status && payload.data?.status === 'success' && credits > 0) {
      const admin = adminAvailability.client;
      await admin.rpc('finalize_paystack_credit_purchase', {
        target_user_id: userId,
        payment_reference: reference,
        selected_bundle_id: String(bundleId || ''),
        amount_paid_kobo: Number(payload.data.amount || 0),
        credits_purchased: credits,
        payment_status: 'success',
        payment_metadata: payload.data,
      });

      await recordCreditEvent({
        supabase: admin,
        userId,
        eventType: 'purchase',
        source: 'paystack',
        amount: credits,
        metadata: {
          reference,
          bundleId,
          amountPaid: Number(payload.data.amount || 0),
        },
      });

      await admin.from('notification_events').upsert(
        {
          user_id: userId,
          notification_type: 'purchase_confirmation',
          channel: 'in_app',
          dedupe_key: `purchase-confirmation:${reference}`,
          status: 'queued',
          payload: {
            reference,
            bundleId,
            credits,
            amountPaid: Number(payload.data.amount || 0),
          },
        },
        { onConflict: 'dedupe_key' }
      );

      await trackServerEvent({
        userId,
        eventName: 'credits_purchased',
        idempotencyKey: `credits-purchased:${reference}`,
        properties: {
          bundleId,
          credits,
          amountPaid: Number(payload.data.amount || 0),
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    if (error?.code === 'ADMIN_CONFIG_MISSING') {
      return NextResponse.json(
        {
          error: 'Wallet webhooks are temporarily unavailable while admin services are being configured.',
          code: 'ADMIN_CONFIG_MISSING',
          missingKeys: error.missingKeys ?? [],
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: error.message || 'Webhook processing failed' }, { status: 500 });
  }
}

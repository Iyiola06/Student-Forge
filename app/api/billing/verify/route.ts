import { NextResponse } from 'next/server';
import { createAuthedRouteClient } from '@/lib/supabase/routeAuth';
import { createAdminClient, getPaystackSecretKey, getWalletSummaryForUser, recordCreditEvent } from '@/lib/billing/server';
import { trackServerEvent } from '@/lib/analytics/server';

export async function POST(request: Request) {
  try {
    const { user } = await createAuthedRouteClient(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secretKey = getPaystackSecretKey();
    if (!secretKey) {
      return NextResponse.json({ error: 'Paystack secret key is missing' }, { status: 500 });
    }

    const { reference } = await request.json();
    if (!reference) {
      return NextResponse.json({ error: 'Payment reference is required' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: existingTx } = await admin
      .from('paystack_transactions')
      .select('reference, user_id, bundle_id, credit_grant_id')
      .eq('reference', reference)
      .single();

    if (!existingTx || existingTx.user_id !== user.id) {
      return NextResponse.json({ error: 'Payment reference not found' }, { status: 404 });
    }

    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
      cache: 'no-store',
    });

    const payload = await verifyRes.json();
    if (!verifyRes.ok || !payload.status) {
      return NextResponse.json({ error: payload.message || 'Failed to verify payment' }, { status: 400 });
    }

    const credits = Number(payload.data?.metadata?.credits || 0);
    const bundleId = String(payload.data?.metadata?.bundle_id || existingTx.bundle_id || '');
    const amountPaid = Number(payload.data?.amount || 0);
    const status = String(payload.data?.status || 'unknown');

    if (status === 'success' && credits > 0) {
      const { error } = await admin.rpc('finalize_paystack_credit_purchase', {
        target_user_id: user.id,
        payment_reference: reference,
        selected_bundle_id: bundleId,
        amount_paid_kobo: amountPaid,
        credits_purchased: credits,
        payment_status: status,
        payment_metadata: payload.data,
      });

      if (error) {
        return NextResponse.json({ error: error.message || 'Failed to finalize payment' }, { status: 500 });
      }

      await recordCreditEvent({
        supabase: admin,
        userId: user.id,
        eventType: 'purchase',
        source: 'paystack',
        amount: credits,
        metadata: {
          reference,
          bundleId,
          amountPaid,
        },
      });

      await admin.from('notification_events').upsert(
        {
          user_id: user.id,
          notification_type: 'purchase_confirmation',
          channel: 'in_app',
          dedupe_key: `purchase-confirmation:${reference}`,
          status: 'queued',
          payload: {
            reference,
            bundleId,
            credits,
            amountPaid,
          },
        },
        { onConflict: 'dedupe_key' }
      );

      await trackServerEvent({
        userId: user.id,
        eventName: 'credits_purchased',
        idempotencyKey: `credits-purchased:${reference}`,
        properties: {
          bundleId,
          credits,
          amountPaid,
        },
      });
    }

    const wallet = await getWalletSummaryForUser(user.id);

    return NextResponse.json({
      status,
      wallet,
      reference,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to verify payment' }, { status: 500 });
  }
}

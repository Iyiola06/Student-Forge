import { NextResponse } from 'next/server';
import { createAuthedRouteClient } from '@/lib/supabase/routeAuth';
import { createAdminClient, getPaystackCallbackUrl, getPaystackSecretKey } from '@/lib/billing/server';
import { getCreditBundle } from '@/lib/billing/config';

export async function POST(request: Request) {
  try {
    const { user } = await createAuthedRouteClient(request);

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secretKey = getPaystackSecretKey();
    if (!secretKey) {
      return NextResponse.json({ error: 'Paystack secret key is missing' }, { status: 500 });
    }

    const { bundleId } = await request.json();
    const bundle = getCreditBundle(bundleId);

    if (!bundle) {
      return NextResponse.json({ error: 'Unknown credit bundle' }, { status: 400 });
    }

    const reference = `vui_${user.id.replace(/-/g, '').slice(0, 12)}_${Date.now()}`;
    const callback_url = `${getPaystackCallbackUrl()}?reference=${encodeURIComponent(reference)}`;

    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        amount: bundle.amountKobo,
        reference,
        callback_url,
        metadata: {
          user_id: user.id,
          bundle_id: bundle.id,
          credits: bundle.credits,
        },
      }),
    });

    const payload = await paystackRes.json();

    if (!paystackRes.ok || !payload.status) {
      return NextResponse.json(
        { error: payload.message || 'Failed to initialize Paystack checkout' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    await admin.from('paystack_transactions').upsert(
      {
        user_id: user.id,
        reference,
        access_code: payload.data.access_code,
        bundle_id: bundle.id,
        status: 'initialized',
        amount_paid: bundle.amountKobo,
        customer_email: user.email,
        raw_response: payload.data,
      },
      { onConflict: 'reference' }
    );

    return NextResponse.json({
      authorizationUrl: payload.data.authorization_url,
      accessCode: payload.data.access_code,
      reference,
      bundle,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to initialize checkout' }, { status: 500 });
  }
}

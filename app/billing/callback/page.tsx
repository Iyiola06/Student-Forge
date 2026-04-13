'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

function BillingCallbackInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get('reference');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Confirming your Paystack payment...');

  useEffect(() => {
    if (!reference) {
      setStatus('error');
      setMessage('Missing payment reference.');
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch('/api/billing/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference }),
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to verify payment');
        }

        setStatus('success');
        setMessage('Credits added successfully. Redirecting to your wallet...');
        setTimeout(() => router.push('/settings'), 1800);
      } catch (error: any) {
        setStatus('error');
        setMessage(error.message || 'We could not confirm the payment.');
      }
    };

    verify();
  }, [reference, router]);

  return (
    <main className="min-h-screen bg-[#08140d] px-6 py-20 text-white">
      <div className="mx-auto max-w-xl rounded-[2rem] border border-white/10 bg-white/5 p-10 text-center shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-white/10">
          <span className="material-symbols-outlined text-3xl">
            {status === 'error' ? 'error' : status === 'success' ? 'verified' : 'sync'}
          </span>
        </div>
        <h1 className="mt-6 text-3xl font-black">Wallet Update</h1>
        <p className="mt-3 text-sm text-white/75">{message}</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/settings"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[#1a5c2a] px-5 text-sm font-bold text-white"
          >
            Open Wallet
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-white/15 px-5 text-sm font-bold text-white"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function BillingCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#08140d] px-6 py-20 text-white">
          <div className="mx-auto max-w-xl rounded-[2rem] border border-white/10 bg-white/5 p-10 text-center shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-white/10">
              <span className="material-symbols-outlined text-3xl">sync</span>
            </div>
            <h1 className="mt-6 text-3xl font-black">Wallet Update</h1>
            <p className="mt-3 text-sm text-white/75">Confirming your Paystack payment...</p>
          </div>
        </main>
      }
    >
      <BillingCallbackInner />
    </Suspense>
  );
}

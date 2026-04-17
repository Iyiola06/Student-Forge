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
    <main className="main-bg min-h-screen px-4 py-16 text-slate-950 dark:text-white">
      <div className="glass-panel mx-auto max-w-xl p-8 text-center md:p-10">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#163f73]/8 text-[#163f73] dark:bg-white/8 dark:text-[#f6b252]">
          <span className="material-symbols-outlined text-3xl">
            {status === 'error' ? 'error' : status === 'success' ? 'verified' : 'sync'}
          </span>
        </div>
        <h1 className="mt-6 text-[25px] font-black tracking-[-0.05em] text-slate-950 dark:text-white">Wallet update</h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{message}</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/settings" className="primary-button !h-11 !rounded-xl !px-5">
            Open Wallet
          </Link>
          <Link href="/dashboard" className="secondary-button !h-11 !rounded-xl !px-5">
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
        <main className="main-bg min-h-screen px-4 py-16 text-slate-950 dark:text-white">
          <div className="glass-panel mx-auto max-w-xl p-8 text-center md:p-10">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#163f73]/8 text-[#163f73] dark:bg-white/8 dark:text-[#f6b252]">
              <span className="material-symbols-outlined text-3xl">sync</span>
            </div>
            <h1 className="mt-6 text-[25px] font-black tracking-[-0.05em] text-slate-950 dark:text-white">Wallet update</h1>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Confirming your Paystack payment...</p>
          </div>
        </main>
      }
    >
      <BillingCallbackInner />
    </Suspense>
  );
}

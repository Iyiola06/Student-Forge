'use client';

import Link from 'next/link';
import { useProfile } from '@/hooks/useProfile';

export default function CreditStatusBanner({
  featureLabel,
  creditCost,
}: {
  featureLabel: string;
  creditCost: number;
}) {
  const { profile } = useProfile();
  const balance = profile?.credit_balance ?? 0;
  const nextExpiry = profile?.next_credit_expiry;
  const isLowBalance = balance > 0 && balance <= creditCost * 3;

  return (
    <div className="rounded-2xl border border-[#1a5c2a]/15 bg-gradient-to-r from-[#0f2314] via-[#12391d] to-[#1b4a2d] p-4 text-white shadow-[0_16px_50px_rgba(12,37,20,0.25)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-200/80">
            Credit Wallet
          </p>
          <h3 className="mt-1 text-lg font-black">
            {featureLabel} costs {creditCost} credits
          </h3>
          <p className="mt-1 text-sm text-emerald-50/80">
            Balance: <span className="font-bold text-white">{balance}</span>
            {nextExpiry ? ` • next expiry ${new Date(nextExpiry).toLocaleDateString()}` : ''}
          </p>
        </div>
        <Link
          href="/wallet"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 px-4 text-sm font-bold text-white transition hover:bg-white/20"
        >
          Buy Credits
        </Link>
      </div>
      {isLowBalance && (
        <p className="mt-3 text-sm text-amber-200">
          You are running low. Top up before your next AI session is blocked.
        </p>
      )}
    </div>
  );
}

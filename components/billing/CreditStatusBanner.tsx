'use client';

import Link from 'next/link';
import { useProfile } from '@/hooks/useProfile';
import Icon3D from '@/components/ui/Icon3D';
import { cn } from '@/lib/utils';

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
  const isEmpty = balance < creditCost;

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-[22px] border p-3 pr-3.5 sm:gap-4',
        isEmpty || isLowBalance ? 'border-transparent bg-[var(--warning-soft)]' : 'border-[var(--line)] bg-[var(--card-glass)] backdrop-blur-md'
      )}
    >
      <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--card)]">
        <Icon3D name="coin" size={28} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium text-[var(--text-strong)]">
          {featureLabel} costs {creditCost} credits
        </p>
        <p className="text-[12.5px] text-[var(--text-soft)]">
          {isEmpty
            ? `You have ${balance} credits. Top up to run this.`
            : isLowBalance
              ? `Running low: ${balance} credits left.`
              : `Balance ${balance} credits${nextExpiry ? ` • next expiry ${new Date(nextExpiry).toLocaleDateString()}` : ''}`}
        </p>
      </div>
      <Link href="/wallet" className={cn('!h-9 shrink-0 !px-4', isEmpty || isLowBalance ? 'primary-button' : 'secondary-button')}>
        Top up
      </Link>
    </div>
  );
}

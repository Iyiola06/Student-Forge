'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type AppPageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  walletBalance?: number;
};

export default function AppPageHeader({ eyebrow, title, description, actions, walletBalance }: AppPageHeaderProps) {
  const pathname = usePathname();
  const showWalletSummary = pathname !== '/wallet' && walletBalance !== undefined;

  return (
    <div className="app-topbar">
      <div className="min-w-0">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <div className={eyebrow ? 'mt-1.5' : ''}>
          <h1 className="text-[24px] leading-[1.02] font-black tracking-[-0.05em] text-slate-950 sm:text-[28px] dark:text-white">{title}</h1>
          {description ? <p className="mt-3 max-w-[64ch] text-sm leading-7 text-slate-500 dark:text-slate-300">{description}</p> : null}
        </div>
      </div>
      <div className="flex w-full flex-wrap items-center justify-start gap-2 sm:w-auto sm:justify-end">
        {showWalletSummary ? (
          <Link href="/wallet" className="app-toolbar-chip hidden md:inline-flex">
            <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
            {walletBalance} credits
          </Link>
        ) : null}
        {actions}
      </div>
    </div>
  );
}

'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/layout/Sidebar';
import { useProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';

type AppShellProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  sidebar?: ReactNode;
  children: ReactNode;
  contentClassName?: string;
};

export default function AppShell({
  title,
  description,
  eyebrow,
  actions,
  sidebar,
  children,
  contentClassName,
}: AppShellProps) {
  const { profile } = useProfile();

  return (
    <div className="main-bg min-h-screen">
      <div className="app-shell flex-col md:flex-row">
        <Sidebar />
        <div className="min-w-0 flex-1 pb-24 md:pb-0">
          <div className="app-topbar">
            <div className="min-w-0">
              {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
              <h1 className={cn('text-[25px] leading-[1.05] font-black tracking-[-0.05em] text-slate-950 dark:text-white', eyebrow ? 'mt-1.5' : '')}>
                {title}
              </h1>
              {description ? (
                <p className="mt-2 max-w-[62ch] text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              <Link href="/wallet" className="metric-chip hidden md:inline-flex">
                <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
                {profile?.credit_balance ?? 0} credits
              </Link>
              {actions}
            </div>
          </div>

          <div className={cn('mt-5 grid gap-5', sidebar ? 'xl:grid-cols-[minmax(0,1fr)_320px]' : 'xl:grid-cols-1')}>
            <div className={cn('min-w-0', contentClassName)}>{children}</div>
            {sidebar ? <aside className="space-y-6">{sidebar}</aside> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

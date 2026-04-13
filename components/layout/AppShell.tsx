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
  eyebrow = 'Study Workspace',
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
        <div className="min-w-0 flex-1">
          <div className="app-topbar">
            <div className="min-w-0">
              <p className="eyebrow">{eyebrow}</p>
              <h1 className="mt-1.5 text-2xl font-black tracking-[-0.05em] text-slate-950 dark:text-white md:text-3xl">
                {title}
              </h1>
              {description ? (
                <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {description}
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <Link href="/wallet" className="metric-chip hidden md:inline-flex">
                <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
                {profile?.credit_balance ?? 0} credits
              </Link>
              {actions}
            </div>
          </div>

          <div className={cn('mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]', !sidebar && 'xl:grid-cols-1')}>
            <div className={cn('min-w-0', contentClassName)}>{children}</div>
            {sidebar ? <aside className="space-y-6">{sidebar}</aside> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

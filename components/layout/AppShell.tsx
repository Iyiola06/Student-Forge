'use client';

import type { ReactNode } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import AppPageHeader from '@/components/app/AppPageHeader';
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
  hideHeader?: boolean;
};

export default function AppShell({
  title,
  description,
  eyebrow,
  actions,
  sidebar,
  children,
  contentClassName,
  hideHeader,
}: AppShellProps) {
  const { profile } = useProfile();

  return (
    <div className="main-bg min-h-screen">
      <div className="app-shell">
        <Sidebar />
        <div className="min-w-0 flex-1 pb-28 lg:pb-0">
          {hideHeader ? (
            <h1 className="sr-only">{title}</h1>
          ) : (
            <AppPageHeader
              eyebrow={eyebrow}
              title={title}
              description={description}
              actions={actions}
              walletBalance={profile?.credit_balance ?? 0}
            />
          )}

          <div className={cn('app-page-body', hideHeader && 'mt-0 lg:mt-0', sidebar ? 'xl:grid-cols-[minmax(0,1fr)_320px]' : 'xl:grid-cols-1')}>
            <div className={cn('min-w-0', contentClassName)}>{children}</div>
            {sidebar ? <aside className="space-y-6">{sidebar}</aside> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

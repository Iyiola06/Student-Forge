'use client';

import type { ReactNode } from 'react';
import BrandLogo from '@/components/ui/BrandLogo';

type AuthShellProps = {
  headerAction?: ReactNode;
  preview: ReactNode;
  children: ReactNode;
};

export default function AuthShell({ headerAction, preview, children }: AuthShellProps) {
  return (
    <div className="px-4 py-5 md:px-6 md:py-6">
      <div className="auth-shell">
        <header className="auth-header">
          <BrandLogo subtitle="Daily study workspace" />
          {headerAction}
        </header>

        <div className="auth-grid">
          <section className="auth-preview-panel order-2 lg:order-1">{preview}</section>
          <section className="auth-form-panel order-1 lg:order-2">{children}</section>
        </div>
      </div>
    </div>
  );
}

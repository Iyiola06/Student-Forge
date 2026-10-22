'use client';

import type { ReactNode } from 'react';
import BrandLogo from '@/components/ui/BrandLogo';
import Icon3D from '@/components/ui/Icon3D';

type AuthShellProps = {
  headerAction?: ReactNode;
  preview: ReactNode;
  children: ReactNode;
};

export default function AuthShell({ headerAction, preview, children }: AuthShellProps) {
  return (
    <div className="min-h-screen px-4 py-5 md:px-6 md:py-6 lg:py-8">
      <div className="auth-shell">
        <header className="auth-header">
          <BrandLogo />
          {headerAction}
        </header>

        <div className="auth-grid">
          <section className="auth-preview-panel order-2 xl:order-1">
            <div aria-hidden className="pointer-events-none absolute top-6 right-6 hidden h-[170px] w-[220px] md:block">
              <Icon3D name="grad-cap" size={54} className="absolute top-0 left-6 -rotate-12 animate-float" />
              <Icon3D name="sparkles" size={36} className="absolute top-2 right-2 animate-float [animation-delay:1s]" />
              <Icon3D name="woman-hand" size={150} priority className="absolute right-4 bottom-0" />
            </div>
            <div className="relative">{preview}</div>
          </section>
          <section className="auth-form-panel order-1 xl:order-2">{children}</section>
        </div>
      </div>
    </div>
  );
}

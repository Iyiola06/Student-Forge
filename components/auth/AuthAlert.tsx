'use client';

import type { ReactNode } from 'react';

type AuthAlertProps = {
  tone: 'error' | 'success';
  children: ReactNode;
};

export default function AuthAlert({ tone, children }: AuthAlertProps) {
  return (
    <div className="auth-alert" data-tone={tone}>
      {children}
    </div>
  );
}

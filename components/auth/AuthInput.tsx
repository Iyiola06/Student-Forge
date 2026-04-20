'use client';

import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type AuthInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon?: string;
  endAdornment?: ReactNode;
  inputClassName?: string;
};

export default function AuthInput({ label, icon, endAdornment, className, inputClassName, ...props }: AuthInputProps) {
  return (
    <label className={cn('block', className)}>
      <span className="auth-label">{label}</span>
      <div className="auth-input-wrap">
        {icon ? (
          <span className="auth-input-icon">
            <span className="material-symbols-outlined text-[18px]">{icon}</span>
          </span>
        ) : null}
        <input className={cn('auth-input', icon ? 'auth-input-with-icon' : null, inputClassName)} {...props} />
        {endAdornment ? <span className="auth-input-trailing">{endAdornment}</span> : null}
      </div>
    </label>
  );
}

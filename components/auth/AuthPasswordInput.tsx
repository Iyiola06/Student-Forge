'use client';

import { useState } from 'react';
import type { InputHTMLAttributes } from 'react';
import AuthInput from '@/components/auth/AuthInput';

type AuthPasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
  icon?: string;
};

export default function AuthPasswordInput({ label, icon = 'lock', ...props }: AuthPasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <AuthInput
      {...props}
      label={label}
      icon={icon}
      type={isVisible ? 'text' : 'password'}
      endAdornment={
        <button
          type="button"
          onClick={() => setIsVisible((value) => !value)}
          className="text-slate-400 transition hover:text-slate-700 dark:text-slate-500 dark:hover:text-white"
          aria-label={isVisible ? 'Hide password' : 'Show password'}
        >
          <span className="material-symbols-outlined text-[18px]">{isVisible ? 'visibility' : 'visibility_off'}</span>
        </button>
      }
    />
  );
}

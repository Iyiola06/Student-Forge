'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const clamped = Math.min(score, 4);
  const labels = ['Too weak', 'Weak', 'Medium', 'Strong', 'Very strong'];
  const colors = ['bg-red-500', 'bg-[#1a5c2a]', 'bg-yellow-500', 'bg-green-500', 'bg-emerald-500'];
  return { score: clamped, label: labels[clamped], color: colors[clamped] };
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setSuccess(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="main-bg font-display min-h-screen flex flex-col antialiased selection:bg-[#1a5c2a]/30 selection:text-[#1a5c2a]">
      <div className="layout-container flex h-full grow flex-col">
        {/* Header */}
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-[#3b3b54] px-4 sm:px-10 py-3 bg-white dark:bg-[#101022]/80 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-4 text-slate-900 dark:text-white">
            <div className="relative size-8 flex items-center justify-center">
              <Image
                src="/logo-favicon.png"
                alt="Vui Studify Logo"
                width={32}
                height={32}
                className="object-contain rounded-full"
                priority
              />
            </div>
            <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">
              Vui Studify
            </h2>
          </div>
          <div className="hidden sm:flex flex-1 justify-end gap-8">
            <div className="flex items-center gap-9">
              <Link
                className="text-slate-600 dark:text-slate-200 hover:text-[#1a5c2a] dark:hover:text-[#1a5c2a] transition-colors text-sm font-medium leading-normal"
                href="/login"
              >
                Log In
              </Link>
            </div>
            <Link href="/signup">
              <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-9 px-4 bg-[#1a5c2a] hover:bg-blue-700 text-white text-sm font-bold leading-normal tracking-[0.015em] transition-all shadow-lg shadow-[#1a5c2a]/20">
                <span className="truncate">Sign Up</span>
              </button>
            </Link>
          </div>
        </header>
        {/* Main Content */}
        <main className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
          <div className="w-full max-w-md space-y-8 premium-card glass-card p-8">
            {/* Header Section */}
            <div className="flex flex-col gap-3 text-center sm:text-left">
              <h1 className="text-slate-900 dark:text-white text-3xl sm:text-4xl font-black leading-tight tracking-[-0.033em]">
                Reset Password
              </h1>
              <p className="text-slate-500 dark:text-[#9c9cba] text-base font-normal leading-relaxed">
                Enter your new password below.
              </p>
            </div>
            {/* Form Section */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}
            {success ? (
              <div className="mb-4 p-4 rounded-lg bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400 text-sm text-center">
                <span className="block material-symbols-outlined text-4xl mb-2 mx-auto text-green-500">check_circle</span>
                Your password has been reset successfully. Redirecting you to login...
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="mt-8 space-y-6">
                <div className="space-y-4">
                  <label className="block" htmlFor="new-password">
                    <span className="block text-sm font-medium leading-6 text-slate-900 dark:text-white mb-2">
                      New Password
                    </span>
                    <div className="relative mt-2 rounded-md shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="material-symbols-outlined text-slate-400 text-[20px]">
                          lock
                        </span>
                      </div>
                      <input
                        className="block w-full rounded-lg border-0 py-3 pl-10 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-[#3b3b54] placeholder:text-slate-400 dark:placeholder:text-[#9c9cba] focus:ring-2 focus:ring-inset focus:ring-[#1a5c2a] sm:text-sm sm:leading-6 bg-transparent dark:bg-[#101022]/50 disabled:opacity-50"
                        id="new-password"
                        name="new-password"
                        placeholder="Enter new password"
                        required
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  </label>
                  <label className="block" htmlFor="confirm-password">
                    <span className="block text-sm font-medium leading-6 text-slate-900 dark:text-white mb-2">
                      Confirm Password
                    </span>
                    <div className="relative mt-2 rounded-md shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="material-symbols-outlined text-slate-400 text-[20px]">
                          lock_reset
                        </span>
                      </div>
                      <input
                        className="block w-full rounded-lg border-0 py-3 pl-10 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-[#3b3b54] placeholder:text-slate-400 dark:placeholder:text-[#9c9cba] focus:ring-2 focus:ring-inset focus:ring-[#1a5c2a] sm:text-sm sm:leading-6 bg-transparent dark:bg-[#101022]/50 disabled:opacity-50"
                        id="confirm-password"
                        name="confirm-password"
                        placeholder="Confirm new password"
                        required
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  </label>
                  {/* Strength Meter */}
                  {password.length > 0 && (
                    <>
                      <div className="flex gap-1 pt-1 h-1.5 w-full">
                        {[0, 1, 2, 3].map((i) => (
                          <div key={i} className={`h-full w-1/4 rounded-full transition-colors ${i < strength.score ? strength.color : 'bg-slate-200 dark:bg-slate-700'}`} />
                        ))}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {strength.label}
                      </p>
                    </>
                  )}
                </div>
                <div>
                  <button
                    className="flex w-full justify-center rounded-lg bg-[#1a5c2a] px-3 py-3.5 text-sm font-bold leading-6 text-white shadow-sm hover:bg-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a5c2a] transition-all duration-200 disabled:opacity-70"
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

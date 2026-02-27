'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send reset email');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#f5f5f8] dark:bg-[#101022] font-display min-h-screen flex flex-col antialiased selection:bg-[#ea580c]/30 selection:text-[#ea580c]">
      <div className="layout-container flex h-full grow flex-col">
        {/* Header */}
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-[#3b3b54] px-4 sm:px-10 py-3 bg-white dark:bg-[#101022]/80 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-4 text-slate-900 dark:text-white">
            <div className="size-6 text-[#ea580c] flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">school</span>
            </div>
            <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">
              StudyForge
            </h2>
          </div>
          <div className="hidden sm:flex flex-1 justify-end gap-8">
            <div className="flex items-center gap-9">
              <Link
                className="text-slate-600 dark:text-slate-200 hover:text-[#ea580c] dark:hover:text-[#ea580c] transition-colors text-sm font-medium leading-normal"
                href="/login"
              >
                Log In
              </Link>
            </div>
            <Link href="/signup">
              <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-9 px-4 bg-[#ea580c] hover:bg-blue-700 text-white text-sm font-bold leading-normal tracking-[0.015em] transition-all shadow-lg shadow-[#ea580c]/20">
                <span className="truncate">Sign Up</span>
              </button>
            </Link>
          </div>
        </header>
        {/* Main Content */}
        <main className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
          <div className="w-full max-w-md space-y-8 bg-white dark:bg-[#1b1b27] p-8 rounded-2xl shadow-xl ring-1 ring-slate-900/5 dark:ring-white/10">
            {/* Header Section */}
            <div className="flex flex-col gap-3 text-center sm:text-left">
              <h1 className="text-slate-900 dark:text-white text-3xl sm:text-4xl font-black leading-tight tracking-[-0.033em]">
                Forgot Password?
              </h1>
              <p className="text-slate-500 dark:text-[#9c9cba] text-base font-normal leading-relaxed">
                No worries! Enter your email and we&apos;ll send you a link to reset
                your password.
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
                Check your email for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder.
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="mt-8 space-y-6">
                <div className="space-y-4">
                  <label className="block" htmlFor="email-address">
                    <span className="block text-sm font-medium leading-6 text-slate-900 dark:text-white mb-2">
                      Email address
                    </span>
                    <div className="relative mt-2 rounded-md shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="material-symbols-outlined text-slate-400 text-[20px]">
                          mail
                        </span>
                      </div>
                      <input
                        className="block w-full rounded-lg border-0 py-3 pl-10 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-[#3b3b54] placeholder:text-slate-400 dark:placeholder:text-[#9c9cba] focus:ring-2 focus:ring-inset focus:ring-[#ea580c] sm:text-sm sm:leading-6 bg-transparent dark:bg-[#101022]/50 disabled:opacity-50"
                        id="email-address"
                        name="email"
                        placeholder="student@university.edu"
                        required
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  </label>
                </div>
                <div>
                  <button
                    className="flex w-full justify-center rounded-lg bg-[#ea580c] px-3 py-3.5 text-sm font-bold leading-6 text-white shadow-sm hover:bg-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ea580c] transition-all duration-200 disabled:opacity-70"
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}
            {/* Divider */}
            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute inset-0 flex items-center"
              >
                <div className="w-full border-t border-slate-200 dark:border-[#3b3b54]"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white dark:bg-[#1b1b27] px-2 text-sm text-slate-400 dark:text-[#9c9cba]">
                  or
                </span>
              </div>
            </div>
            {/* Back to Login */}
            <div className="flex justify-center">
              <Link
                className="group flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-[#ea580c] dark:hover:text-[#ea580c] transition-colors"
                href="/login"
              >
                <span className="material-symbols-outlined text-lg transition-transform group-hover:-translate-x-1">
                  arrow_back
                </span>
                Back to Login
              </Link>
            </div>
          </div>
          {/* Helper / Support Link */}
          <p className="mt-8 text-center text-sm text-slate-500 dark:text-[#9c9cba]">
            Need help?{' '}
            <Link
              className="font-semibold text-[#ea580c] hover:text-blue-400 transition-colors"
              href="#"
            >
              Contact Support
            </Link>
          </p>
        </main>
      </div>
    </div>
  );
}

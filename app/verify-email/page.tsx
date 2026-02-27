'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || 'your email address';
  const [timeLeft, setTimeLeft] = useState(60);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleResend = async () => {
    if (timeLeft > 0 || isResending || !email || email === 'your email address') return;
    setIsResending(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        }
      });
      if (error) throw error;
      setTimeLeft(60);
      alert('Verification email resent!');
    } catch (err: any) {
      alert(err.message || 'Error resending email');
    } finally {
      setIsResending(false);
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
        </header>
        {/* Main Content */}
        <main className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
          <div className="w-full max-w-md space-y-8 bg-white dark:bg-[#1b1b27] p-8 rounded-2xl shadow-xl ring-1 ring-slate-900/5 dark:ring-white/10 text-center">
            {/* Icon */}
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#ea580c]/10 dark:bg-[#ea580c]/20 mb-6 animate-bounce">
              <span className="material-symbols-outlined text-[#ea580c] text-5xl">
                mark_email_unread
              </span>
            </div>
            {/* Text */}
            <div className="space-y-4">
              <h1 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-[-0.033em]">
                Check your inbox!
              </h1>
              <p className="text-slate-500 dark:text-[#9c9cba] text-base font-normal leading-relaxed">
                We&apos;ve sent a verification link to{' '}
                <span className="font-semibold text-slate-900 dark:text-white">
                  {email}
                </span>
                . Please click the link to verify your account.
              </p>
            </div>
            {/* Timer / Resend */}
            <div className="pt-4">
              <p className="text-sm text-slate-500 dark:text-[#9c9cba] mb-4">
                Didn&apos;t receive the email? Check your spam folder or
              </p>
              <button
                onClick={handleResend}
                disabled={timeLeft > 0 || isResending}
                className={`w-full rounded-lg border px-4 py-3 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-[#ea580c] focus:ring-offset-2 transition-all ${timeLeft > 0 || isResending
                  ? 'border-slate-200 bg-slate-50 text-slate-400 dark:border-[#2d2d3f] dark:bg-[#111118] dark:text-[#6b6b8a] cursor-not-allowed'
                  : 'border-slate-300 dark:border-[#3b3b54] bg-white dark:bg-[#252535] text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-[#2d2d3f]'
                  }`}
                type="button"
              >
                {isResending ? 'Resending...' : timeLeft > 0 ? `Resend Email (${timeLeft}s)` : 'Resend Email'}
              </button>
            </div>
            {/* Back to Login */}
            <div className="pt-2">
              <Link
                className="text-sm font-medium text-[#ea580c] hover:text-[#ea580c]/80 transition-colors flex items-center justify-center gap-2"
                href="/login"
              >
                <span className="material-symbols-outlined text-lg">
                  arrow_back
                </span>
                Back to Login
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthAlert from '@/components/auth/AuthAlert';
import AuthDivider from '@/components/auth/AuthDivider';
import AuthInput from '@/components/auth/AuthInput';
import AuthOAuthButton from '@/components/auth/AuthOAuthButton';
import AuthPasswordInput from '@/components/auth/AuthPasswordInput';
import AuthShell from '@/components/auth/AuthShell';
import { clearLegacyCodeVerifierCookies } from '@/lib/auth-client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    clearLegacyCodeVerifierCookies();
  }, []);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to log in');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const res = await fetch('/api/auth/oauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'google' }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to initialize sign in');
      }
    } catch {
      setError('An error occurred during sign in.');
    }
  };

  return (
    <AuthShell
      headerAction={
        <Link href="/signup" className="secondary-button hidden md:inline-flex">
          Create account
        </Link>
      }
      preview={
        <div>
          <p className="auth-kicker">Return to your flow</p>
          <h1 className="auth-title mt-3 max-w-[10ch]">Welcome back to your study flow.</h1>
          <p className="auth-copy mt-4 max-w-[54ch]">
            Pick up where you left off with a calmer workspace, cleaner review cues, and the same trusted rhythm across every page.
          </p>

          <div className="auth-surface mt-8 max-w-[520px]">
            <div className="auth-stat-grid">
              <div className="auth-stat">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-slate-600 dark:text-slate-300">Due today</p>
                    <p className="mt-3 text-4xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">12</p>
                  </div>
                  <span className="material-symbols-outlined text-slate-400 dark:text-slate-500">menu_book</span>
                </div>
              </div>

              <div className="auth-stat-highlight">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-black">7-day streak</p>
                  <span className="material-symbols-outlined text-[20px]">local_fire_department</span>
                </div>
                <p className="mt-8 text-sm font-medium text-slate-700/80">Small daily wins add up fastest.</p>
              </div>
            </div>

            <div className="auth-stat mt-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black text-slate-700 dark:text-slate-200">Mastery progress</p>
                <span className="material-symbols-outlined text-slate-400 dark:text-slate-500">check_circle</span>
              </div>
              <div className="auth-progress-track mt-4">
                <div className="auth-progress-fill w-[75%]" />
              </div>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">75% Advanced Physics</p>
            </div>

            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              Next session: <span className="font-bold text-slate-700 dark:text-slate-200">Organic Chemistry review at 4:00 PM</span>
            </p>
          </div>
        </div>
      }
    >
      <div className="mx-auto w-full max-w-[420px]">
        <p className="auth-kicker">Account access</p>
        <h2 className="mt-3 text-[29px] font-black tracking-[-0.04em] text-slate-950 dark:text-white">Return to your review queue</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
          Sign in to continue your daily review, revisit weak topics, and keep your study flow uninterrupted.
        </p>

        <div className="mt-6 space-y-4">
          <AuthOAuthButton onClick={handleGoogleSignIn} disabled={isLoading}>
            Continue with Google
          </AuthOAuthButton>

          <AuthDivider />

          {error ? <AuthAlert tone="error">{error}</AuthAlert> : null}

          <form onSubmit={handleLogin} className="space-y-4">
            <AuthInput
              label="Email"
              icon="mail"
              type="email"
              placeholder="Enter your student email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <AuthPasswordInput
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            <div className="flex items-center justify-end">
              <Link href="/forgot-password" className="auth-action-link">
                Forgot password?
              </Link>
            </div>

            <button className="primary-button !h-12 !w-full !justify-center" type="submit" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Log in'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="auth-action-link">
            Sign up
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}

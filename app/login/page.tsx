'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BrandLogo from '@/components/ui/BrandLogo';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.cookie.split(';').forEach((cookie) => {
        const [name] = cookie.split('=');
        if (name.trim().includes('-code-verifier')) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
      });
    }
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

  const handleOAuth = async (provider: 'google' | 'apple') => {
    try {
      const res = await fetch('/api/auth/oauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
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
    <div className="main-bg flex min-h-screen items-center justify-center px-4 py-8 text-slate-950 dark:text-white">
      <div className="grid w-full max-w-[1040px] gap-5 lg:grid-cols-[0.92fr_1.08fr]">
        <section className="glass-panel-strong app-panel text-white">
          <BrandLogo subtitle="Daily study workspace" className="text-white" labelClassName="!text-white" />
          <p className="mt-6 eyebrow !text-amber-200/80">Log in</p>
          <h1 className="mt-2 text-[25px] leading-[1.05] font-black tracking-[-0.05em]">Return to your review queue.</h1>
          <p className="mt-3 text-[15px] leading-7 text-white/72">
            Open your library, continue pending review sessions, and keep your study history in one focused workspace.
          </p>

          <div className="mt-5 app-list border-white/10 bg-white/6">
            {[
              'See what is due today and where your weak topics are.',
              'Pick up review sessions without losing progress.',
              'Keep premium AI actions separate from lightweight daily review.',
            ].map((item) => (
              <div key={item} className="app-list-row border-white/10">
                <div className="flex size-9 items-center justify-center rounded-2xl bg-white/10 text-white">
                  <span className="material-symbols-outlined text-[18px]">check</span>
                </div>
                <p className="min-w-0 flex-1 text-[14px] leading-6 text-white/78">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-panel app-panel">
          <p className="eyebrow">Account access</p>
          <h2 className="panel-title mt-2">Welcome back</h2>
          <p className="mt-2 text-[14px] leading-6 text-slate-600 dark:text-slate-300">Sign in with your email or continue with Google.</p>

          {error ? <div className="mt-4 rounded-2xl border border-red-500/15 bg-red-500/8 px-4 py-3 text-sm text-red-600 dark:text-red-300">{error}</div> : null}

          <form onSubmit={handleLogin} className="mt-5 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">Email</span>
              <input
                className="h-12 w-full rounded-2xl border border-black/8 bg-white/72 px-4 text-sm outline-none focus:border-[#163f73]/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                placeholder="Enter your student email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">Password</span>
              <div className="relative">
                <input
                  className="h-12 w-full rounded-2xl border border-black/8 bg-white/72 px-4 pr-12 text-sm outline-none focus:border-[#163f73]/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  placeholder="Enter your password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700 dark:text-slate-500 dark:hover:text-white"
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                >
                  <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility' : 'visibility_off'}</span>
                </button>
              </div>
            </label>

            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <input className="size-4 rounded border-black/10 text-[#163f73]" type="checkbox" />
                Remember me
              </label>
              <Link href="/forgot-password" className="text-sm font-bold text-[#163f73] dark:text-[#f6b252]">
                Forgot password?
              </Link>
            </div>

            <button className="primary-button !h-12 !w-full !justify-center" type="submit" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Log in'}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-black/8 dark:bg-white/10" />
            <span className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">Or</span>
            <div className="h-px flex-1 bg-black/8 dark:bg-white/10" />
          </div>

          <button type="button" onClick={() => handleOAuth('google')} disabled={isLoading} className="secondary-button !h-12 !w-full !justify-center gap-3">
            <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-bold text-[#163f73] dark:text-[#f6b252]">
              Sign up
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}

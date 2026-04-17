'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import BrandLogo from '@/components/ui/BrandLogo';
import { formatNairaFromKobo, getCreditBundles } from '@/lib/billing/config';

const AVATAR_OPTIONS = [
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Jack&backgroundColor=c06e8e',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Aneka&backgroundColor=ffd5dc',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Oliver&backgroundColor=ffdfbf',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Luna&backgroundColor=d1d4f9',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Leo&backgroundColor=c0aede',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Milo&backgroundColor=b6f4e3',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Zoe&backgroundColor=f4e3b6',
];

export default function SignupPage() {
  const router = useRouter();
  const bundles = getCreditBundles().slice(0, 3);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [studyLevel, setStudyLevel] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(AVATAR_OPTIONS[0]);
  const [termsAccepted, setTermsAccepted] = useState(false);
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

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!termsAccepted) {
      setError('You must agree to the Terms of Service and Privacy Policy.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, studyLevel, password, avatarUrl }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign up');
      }

      if (data.session) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setError('Account created. Check your email to verify your account and unlock your wallet.');
      }
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
    <div className="main-bg min-h-screen px-4 py-6 text-slate-950 dark:text-white">
      <div className="mx-auto grid w-full max-w-[1180px] gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="glass-panel-strong app-panel text-white">
          <BrandLogo subtitle="Daily study workspace" />
          <p className="mt-6 eyebrow !text-amber-200/80">New account</p>
          <h1 className="mt-2 text-[25px] leading-[1.05] font-black tracking-[-0.05em]">Start with a clean study wallet.</h1>
          <p className="mt-3 text-[15px] leading-7 text-white/72">
            New accounts begin with starter credits so you can upload material, generate practice, and build a review loop without friction.
          </p>

          <div className="mt-5 app-list border-white/10 bg-white/6">
            {[
              'Starter credits are available the moment your account is ready.',
              'Top up only when you want premium AI generation or advanced extraction.',
              'Daily review remains lightweight even when you are low on credits.',
            ].map((item) => (
              <div key={item} className="app-list-row border-white/10">
                <div className="flex size-9 items-center justify-center rounded-2xl bg-white/10 text-white">
                  <span className="material-symbols-outlined text-[18px]">check</span>
                </div>
                <p className="min-w-0 flex-1 text-[14px] leading-6 text-white/78">{item}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 app-list border-white/10 bg-white/6">
            {bundles.map((bundle) => (
              <div key={bundle.id} className="app-list-row border-white/10">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black">{bundle.name}</p>
                  <p className="mt-1 text-[13px] text-white/65">
                    {bundle.credits.toLocaleString()} credits • {bundle.tagline}
                  </p>
                </div>
                <span className="text-sm font-black text-amber-200">{formatNairaFromKobo(bundle.amountKobo)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-panel app-panel">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Create account</p>
              <h2 className="panel-title mt-2">Open your workspace</h2>
            </div>
            <BrandLogo compact subtitle={null} href={null} />
          </div>

          {error ? <div className="mt-4 rounded-2xl border border-red-500/15 bg-red-500/8 px-4 py-3 text-sm text-red-600 dark:text-red-300">{error}</div> : null}

          <form onSubmit={handleSignup} className="mt-5 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">First name</span>
                <input
                  className="h-12 w-full rounded-2xl border border-black/8 bg-white/72 px-4 text-sm outline-none focus:border-[#163f73]/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="Jane"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">Last name</span>
                <input
                  className="h-12 w-full rounded-2xl border border-black/8 bg-white/72 px-4 text-sm outline-none focus:border-[#163f73]/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Doe"
                  required
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">Email</span>
              <input
                className="h-12 w-full rounded-2xl border border-black/8 bg-white/72 px-4 text-sm outline-none focus:border-[#163f73]/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="jane.doe@school.edu"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">Study level</span>
              <select
                className="h-12 w-full rounded-2xl border border-black/8 bg-white/72 px-4 text-sm outline-none focus:border-[#163f73]/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                value={studyLevel}
                onChange={(event) => setStudyLevel(event.target.value)}
                required
              >
                <option value="" disabled>
                  Select your current level
                </option>
                <option value="secondary">Secondary School / High School</option>
                <option value="undergrad">Undergraduate University</option>
                <option value="grad">Graduate / Post-Grad</option>
                <option value="professional">Professional Certification</option>
                <option value="other">Other / Self-Learner</option>
              </select>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">Password</span>
                <input
                  className="h-12 w-full rounded-2xl border border-black/8 bg-white/72 px-4 text-sm outline-none focus:border-[#163f73]/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Create a password"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">Confirm password</span>
                <input
                  className="h-12 w-full rounded-2xl border border-black/8 bg-white/72 px-4 text-sm outline-none focus:border-[#163f73]/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repeat password"
                  required
                />
              </label>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Choose an avatar</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Optional</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {AVATAR_OPTIONS.map((url, index) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setAvatarUrl(url)}
                    className={`relative size-12 overflow-hidden rounded-full border-2 transition ${
                      avatarUrl === url ? 'border-[#163f73] shadow-[0_10px_24px_rgba(22,63,115,0.16)]' : 'border-transparent opacity-75 hover:opacity-100'
                    }`}
                  >
                    <Image alt={`Avatar ${index + 1}`} src={url} fill unoptimized className="object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-2xl border border-black/8 bg-white/52 px-4 py-4 dark:border-white/10 dark:bg-white/5">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(event) => setTermsAccepted(event.target.checked)}
                className="mt-1 size-4 rounded border-black/10 text-[#163f73]"
              />
              <span className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                I agree to the{' '}
                <Link href="/terms" className="font-bold text-[#163f73] dark:text-[#f6b252]">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="font-bold text-[#163f73] dark:text-[#f6b252]">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>

            <button type="submit" disabled={isLoading} className="primary-button !h-12 !w-full !justify-center">
              {isLoading ? 'Creating account...' : 'Create account'}
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
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-[#163f73] dark:text-[#f6b252]">
              Log in
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}

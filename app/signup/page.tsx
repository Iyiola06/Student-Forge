'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getCreditBundles, formatNairaFromKobo } from '@/lib/billing/config';

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

const bundles = getCreditBundles();

export default function SignupPage() {
  const router = useRouter();
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

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
        setError('Account created. Check your email to verify your account and unlock your 1,000-credit wallet.');
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
    <div className="min-h-screen bg-[linear-gradient(135deg,#f3efe6_0%,#efe0c6_40%,#dce6d5_100%)] text-[#132117]">
      <header className="border-b border-black/5 bg-white/40 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative size-11 overflow-hidden rounded-2xl bg-[#0f2617] p-1.5">
              <Image src="/logo-favicon.png" alt="VUI Studify" fill className="object-contain p-1" />
            </div>
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.28em] text-[#3b6a44]">VUI Studify</div>
              <div className="text-sm font-semibold text-[#132117]/70">Account creation</div>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-semibold text-[#132117]/72 transition hover:text-[#132117]">
              Log in
            </Link>
            <Link
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-full border border-[#163623]/12 bg-white/70 px-4 text-sm font-bold text-[#163623]"
            >
              Back Home
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-10 px-5 py-10 md:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:py-14">
        <section className="rounded-[2.5rem] bg-[#163623] p-8 text-white shadow-[0_28px_90px_rgba(22,54,35,0.28)] md:p-10">
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-200/60">
            New account bonus
          </p>
          <h1 className="mt-4 text-4xl font-black leading-tight tracking-[-0.05em] md:text-5xl">
            Start with 1,000 credits and spend them only on real AI study work.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-white/72">
            Sign up once, get your welcome wallet, and use it on tutoring, grading, flashcards, exam snapshots, and quiz generation. When you need more, top up with Paystack.
          </p>

          <div className="mt-8 grid gap-4">
            {[
              '1,000 welcome credits at signup',
              'Credits stay active for 6 months',
              'Paystack powers secure top-ups',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <span className="material-symbols-outlined text-emerald-200">verified</span>
                <span className="text-sm font-semibold text-white/82">{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-[2rem] border border-white/10 bg-white/5 p-5">
            <div className="text-[11px] font-black uppercase tracking-[0.26em] text-emerald-200/55">
              First top-ups
            </div>
            <div className="mt-4 space-y-3">
              {bundles.map((bundle) => (
                <div key={bundle.id} className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/10 px-4 py-4">
                  <div>
                    <div className="font-bold">{bundle.name}</div>
                    <div className="text-sm text-white/60">{bundle.credits.toLocaleString()} credits</div>
                  </div>
                  <div className="text-sm font-black text-amber-200">{formatNairaFromKobo(bundle.amountKobo)}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[2.5rem] border border-white/60 bg-white/72 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.08)] backdrop-blur-xl md:p-8">
          <div className="mb-6">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#53795a]">Create account</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#102117]">Unlock your wallet</h2>
            <p className="mt-2 text-sm leading-7 text-[#2c4431]/74">
              New and existing users receive 1,000 credits. Fill in your details and we will prepare your study wallet immediately.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-[#223427]">First name</span>
                <input
                  className="h-12 w-full rounded-xl border border-[#163623]/12 bg-white px-4 text-sm outline-none transition focus:border-[#1a5c2a] focus:ring-4 focus:ring-[#1a5c2a]/10"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jane"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-[#223427]">Last name</span>
                <input
                  className="h-12 w-full rounded-xl border border-[#163623]/12 bg-white px-4 text-sm outline-none transition focus:border-[#1a5c2a] focus:ring-4 focus:ring-[#1a5c2a]/10"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  required
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-[#223427]">Email</span>
              <input
                className="h-12 w-full rounded-xl border border-[#163623]/12 bg-white px-4 text-sm outline-none transition focus:border-[#1a5c2a] focus:ring-4 focus:ring-[#1a5c2a]/10"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane.doe@school.edu"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-[#223427]">Study level</span>
              <select
                className="h-12 w-full rounded-xl border border-[#163623]/12 bg-white px-4 text-sm outline-none transition focus:border-[#1a5c2a] focus:ring-4 focus:ring-[#1a5c2a]/10"
                value={studyLevel}
                onChange={(e) => setStudyLevel(e.target.value)}
                required
              >
                <option value="" disabled>Select your current level</option>
                <option value="secondary">Secondary School / High School</option>
                <option value="undergrad">Undergraduate University</option>
                <option value="grad">Graduate / Post-Grad</option>
                <option value="professional">Professional Certification</option>
                <option value="other">Other / Self-Learner</option>
              </select>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-[#223427]">Password</span>
                <input
                  className="h-12 w-full rounded-xl border border-[#163623]/12 bg-white px-4 text-sm outline-none transition focus:border-[#1a5c2a] focus:ring-4 focus:ring-[#1a5c2a]/10"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-[#223427]">Confirm password</span>
                <input
                  className="h-12 w-full rounded-xl border border-[#163623]/12 bg-white px-4 text-sm outline-none transition focus:border-[#1a5c2a] focus:ring-4 focus:ring-[#1a5c2a]/10"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  required
                />
              </label>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-bold text-[#223427]">Choose an avatar</span>
                <span className="text-xs font-semibold text-[#53795a]">Optional but recommended</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {AVATAR_OPTIONS.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatarUrl(url)}
                    className={`relative size-14 overflow-hidden rounded-full border-2 transition ${
                      avatarUrl === url ? 'scale-105 border-[#1a5c2a] shadow-[0_8px_18px_rgba(26,92,42,0.15)]' : 'border-transparent opacity-75 hover:opacity-100'
                    }`}
                  >
                    <Image alt={`Avatar ${idx + 1}`} src={url} fill unoptimized className="object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-2xl border border-[#163623]/10 bg-[#f7f3eb] px-4 py-4">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 size-4 rounded border-[#163623]/20 text-[#1a5c2a] focus:ring-[#1a5c2a]"
              />
              <span className="text-sm leading-7 text-[#2c4431]/82">
                I agree to the <Link href="/terms" className="font-bold text-[#1a5c2a]">Terms of Service</Link> and <Link href="/privacy" className="font-bold text-[#1a5c2a]">Privacy Policy</Link>.
              </span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex h-14 w-full items-center justify-center rounded-2xl bg-[#163623] text-base font-bold text-white shadow-[0_16px_30px_rgba(22,54,35,0.18)] transition hover:bg-[#1d472e] disabled:opacity-60"
            >
              {isLoading ? 'Creating account...' : 'Create Account + 1,000 Credits'}
            </button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[#163623]/10" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs font-black uppercase tracking-[0.24em] text-[#53795a]">Or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleOAuth('google')}
              disabled={isLoading}
              className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-[#163623]/12 bg-white text-sm font-bold text-[#132117] transition hover:bg-[#faf8f1] disabled:opacity-60"
            >
              <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>

            <p className="text-center text-sm text-[#2c4431]/74">
              Already have an account?{' '}
              <Link href="/login" className="font-bold text-[#1a5c2a]">
                Log in here
              </Link>
            </p>
          </form>
        </section>
      </main>
    </div>
  );
}

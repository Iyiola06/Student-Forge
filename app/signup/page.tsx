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

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    clearLegacyCodeVerifierCookies();
  }, []);

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!termsAccepted) {
      setMessage({ tone: 'error', text: 'You must agree to the Terms of Service and Privacy Policy.' });
      return;
    }

    if (password.length < 6) {
      setMessage({ tone: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign up');
      }

      if (data.session) {
        router.push('/dashboard');
        router.refresh();
        return;
      }

      setMessage({
        tone: 'success',
        text: 'Account created. Check your email to verify your address, then come back and continue your study flow.',
      });
    } catch (err: any) {
      setMessage({ tone: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
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
        setMessage({ tone: 'error', text: data.error || 'Failed to initialize sign up' });
      }
    } catch {
      setMessage({ tone: 'error', text: 'An error occurred during sign up.' });
    }
  };

  return (
    <AuthShell
      headerAction={
        <Link href="/login" className="secondary-button hidden md:inline-flex">
          Log in
        </Link>
      }
      preview={
        <div>
          <p className="auth-kicker">Start simply</p>
          <h1 className="auth-title mt-3 max-w-[11ch]">Create a calmer way to study every day.</h1>
          <p className="auth-copy mt-4 max-w-[52ch]">
            Keep the first step light. Create your account, bring in class material, and let Sulva’s Studify turn it into a steady review habit.
          </p>

          <div className="auth-surface mt-8">
            <div className="rounded-[24px] border border-[#4f86c5]/18 bg-[linear-gradient(180deg,rgba(79,134,197,0.12),rgba(255,255,255,0.82))] p-5 dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(79,134,197,0.16),rgba(255,255,255,0.04))]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-slate-950 dark:text-white">Sulva’s Studify</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">A cleaner workspace for upload, generation, and daily review.</p>
                </div>
                <div className="flex size-16 items-center justify-center rounded-full border border-[#4f86c5]/20 bg-white/90 text-[#2c5d92] shadow-[0_12px_28px_rgba(79,134,197,0.14)] dark:border-white/10 dark:bg-white/10 dark:text-[#ffd493]">
                  <span className="text-lg font-black">75%</span>
                </div>
              </div>

              <div className="mt-5 auth-list">
                {[
                  ['Upload class materials', 'Bring in notes, slides, and PDFs without clutter.'],
                  ['Create practice instantly', 'Generate quizzes and flashcards when you need them.'],
                  ['Build a daily review habit', 'Return to the same calm queue each day.'],
                ].map(([title, copy]) => (
                  <div key={title} className="auth-list-item">
                    <div className="auth-list-icon">
                      <span className="material-symbols-outlined text-[18px]">check</span>
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-950 dark:text-white">{title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{copy}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      }
    >
      <div className="mx-auto w-full max-w-[420px]">
        <p className="auth-kicker">Create account</p>
        <h2 className="mt-3 text-[29px] font-black tracking-[-0.04em] text-slate-950 dark:text-white">Start smarter studying</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
          Create your account in one clean step, then continue into the workspace when you&apos;re ready.
        </p>

        <div className="mt-6 space-y-4">
          <AuthOAuthButton onClick={handleGoogleSignUp} disabled={isLoading}>
            Continue with Google
          </AuthOAuthButton>

          <AuthDivider />

          {message ? <AuthAlert tone={message.tone}>{message.text}</AuthAlert> : null}

          <form onSubmit={handleSignup} className="space-y-4">
            <AuthInput
              label="Full name"
              icon="person"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
            />

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
              placeholder="Create a password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            <label className="flex items-start gap-3 rounded-[22px] border border-black/6 bg-white/56 px-4 py-4 text-sm leading-7 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(event) => setTermsAccepted(event.target.checked)}
                className="mt-1 size-4 rounded border-black/10 text-[#163f73]"
              />
              <span>
                I agree to the{' '}
                <Link href="/terms" className="auth-action-link">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="auth-action-link">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>

            <button type="submit" disabled={isLoading} className="primary-button !h-12 !w-full !justify-center">
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="auth-action-link">
            Log in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}

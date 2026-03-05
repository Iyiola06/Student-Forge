'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
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
        throw new Error(data.error || 'Failed to login');
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
    } catch (err: any) {
      setError('An error occurred during sign in');
    }
  };

  return (
    <div className="main-bg font-display text-slate-900 dark:text-slate-100 min-h-screen flex items-center justify-center p-4">
      {/* Main Container */}
      <div className="relative w-full max-w-md premium-card glass-card overflow-hidden">
        {/* Header / Logo Section */}
        <div className="pt-8 pb-4 flex flex-col items-center justify-center">
          {/* Logo Placeholder */}
          <div className="relative size-16 flex items-center justify-center mb-4">
            <Image
              src="/logo-favicon.png"
              alt="Vui Studify Logo"
              width={64}
              height={64}
              className="object-contain rounded-full"
              priority
            />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Welcome Back
          </h2>
          <p className="text-sm text-slate-500 dark:text-[#9c9cba] mt-2">
            Log in to continue your learning journey
          </p>
        </div>
        {/* Form Section */}
        <div className="p-8 pt-2">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm md:text-xs">
              {error}
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <label
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-900 dark:text-white"
                htmlFor="email"
              >
                Email
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#9c9cba]">
                  <span className="material-symbols-outlined text-[20px]">
                    mail
                  </span>
                </span>
                <input
                  className="flex h-12 w-full rounded-lg border border-slate-300 dark:border-[#3b3b54] bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 dark:placeholder:text-[#6b6b8a] focus:outline-none focus:ring-2 focus:ring-[#1a5c2a] focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 pl-10 text-slate-900 dark:text-white bg-slate-50 dark:bg-[#111118]"
                  id="email"
                  placeholder="Enter your student email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  className="text-sm font-medium leading-none text-slate-900 dark:text-white"
                  htmlFor="password"
                >
                  Password
                </label>
              </div>
              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#9c9cba]">
                  <span className="material-symbols-outlined text-[20px]">
                    lock
                  </span>
                </span>
                <input
                  className="flex h-12 w-full rounded-lg border border-slate-300 dark:border-[#3b3b54] bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 dark:placeholder:text-[#6b6b8a] focus:outline-none focus:ring-2 focus:ring-[#1a5c2a] focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 pl-10 pr-10 text-slate-900 dark:text-white bg-slate-50 dark:bg-[#111118]"
                  id="password"
                  placeholder="Enter your password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-[#9c9cba] dark:hover:text-white transition-colors"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>
            </div>
            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-x-2 cursor-pointer">
                <input
                  className="h-4 w-4 rounded border-slate-300 dark:border-[#3b3b54] text-[#1a5c2a] focus:ring-[#1a5c2a] bg-transparent"
                  type="checkbox"
                />
                <span className="text-sm font-medium text-slate-600 dark:text-[#9c9cba]">
                  Remember me
                </span>
              </label>
              <Link
                className="text-sm font-medium text-[#1a5c2a] hover:text-[#1a5c2a]/80 transition-colors"
                href="/forgot-password"
              >
                Forgot Password?
              </Link>
            </div>
            {/* Login Button */}
            <button
              className="w-full h-12 bg-[#1a5c2a] hover:bg-[#1a5c2a]/90 disabled:opacity-70 text-white font-medium rounded-lg transition-colors flex items-center justify-center shadow-lg shadow-[#1a5c2a]/25 mt-5"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Login'
              )}
            </button>
          </form>
          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200 dark:border-[#3b3b54]"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-[#1b1b27] px-2 text-slate-500 dark:text-[#9c9cba]">
                Or continue with
              </span>
            </div>
          </div>
          {/* Social Login Buttons */}
          <div className="w-full">
            <button
              className="flex items-center justify-center gap-2 h-11 w-full rounded-lg border border-slate-200 dark:border-[#3b3b54] bg-white dark:bg-[#252535] hover:bg-slate-50 dark:hover:bg-[#2d2d3f] transition-colors text-slate-700 dark:text-white font-medium text-sm disabled:opacity-50"
              type="button"
              onClick={() => handleOAuth('google')}
              disabled={isLoading}
            >
              {/* Google Icon SVG */}
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                viewBox="0 0 24 24"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                ></path>
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                ></path>
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                ></path>
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                ></path>
              </svg>
              Sign in with Google
            </button>
          </div>
          {/* Sign Up Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500 dark:text-[#9c9cba]">
              Don&apos;t have an account?{' '}
              <Link
                className="font-semibold text-[#1a5c2a] hover:text-[#1a5c2a]/80 transition-colors"
                href="/signup"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
      {/* Optional: Subtle decorative background elements */}
      <div className="fixed top-0 left-0 -z-10 h-full w-full opacity-30 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-[#1a5c2a]/20 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-[#101022]/40 blur-[120px]"></div>
      </div>
    </div>
  );
}

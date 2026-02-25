'use client';

import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="bg-[#f5f5f8] dark:bg-[#101022] font-display text-slate-900 dark:text-slate-100 min-h-screen flex items-center justify-center p-4">
      {/* Main Container */}
      <div className="relative w-full max-w-md bg-white dark:bg-[#1b1b27] rounded-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-[#2d2d3f]">
        {/* Header / Logo Section */}
        <div className="pt-8 pb-4 flex flex-col items-center justify-center">
          {/* Logo Placeholder */}
          <div className="w-16 h-16 rounded-xl bg-[#2525f4]/10 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-[#2525f4] text-4xl">
              school
            </span>
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
          <form action="#" className="space-y-5">
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
                  className="flex h-12 w-full rounded-lg border border-slate-300 dark:border-[#3b3b54] bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 dark:placeholder:text-[#6b6b8a] focus:outline-none focus:ring-2 focus:ring-[#2525f4] focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 pl-10 text-slate-900 dark:text-white bg-slate-50 dark:bg-[#111118]"
                  id="email"
                  placeholder="Enter your student email"
                  type="email"
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
                  className="flex h-12 w-full rounded-lg border border-slate-300 dark:border-[#3b3b54] bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 dark:placeholder:text-[#6b6b8a] focus:outline-none focus:ring-2 focus:ring-[#2525f4] focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 pl-10 pr-10 text-slate-900 dark:text-white bg-slate-50 dark:bg-[#111118]"
                  id="password"
                  placeholder="Enter your password"
                  type="password"
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-[#9c9cba] dark:hover:text-white transition-colors"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    visibility_off
                  </span>
                </button>
              </div>
            </div>
            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-x-2 cursor-pointer">
                <input
                  className="h-4 w-4 rounded border-slate-300 dark:border-[#3b3b54] text-[#2525f4] focus:ring-[#2525f4] bg-transparent"
                  type="checkbox"
                />
                <span className="text-sm font-medium text-slate-600 dark:text-[#9c9cba]">
                  Remember me
                </span>
              </label>
              <Link
                className="text-sm font-medium text-[#2525f4] hover:text-[#2525f4]/80 transition-colors"
                href="/forgot-password"
              >
                Forgot Password?
              </Link>
            </div>
            {/* Login Button */}
            <Link href="/dashboard">
              <button
                className="w-full h-12 bg-[#2525f4] hover:bg-[#2525f4]/90 text-white font-medium rounded-lg transition-colors flex items-center justify-center shadow-lg shadow-[#2525f4]/25 mt-5"
                type="button"
              >
                Login
              </button>
            </Link>
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
          <div className="grid grid-cols-2 gap-4">
            <button
              className="flex items-center justify-center gap-2 h-11 rounded-lg border border-slate-200 dark:border-[#3b3b54] bg-white dark:bg-[#252535] hover:bg-slate-50 dark:hover:bg-[#2d2d3f] transition-colors text-slate-700 dark:text-white font-medium text-sm"
              type="button"
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
              Google
            </button>
            <button
              className="flex items-center justify-center gap-2 h-11 rounded-lg border border-slate-200 dark:border-[#3b3b54] bg-white dark:bg-[#252535] hover:bg-slate-50 dark:hover:bg-[#2d2d3f] transition-colors text-slate-700 dark:text-white font-medium text-sm"
              type="button"
            >
              {/* Apple Icon SVG */}
              <svg
                aria-hidden="true"
                className="h-5 w-5 dark:fill-white fill-slate-900"
                viewBox="0 0 24 24"
              >
                <path d="M12.9103 1.76562C13.5786 0.94236 14.6713 0.281896 15.6558 0.3125C15.7516 1.48705 15.313 2.65191 14.6433 3.45347C13.9213 4.31846 12.8735 4.92728 11.9079 4.85806C11.7825 3.63321 12.285 2.49306 12.9103 1.76562ZM17.4776 17.5106C16.8906 18.3698 16.0967 19.5594 15.0694 19.5855C14.0772 19.6053 13.7547 18.9959 12.6074 18.9959C11.4503 18.9959 11.0858 19.5761 10.1343 19.6152C9.13111 19.6644 8.2721 18.3797 7.64304 17.4699C6.35703 15.6083 5.37894 12.1932 6.66699 9.95755C7.30691 8.84752 8.44855 8.14088 9.61273 8.12134C10.6055 8.09893 11.3653 8.79093 11.9701 8.79093C12.5649 8.79093 13.5283 7.97092 14.7171 8.08272C15.2078 8.10665 16.5925 8.28318 17.4873 9.59368C17.4124 9.64095 15.7486 10.6095 15.7725 12.6288C15.7951 14.6853 17.5459 15.6881 17.6111 15.7229C17.4716 16.4258 17.0252 17.4938 17.4776 17.5106Z"></path>
              </svg>
              Apple
            </button>
          </div>
          {/* Sign Up Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500 dark:text-[#9c9cba]">
              Don&apos;t have an account?{' '}
              <Link
                className="font-semibold text-[#2525f4] hover:text-[#2525f4]/80 transition-colors"
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
        <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-[#2525f4]/20 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-[#101022]/40 blur-[120px]"></div>
      </div>
    </div>
  );
}

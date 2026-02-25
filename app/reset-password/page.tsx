'use client';

import Link from 'next/link';

export default function ResetPasswordPage() {
  return (
    <div className="bg-[#f5f5f8] dark:bg-[#101022] font-display min-h-screen flex flex-col antialiased selection:bg-[#2525f4]/30 selection:text-[#2525f4]">
      <div className="layout-container flex h-full grow flex-col">
        {/* Header */}
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-[#3b3b54] px-4 sm:px-10 py-3 bg-white dark:bg-[#101022]/80 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-4 text-slate-900 dark:text-white">
            <div className="size-6 text-[#2525f4] flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">school</span>
            </div>
            <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">
              StudyForge
            </h2>
          </div>
          <div className="hidden sm:flex flex-1 justify-end gap-8">
            <div className="flex items-center gap-9">
              <Link
                className="text-slate-600 dark:text-slate-200 hover:text-[#2525f4] dark:hover:text-[#2525f4] transition-colors text-sm font-medium leading-normal"
                href="/login"
              >
                Log In
              </Link>
            </div>
            <Link href="/signup">
              <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-9 px-4 bg-[#2525f4] hover:bg-blue-700 text-white text-sm font-bold leading-normal tracking-[0.015em] transition-all shadow-lg shadow-[#2525f4]/20">
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
                Reset Password
              </h1>
              <p className="text-slate-500 dark:text-[#9c9cba] text-base font-normal leading-relaxed">
                Enter your new password below.
              </p>
            </div>
            {/* Form Section */}
            <form action="#" className="mt-8 space-y-6" method="POST">
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
                      className="block w-full rounded-lg border-0 py-3 pl-10 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-[#3b3b54] placeholder:text-slate-400 dark:placeholder:text-[#9c9cba] focus:ring-2 focus:ring-inset focus:ring-[#2525f4] sm:text-sm sm:leading-6 bg-transparent dark:bg-[#101022]/50"
                      id="new-password"
                      name="new-password"
                      placeholder="Enter new password"
                      required
                      type="password"
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
                      className="block w-full rounded-lg border-0 py-3 pl-10 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-[#3b3b54] placeholder:text-slate-400 dark:placeholder:text-[#9c9cba] focus:ring-2 focus:ring-inset focus:ring-[#2525f4] sm:text-sm sm:leading-6 bg-transparent dark:bg-[#101022]/50"
                      id="confirm-password"
                      name="confirm-password"
                      placeholder="Confirm new password"
                      required
                      type="password"
                    />
                  </div>
                </label>
                {/* Strength Meter */}
                <div className="flex gap-1 pt-1 h-1.5 w-full">
                  <div className="h-full w-1/4 rounded-full bg-green-500"></div>
                  <div className="h-full w-1/4 rounded-full bg-green-500"></div>
                  <div className="h-full w-1/4 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                  <div className="h-full w-1/4 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Medium strength
                </p>
              </div>
              <div>
                <button
                  className="flex w-full justify-center rounded-lg bg-[#2525f4] px-3 py-3.5 text-sm font-bold leading-6 text-white shadow-sm hover:bg-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2525f4] transition-all duration-200"
                  type="submit"
                >
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

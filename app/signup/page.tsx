'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [studyLevel, setStudyLevel] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      setError('You must agree to the Terms of Service and Privacy Policy');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, studyLevel, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign up');
      }

      router.push('/verify-email?email=' + encodeURIComponent(email));
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
    <div className="bg-[#f5f5f8] dark:bg-[#101022] font-display text-slate-900 dark:text-slate-100 min-h-screen flex flex-col overflow-x-hidden selection:bg-[#2525f4] selection:text-white">
      {/* Header */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-[#2d2d45] px-10 py-4 bg-white dark:bg-[#1b1b2e]/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="size-8 text-[#2525f4]">
            <svg
              className="w-full h-full"
              fill="currentColor"
              viewBox="0 0 48 48"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z"></path>
            </svg>
          </div>
          <h2 className="text-slate-900 dark:text-white text-xl font-bold leading-tight tracking-[-0.015em]">
            StudyForge
          </h2>
        </div>
        <div className="flex flex-1 justify-end gap-8 items-center">
          <div className="hidden md:flex items-center gap-9">
            <Link
              className="text-slate-600 dark:text-slate-300 hover:text-[#2525f4] dark:hover:text-[#2525f4] transition-colors text-sm font-medium leading-normal"
              href="#"
            >
              Home
            </Link>
            <Link
              className="text-slate-600 dark:text-slate-300 hover:text-[#2525f4] dark:hover:text-[#2525f4] transition-colors text-sm font-medium leading-normal"
              href="#"
            >
              Features
            </Link>
            <Link
              className="text-slate-600 dark:text-slate-300 hover:text-[#2525f4] dark:hover:text-[#2525f4] transition-colors text-sm font-medium leading-normal"
              href="#"
            >
              Pricing
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link
              className="text-slate-600 dark:text-slate-300 hover:text-[#2525f4] dark:hover:text-[#2525f4] transition-colors text-sm font-medium leading-normal"
              href="/login"
            >
              Login
            </Link>
            <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-6 bg-[#2525f4] hover:bg-[#2525f4]/90 transition-colors text-white text-sm font-bold leading-normal tracking-[0.015em]">
              <span className="truncate">Sign Up</span>
            </button>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center py-12 px-4 relative">
        {/* Decorative Background Elements */}
        <div className="absolute top-20 left-10 text-[#2525f4]/10 animate-pulse hidden lg:block">
          <span className="material-symbols-outlined text-9xl">school</span>
        </div>
        <div className="absolute bottom-20 right-10 text-[#2525f4]/10 animate-pulse hidden lg:block">
          <span className="material-symbols-outlined text-9xl">menu_book</span>
        </div>
        <div className="absolute top-1/2 left-20 text-[#2525f4]/5 hidden lg:block rotate-12">
          <span className="material-symbols-outlined text-8xl">edit_note</span>
        </div>
        {/* Form Container */}
        <div className="w-full max-w-[640px] bg-white dark:bg-[#1b1b2e] rounded-2xl shadow-xl dark:shadow-none border border-slate-200 dark:border-[#2d2d45] p-8 md:p-12 z-10">
          <div className="text-center mb-8">
            <h1 className="text-slate-900 dark:text-white tracking-tight text-3xl md:text-4xl font-bold leading-tight mb-3">
              Create your account
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg font-normal leading-normal">
              Your exam success starts here.
            </p>
          </div>
          {/* Avatar Picker */}
          <div className="flex flex-col items-center mb-8">
            <p className="text-slate-700 dark:text-slate-300 text-sm font-medium mb-4">
              Choose your avatar
            </p>
            <div className="flex items-center gap-4 justify-center flex-wrap">
              <button
                className="group relative size-16 rounded-full overflow-hidden border-2 border-[#2525f4] ring-4 ring-[#2525f4]/20 transition-transform hover:scale-105"
                type="button"
              >
                <Image
                  alt="Avatar option 1"
                  className="object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_PrX8yOs64jgoF50R2Gdmak7Nq9XNBH6jrZGbcMeFZWiTc-RXHJIYwVod5RyMqvpXdyuCh67XqP8diyIZGjPdooGKAN9iNGBZXPBKwdB23Gl_zIV9531fy77kczue-ybewLFkxSWQMdUumyw1dvjOVV4QSWKgD582BzAkdewcGU2Q77mpv1aJco2awv_M5hlPCjjIrGKErnFpvl_jDnr7id6w0GMQFhPBYcB72xFQDQseoc8xqlWGGLMxg092WPdyPddhX5U-OjiN"
                  fill
                />
                <div className="absolute inset-0 bg-[#2525f4]/40 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white font-bold">
                    check
                  </span>
                </div>
              </button>
              <button
                className="group relative size-14 rounded-full overflow-hidden border-2 border-transparent hover:border-[#2525f4]/50 transition-all hover:scale-105 opacity-70 hover:opacity-100"
                type="button"
              >
                <Image
                  alt="Avatar option 2"
                  className="object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAWvxINhIexGAXnu4Ns3IbZUa5PjHvWsqArX5UebB00Ol5YRKll-fY4BkF2pvnGEB1I2oLRNoBithKJW5OHyk1xohOboakbW9GJpjpIHexaX47-6XevhottW4dsBJ_aFdnuRTzc5NLDFVoz1z94y-cxqO01pOmH23-XiZilm909rwK7YkMTzs-gLnbt5Ae1d80czYU_Lk8ugVpxPla58kr-R_ZSWfJey4o0jibCic808ySvMqsLIevJ4c1fSftRc7MbbG-UPIEQVYGX"
                  fill
                />
              </button>
              <button
                className="group relative size-14 rounded-full overflow-hidden border-2 border-transparent hover:border-[#2525f4]/50 transition-all hover:scale-105 opacity-70 hover:opacity-100"
                type="button"
              >
                <Image
                  alt="Avatar option 3"
                  className="object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBfIeoBwn-qR9GrUqgj7kfBfDlDG3B89kXt9gJZyKjZhta-idR5go9J1qtbGg-9mkC7ZA_nCA06lY5DJIO6heBpQPi7TpP9HnW70HFPCiAqH2DQQawl4TheD8KWXvyjQ36kBgFfHrbKfyAiiKeguZB0aQbkr8MfoqCB2V_l7xl9a7VkSsmdZa8aPEhnwOZytVvZv6lwFw4Ss1BTW2KGd5ALN_C_iBGfpuPt6x2BBiafYx18kdUbUqWtkyZuH42gY69uhXM8wD1MSxo9"
                  fill
                />
              </button>
              <button
                className="group relative size-14 rounded-full overflow-hidden border-2 border-transparent hover:border-[#2525f4]/50 transition-all hover:scale-105 opacity-70 hover:opacity-100 bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
                type="button"
              >
                <span className="material-symbols-outlined text-slate-400 dark:text-slate-500">
                  add_a_photo
                </span>
              </button>
            </div>
          </div>
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSignup} className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  className="text-slate-700 dark:text-slate-300 text-sm font-medium leading-normal"
                  htmlFor="firstName"
                >
                  First Name
                </label>
                <div className="relative">
                  <input
                    className="w-full rounded-lg border border-slate-300 dark:border-[#2d2d45] bg-slate-50 dark:bg-[#151525] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#2525f4] focus:ring-[#2525f4] h-12 px-4 text-base"
                    id="firstName"
                    placeholder="Jane"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label
                  className="text-slate-700 dark:text-slate-300 text-sm font-medium leading-normal"
                  htmlFor="lastName"
                >
                  Last Name
                </label>
                <div className="relative">
                  <input
                    className="w-full rounded-lg border border-slate-300 dark:border-[#2d2d45] bg-slate-50 dark:bg-[#151525] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#2525f4] focus:ring-[#2525f4] h-12 px-4 text-base"
                    id="lastName"
                    placeholder="Doe"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
            {/* Email */}
            <div className="space-y-2">
              <label
                className="text-slate-700 dark:text-slate-300 text-sm font-medium leading-normal"
                htmlFor="email"
              >
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <span className="material-symbols-outlined text-[20px]">
                    mail
                  </span>
                </span>
                <input
                  className="w-full rounded-lg border border-slate-300 dark:border-[#2d2d45] bg-slate-50 dark:bg-[#151525] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#2525f4] focus:ring-[#2525f4] h-12 pl-11 pr-4 text-base"
                  id="email"
                  placeholder="jane.doe@school.edu"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            {/* Study Level */}
            <div className="space-y-2">
              <label
                className="text-slate-700 dark:text-slate-300 text-sm font-medium leading-normal"
                htmlFor="studyLevel"
              >
                Study Level
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <span className="material-symbols-outlined text-[20px]">
                    school
                  </span>
                </span>
                <select
                  className="w-full rounded-lg border border-slate-300 dark:border-[#2d2d45] bg-slate-50 dark:bg-[#151525] text-slate-900 dark:text-white focus:border-[#2525f4] focus:ring-[#2525f4] h-12 pl-11 pr-10 text-base"
                  id="studyLevel"
                  value={studyLevel}
                  onChange={(e) => setStudyLevel(e.target.value)}
                  required
                >
                  <option disabled value="">
                    Select your current level
                  </option>
                  <option value="secondary">
                    Secondary School / High School
                  </option>
                  <option value="undergrad">Undergraduate University</option>
                  <option value="grad">Graduate / Post-Grad</option>
                  <option value="professional">
                    Professional Certification
                  </option>
                  <option value="other">Other / Self-Learner</option>
                </select>
              </div>
            </div>
            {/* Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  className="text-slate-700 dark:text-slate-300 text-sm font-medium leading-normal"
                  htmlFor="password"
                >
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <span className="material-symbols-outlined text-[20px]">
                      lock
                    </span>
                  </span>
                  <input
                    className="w-full rounded-lg border border-slate-300 dark:border-[#2d2d45] bg-slate-50 dark:bg-[#151525] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#2525f4] focus:ring-[#2525f4] h-12 pl-11 pr-4 text-base"
                    id="password"
                    placeholder="Create a password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
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
              <div className="space-y-2">
                <label
                  className="text-slate-700 dark:text-slate-300 text-sm font-medium leading-normal"
                  htmlFor="confirmPassword"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <span className="material-symbols-outlined text-[20px]">
                      lock_reset
                    </span>
                  </span>
                  <input
                    className="w-full rounded-lg border border-slate-300 dark:border-[#2d2d45] bg-slate-50 dark:bg-[#151525] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#2525f4] focus:ring-[#2525f4] h-12 pl-11 pr-4 text-base"
                    id="confirmPassword"
                    placeholder="Repeat password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
            {/* Terms Checkbox */}
            <div className="flex items-start gap-3 pt-2">
              <div className="flex h-6 items-center">
                <input
                  className="h-5 w-5 rounded border-slate-300 dark:border-[#2d2d45] bg-slate-50 dark:bg-[#151525] text-[#2525f4] focus:ring-[#2525f4] focus:ring-offset-0"
                  id="terms"
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                />
              </div>
              <div className="text-sm leading-6">
                <label
                  className="font-medium text-slate-700 dark:text-slate-300"
                  htmlFor="terms"
                >
                  I agree to the{' '}
                  <Link
                    className="font-semibold text-[#2525f4] hover:text-[#2525f4]/80 hover:underline"
                    href="#"
                  >
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link
                    className="font-semibold text-[#2525f4] hover:text-[#2525f4]/80 hover:underline"
                    href="#"
                  >
                    Privacy Policy
                  </Link>
                  .
                </label>
              </div>
            </div>
            {/* Submit Button */}
            <button
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#2525f4] py-3.5 px-4 text-sm font-bold text-white shadow-lg shadow-[#2525f4]/30 transition-all hover:bg-[#2525f4]/90 hover:shadow-[#2525f4]/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2525f4] disabled:opacity-70"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Create Account
                  <span className="material-symbols-outlined text-[20px]">
                    arrow_forward
                  </span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200 dark:border-[#3b3b54]"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-[#1b1b2e] px-2 text-slate-500 dark:text-[#9c9cba]">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Social Login Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                className="flex items-center justify-center gap-2 h-11 rounded-lg border border-slate-200 dark:border-[#3b3b54] bg-white dark:bg-[#252535] hover:bg-slate-50 dark:hover:bg-[#2d2d3f] transition-colors text-slate-700 dark:text-white font-medium text-sm disabled:opacity-50"
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
                Google
              </button>
              <button
                className="flex items-center justify-center gap-2 h-11 rounded-lg border border-slate-200 dark:border-[#3b3b54] bg-white dark:bg-[#252535] hover:bg-slate-50 dark:hover:bg-[#2d2d3f] transition-colors text-slate-700 dark:text-white font-medium text-sm disabled:opacity-50"
                type="button"
                onClick={() => handleOAuth('apple')}
                disabled={isLoading}
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
            {/* Login Link */}
            <div className="text-center pt-2">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Already have an account?
                <Link
                  className="font-semibold text-[#2525f4] hover:text-[#2525f4]/80 hover:underline ml-1"
                  href="/login"
                >
                  Log in here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </main>
      {/* Footer Simple */}
      <footer className="py-6 text-center text-sm text-slate-500 dark:text-slate-600">
        <p>© 2023 StudyForge Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}

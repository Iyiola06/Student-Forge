'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function SignupPage() {
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
          <form className="space-y-6">
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
                  defaultValue=""
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
            <Link href="/dashboard">
              <button
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#2525f4] py-3.5 px-4 text-sm font-bold text-white shadow-lg shadow-[#2525f4]/30 transition-all hover:bg-[#2525f4]/90 hover:shadow-[#2525f4]/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2525f4]"
                type="button"
              >
                Create Account
                <span className="material-symbols-outlined text-[20px]">
                  arrow_forward
                </span>
              </button>
            </Link>
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

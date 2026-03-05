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
  const [avatarUrl, setAvatarUrl] = useState('https://lh3.googleusercontent.com/aida-public/AB6AXuD_PrX8yOs64jgoF50R2Gdmak7Nq9XNBH6jrZGbcMeFZWiTc-RXHJIYwVod5RyMqvpXdyuCh67XqP8diyIZGjPdooGKAN9iNGBZXPBKwdB23Gl_zIV9531fy77kczue-ybewLFkxSWQMdUumyw1dvjOVV4QSWKgD582BzAkdewcGU2Q77mpv1aJco2awv_M5hlPCjjIrGKErnFpvl_jDnr7id6w0GMQFhPBYcB72xFQDQseoc8xqlWGGLMxg092WPdyPddhX5U-OjiN');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const calculatePasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length > 5) score += 1;
    if (pass.length > 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return Math.min(score, 4);
  };

  const pwStrength = calculatePasswordStrength(password);

  const getStrengthLabel = () => {
    if (password.length === 0) return 'Enter a password';
    if (pwStrength < 2) return 'Weak';
    if (pwStrength < 4) return 'Good';
    return 'Strong';
  };

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
        body: JSON.stringify({ firstName, lastName, email, studyLevel, password, avatarUrl }),
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
    <div className="main-bg font-display text-slate-900 dark:text-slate-100 min-h-screen flex flex-col overflow-x-hidden selection:bg-[#ea580c] selection:text-white">
      {/* Header */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-[#2d2d45] px-10 py-4 bg-white dark:bg-[#1b1b2e]/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="relative size-10 flex items-center justify-center">
            <Image
              src="/logo-favicon.png"
              alt="Vui Studify Logo"
              width={40}
              height={40}
              className="object-contain"
              priority
            />
          </div>
          <h2 className="text-slate-900 dark:text-white text-xl font-bold leading-tight tracking-[-0.015em]">
            Vui Studify
          </h2>
        </div>
        <div className="flex flex-1 justify-end gap-8 items-center">
          <div className="hidden md:flex items-center gap-9">
            <Link
              className="text-slate-600 dark:text-slate-300 hover:text-[#ea580c] dark:hover:text-[#ea580c] transition-colors text-sm font-medium leading-normal"
              href="#"
            >
              Home
            </Link>
            <Link
              className="text-slate-600 dark:text-slate-300 hover:text-[#ea580c] dark:hover:text-[#ea580c] transition-colors text-sm font-medium leading-normal"
              href="#"
            >
              Features
            </Link>
            <Link
              className="text-slate-600 dark:text-slate-300 hover:text-[#ea580c] dark:hover:text-[#ea580c] transition-colors text-sm font-medium leading-normal"
              href="#"
            >
              Pricing
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link
              className="text-slate-600 dark:text-slate-300 hover:text-[#ea580c] dark:hover:text-[#ea580c] transition-colors text-sm font-medium leading-normal"
              href="/login"
            >
              Login
            </Link>
            <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-6 bg-[#ea580c] hover:bg-[#ea580c]/90 transition-colors text-white text-sm font-bold leading-normal tracking-[0.015em]">
              <span className="truncate">Sign Up</span>
            </button>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center py-12 px-4 relative">
        {/* Decorative Background Elements */}
        <div className="absolute top-20 left-10 opacity-10 animate-pulse hidden lg:block">
          <Image src="/logo-favicon.png" alt="" width={120} height={120} className="grayscale" />
        </div>
        <div className="absolute bottom-20 right-10 text-[#ea580c]/10 animate-pulse hidden lg:block">
          <span className="material-symbols-outlined text-9xl">menu_book</span>
        </div>
        <div className="absolute top-1/2 left-20 opacity-5 hidden lg:block rotate-12">
          <Image src="/logo-favicon.png" alt="" width={80} height={80} className="grayscale" />
        </div>
        {/* Form Container */}
        <div className="w-full max-w-[640px] premium-card glass-card p-8 md:p-12 z-10">
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
              {AVATAR_OPTIONS.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => setAvatarUrl(url)}
                  className={`group relative ${avatarUrl === url ? 'size-16 border-2 border-[#ea580c] ring-4 ring-[#ea580c]/20 scale-105' : 'size-14 border-2 border-transparent opacity-70 hover:opacity-100 hover:border-[#ea580c]/50 hover:scale-105'} rounded-full overflow-hidden transition-all`}
                  type="button"
                >
                  <Image
                    alt={`Avatar option ${idx + 1}`}
                    className="object-cover"
                    src={url}
                    fill
                    unoptimized={url.startsWith('data:') || url.includes('dicebear.com')}
                  />
                  {avatarUrl === url && (
                    <div className="absolute inset-0 bg-[#ea580c]/40 flex items-center justify-center">
                      <span className="material-symbols-outlined text-white font-bold">
                        check
                      </span>
                    </div>
                  )}
                </button>
              ))}
              {/* If a custom avatar is selected and it isn't one of the predefined options, show it */}
              {avatarUrl && !AVATAR_OPTIONS.includes(avatarUrl) && (
                <button
                  key="custom"
                  onClick={() => setAvatarUrl(avatarUrl)}
                  className={`group relative size-16 border-2 border-[#ea580c] ring-4 ring-[#ea580c]/20 scale-105 rounded-full overflow-hidden transition-all`}
                  type="button"
                >
                  <Image
                    alt="Custom avatar"
                    className="object-cover"
                    src={avatarUrl}
                    fill
                    unoptimized={avatarUrl.startsWith('data:') || avatarUrl.includes('dicebear.com')}
                  />
                  <div className="absolute inset-0 bg-[#ea580c]/40 flex items-center justify-center">
                    <span className="material-symbols-outlined text-white font-bold">
                      check
                    </span>
                  </div>
                </button>
              )}
              <button
                className="group relative size-14 rounded-full overflow-hidden border-2 border-transparent hover:border-[#ea580c]/50 transition-all hover:scale-105 opacity-70 hover:opacity-100 bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
                type="button"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e: any) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const img = document.createElement('img');
                        img.onload = () => {
                          const canvas = document.createElement('canvas');
                          const MAX_SIZE = 256;
                          let width = img.width;
                          let height = img.height;

                          if (width > height) {
                            if (width > MAX_SIZE) {
                              height *= MAX_SIZE / width;
                              width = MAX_SIZE;
                            }
                          } else {
                            if (height > MAX_SIZE) {
                              width *= MAX_SIZE / height;
                              height = MAX_SIZE;
                            }
                          }

                          canvas.width = width;
                          canvas.height = height;
                          const ctx = canvas.getContext('2d');
                          ctx?.drawImage(img, 0, 0, width, height);

                          // Convert to base64 jpeg to keep it extremely lightweight
                          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                          setAvatarUrl(dataUrl);
                        };
                        img.src = event.target?.result as string;
                      };
                      reader.readAsDataURL(file);
                    }
                  };
                  input.click();
                }}
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
                    className="w-full rounded-lg border border-slate-300 dark:border-[#2d2d45] bg-slate-50 dark:bg-[#151525] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#ea580c] focus:ring-[#ea580c] h-12 px-4 text-base"
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
                    className="w-full rounded-lg border border-slate-300 dark:border-[#2d2d45] bg-slate-50 dark:bg-[#151525] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#ea580c] focus:ring-[#ea580c] h-12 px-4 text-base"
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
                  className="w-full rounded-lg border border-slate-300 dark:border-[#2d2d45] bg-slate-50 dark:bg-[#151525] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#ea580c] focus:ring-[#ea580c] h-12 pl-11 pr-4 text-base"
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
                  className="w-full rounded-lg border border-slate-300 dark:border-[#2d2d45] bg-slate-50 dark:bg-[#151525] text-slate-900 dark:text-white focus:border-[#ea580c] focus:ring-[#ea580c] h-12 pl-11 pr-10 text-base"
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
                    className="w-full rounded-lg border border-slate-300 dark:border-[#2d2d45] bg-slate-50 dark:bg-[#151525] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#ea580c] focus:ring-[#ea580c] h-12 pl-11 pr-4 text-base"
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
                  <div className={`h-full w-1/4 rounded-full ${password.length === 0 ? 'bg-slate-200 dark:bg-slate-700' : pwStrength >= 1 ? (pwStrength >= 3 ? 'bg-green-500' : pwStrength === 2 ? 'bg-yellow-500' : 'bg-red-500') : 'bg-red-500'}`}></div>
                  <div className={`h-full w-1/4 rounded-full ${password.length === 0 ? 'bg-slate-200 dark:bg-slate-700' : pwStrength >= 2 ? (pwStrength >= 3 ? 'bg-green-500' : pwStrength === 2 ? 'bg-yellow-500' : 'bg-slate-200 dark:bg-slate-700') : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                  <div className={`h-full w-1/4 rounded-full ${password.length === 0 ? 'bg-slate-200 dark:bg-slate-700' : pwStrength >= 3 ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                  <div className={`h-full w-1/4 rounded-full ${password.length === 0 ? 'bg-slate-200 dark:bg-slate-700' : pwStrength >= 4 ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                </div>
                <p className={`text-xs ${password.length === 0 ? 'text-slate-500' : pwStrength < 2 ? 'text-red-500' : pwStrength < 4 ? 'text-yellow-500' : 'text-green-500'}`}>
                  {getStrengthLabel()}
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
                    className="w-full rounded-lg border border-slate-300 dark:border-[#2d2d45] bg-slate-50 dark:bg-[#151525] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#ea580c] focus:ring-[#ea580c] h-12 pl-11 pr-4 text-base"
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
                  className="h-5 w-5 rounded border-slate-300 dark:border-[#2d2d45] bg-slate-50 dark:bg-[#151525] text-[#ea580c] focus:ring-[#ea580c] focus:ring-offset-0"
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
                    className="font-semibold text-[#ea580c] hover:text-[#ea580c]/80 hover:underline"
                    href="/terms"
                  >
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link
                    className="font-semibold text-[#ea580c] hover:text-[#ea580c]/80 hover:underline"
                    href="/privacy"
                  >
                    Privacy Policy
                  </Link>
                  .
                </label>
              </div>
            </div>
            {/* Submit Button */}
            <button
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#ea580c] py-3.5 px-4 text-sm font-bold text-white shadow-lg shadow-[#ea580c]/30 transition-all hover:bg-[#ea580c]/90 hover:shadow-[#ea580c]/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ea580c] disabled:opacity-70"
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
                Sign up with Google
              </button>
            </div>
            {/* Login Link */}
            <div className="text-center pt-2">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Already have an account?
                <Link
                  className="font-semibold text-[#ea580c] hover:text-[#ea580c]/80 hover:underline ml-1"
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
        <p>© {new Date().getFullYear()} Vui Studify Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}

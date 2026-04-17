'use client';

import Link from 'next/link';
import BrandLogo from '@/components/ui/BrandLogo';

const sections = [
  ['Information we collect', 'We collect the account details, uploaded study materials, and activity signals needed to run your workspace, review history, and wallet.'],
  ['How we use it', 'We use your data to authenticate you, process uploaded materials, generate study content, track review progress, and support billing.'],
  ['AI processing', 'Uploaded notes may be sent to study-generation models through secure API connections so the app can create quizzes, flashcards, summaries, and guided review.'],
  ['Sharing and retention', 'We do not sell your personal data. We retain account and study data only as needed to operate the service and meet legal or support obligations.'],
  ['Your controls', 'You can update profile information, manage preferences, and request account deletion from inside the product.'],
];

export default function PrivacyPolicyPage() {
  return (
    <div className="main-bg min-h-screen text-slate-950 dark:text-white">
      <header className="mx-auto flex w-full max-w-[980px] items-center justify-between px-4 py-5 md:px-6">
        <BrandLogo />
        <Link href="/signup" className="primary-button">
          Get started
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-[980px] flex-col gap-5 px-4 pb-16 md:px-6">
        <section className="glass-panel app-panel">
          <p className="eyebrow">Privacy</p>
          <h1 className="mt-2 text-[25px] leading-[1.05] font-black tracking-[-0.05em] text-slate-950 dark:text-white">Privacy policy</h1>
          <p className="mt-2 text-[14px] leading-6 text-slate-500 dark:text-slate-400">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </section>

        <section className="glass-panel app-panel">
          <div className="app-list">
            {sections.map(([title, body]) => (
              <div key={title} className="app-list-row">
                <div className="min-w-0 flex-1">
                  <h2 className="text-[18px] font-black tracking-[-0.03em] text-slate-950 dark:text-white">{title}</h2>
                  <p className="mt-2 text-[14px] leading-7 text-slate-600 dark:text-slate-300">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-panel app-panel">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-[14px] leading-6 text-slate-600 dark:text-slate-300">If you need help with privacy-related questions, contact support from inside the app.</p>
            <Link href="/login" className="secondary-button">
              Back to login
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

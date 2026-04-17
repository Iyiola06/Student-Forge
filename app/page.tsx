'use client';

import Link from 'next/link';
import BrandLogo from '@/components/ui/BrandLogo';
import { formatNairaFromKobo, getCreditBundles } from '@/lib/billing/config';

const proofPoints = [
  'Upload notes, slides, scanned pages, or plain text.',
  'Check extraction status and preview before generating.',
  'Turn source material into quizzes, flashcards, and review sessions.',
  'Return daily to a queue built around what is due and what is weak.',
];

const bundles = getCreditBundles().slice(0, 3);

export default function LandingPage() {
  return (
    <div className="main-bg min-h-screen text-slate-950 dark:text-white">
      <header className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-4 py-5 md:px-6">
        <BrandLogo subtitle="Daily study workspace" />
        <div className="flex items-center gap-2">
          <Link href="/login" className="secondary-button hidden md:inline-flex">
            Log in
          </Link>
          <Link href="/signup" className="primary-button">
            Start free
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-5 px-4 pb-16 md:px-6">
        <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="glass-panel app-panel">
            <p className="eyebrow">Core loop</p>
            <h1 className="mt-2 text-[25px] leading-[1.05] font-black tracking-[-0.05em] text-slate-950 dark:text-white">
              Turn study material into a daily review habit.
            </h1>
            <p className="mt-3 max-w-[58ch] text-[15px] leading-7 text-slate-600 dark:text-slate-300">
              Sulva&apos;s Studify focuses on one dependable workflow: upload, extract, generate when needed, review what is due, and come
              back tomorrow to continue without losing context.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/signup" className="primary-button">
                Claim starter credits
              </Link>
              <Link href="/dashboard" className="secondary-button">
                Open workspace
              </Link>
            </div>

            <div className="mt-5 app-list">
              {proofPoints.map((point) => (
                <div key={point} className="app-list-row">
                  <div className="flex size-9 items-center justify-center rounded-2xl bg-[#163f73]/8 text-[#163f73] dark:bg-white/6 dark:text-[#f6b252]">
                    <span className="material-symbols-outlined text-[18px]">check</span>
                  </div>
                  <p className="min-w-0 flex-1 text-[14px] leading-6 text-slate-700 dark:text-slate-200">{point}</p>
                </div>
              ))}
            </div>
          </div>

          <section className="glass-panel-strong app-panel text-white">
            <p className="eyebrow !text-amber-200/80">Proof-first view</p>
            <div className="mt-4 app-list border-white/10 bg-white/6">
              <div className="app-list-row border-white/10">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black">Uploaded source</p>
                    <span className="metric-chip !border-white/12 !bg-white/10 !text-white">Ready</span>
                  </div>
                  <p className="mt-2 text-[13px] leading-6 text-white/72">
                    Cell Biology Notes.pdf • extraction preview visible • ready for quizzes, flashcards, or theory prompts.
                  </p>
                </div>
              </div>
              <div className="app-list-row border-white/10">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black">Review queue</p>
                    <span className="metric-chip !border-white/12 !bg-white/10 !text-white">12 due</span>
                  </div>
                  <p className="mt-2 text-[13px] leading-6 text-white/72">
                    Weak-topic pressure and resurfaced mistakes shape what you see next.
                  </p>
                </div>
              </div>
              <div className="app-list-row border-white/10">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black">Wallet clarity</p>
                    <span className="metric-chip !border-white/12 !bg-white/10 !text-white">1,000 credits</span>
                  </div>
                  <p className="mt-2 text-[13px] leading-6 text-white/72">
                    Daily review stays light. Credits are reserved for premium AI actions.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <section className="glass-panel app-panel">
            <p className="eyebrow">Why it works</p>
            <h2 className="panel-title mt-2">One focused product instead of scattered tools</h2>
            <div className="mt-4 app-list">
              {[
                ['Reliability first', 'Processing states, previews, retries, and clear failure messaging build trust.'],
                ['Review is the product', 'Generated output matters only if it feeds tomorrow’s study queue.'],
                ['Wallet with clarity', 'Credits map to premium AI cost instead of forcing a subscription.'],
              ].map(([title, body]) => (
                <div key={title} className="app-list-row">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-slate-950 dark:text-white">{title}</p>
                    <p className="mt-1 text-[13px] leading-6 text-slate-500 dark:text-slate-400">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-panel app-panel">
            <p className="eyebrow">Public bundles</p>
            <h2 className="panel-title mt-2">Three clean top-up options</h2>
            <div className="mt-4 app-list">
              {bundles.map((bundle) => (
                <div key={bundle.id} className="app-list-row">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-slate-950 dark:text-white">{bundle.name}</p>
                    <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
                      {bundle.credits.toLocaleString()} credits • {bundle.tagline}
                    </p>
                  </div>
                  <span className="text-sm font-black text-slate-950 dark:text-white">{formatNairaFromKobo(bundle.amountKobo)}</span>
                </div>
              ))}
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}

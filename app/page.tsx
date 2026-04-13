'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import { getCreditBundles, formatNairaFromKobo } from '@/lib/billing/config';

const bundles = getCreditBundles().slice(0, 3);

const proofPoints = [
  'Upload notes, handouts, slides, or scanned pages',
  'See extraction status and preview before generating',
  'Turn source material into quizzes, flashcards, or guided review',
  'Return daily to a queue built around what is due and what is weak',
];

export default function LandingPage() {
  return (
    <div className="main-bg min-h-screen text-slate-950 dark:text-white">
      <header className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-5 py-5 md:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative size-11 overflow-hidden rounded-2xl bg-[#102117] p-1 shadow-[0_14px_30px_rgba(10,21,15,0.22)]">
            <Image src="/logo-favicon.png" alt="VUI Studify" fill className="object-contain p-1" />
          </div>
          <div>
            <p className="eyebrow">VUI Studify</p>
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Reliable daily revision</p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden text-sm font-black text-slate-700 md:inline dark:text-slate-200">
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#102117] px-4 text-sm font-black text-white transition hover:bg-[#163623]"
          >
            Start free
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1440px] px-5 pb-16 md:px-8">
        <section className="grid gap-8 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-12">
          <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <p className="eyebrow">Core Loop</p>
            <h1 className="mt-4 max-w-4xl text-5xl font-black leading-[0.94] tracking-[-0.07em] md:text-7xl">
              Turn raw study material into a trustworthy daily review habit.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              VUI Studify narrows the experience to one dependable flow: upload, extract, generate, review, return tomorrow, and only pay for premium AI actions when you need them.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex h-14 items-center justify-center rounded-2xl bg-[#102117] px-6 text-base font-black text-white transition hover:bg-[#163623]"
              >
                Claim starter credits
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex h-14 items-center justify-center rounded-2xl border border-black/8 bg-white/60 px-6 text-base font-black text-slate-950 transition hover:border-[#1a5c2a]/30 dark:border-white/10 dark:bg-white/5 dark:text-white"
              >
                Open workspace
              </Link>
            </div>

            <div className="mt-8 grid gap-3 md:grid-cols-2">
              {proofPoints.map((point) => (
                <div key={point} className="glass-panel px-4 py-4 text-sm font-black text-slate-800 dark:text-slate-100">
                  {point}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 22 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.08 }}>
            <div className="glass-panel-strong p-6 text-white md:p-8">
              <p className="eyebrow !text-emerald-200/75">Proof-First Surface</p>
              <div className="mt-5 grid gap-4">
                <div className="rounded-[28px] border border-white/10 bg-white/6 p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-black">Cell Biology Notes.pdf</p>
                    <span className="metric-chip !border-white/10 !bg-white/10 !text-white">ready</span>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-white/75">
                    Preview: mitochondria, ATP production, respiratory enzymes, membrane folds, energy transfer pathways…
                  </p>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-white/6 p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-black">Today’s review queue</p>
                    <span className="metric-chip !border-white/10 !bg-white/10 !text-white">12 due</span>
                  </div>
                  <div className="mt-4 grid gap-3">
                    {['ATP cycle flashcards', 'Weak topic: oxidative phosphorylation', 'Missed quiz item resurfaced'].map((item) => (
                      <div key={item} className="rounded-2xl border border-white/8 bg-black/15 px-4 py-3 text-sm text-white/80">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-white/6 p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-black">Wallet status</p>
                    <span className="metric-chip !border-white/10 !bg-white/10 !text-white">1,000 credits</span>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-white/75">
                    Daily review remains friction-light. Credits are consumed only for premium AI generation, grading, tutoring, and advanced extraction.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="grid gap-6 py-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="eyebrow">What changed</p>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] md:text-5xl">
              One focused study product instead of a pile of disconnected tools.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ['Reliability first', 'File processing states, previews, retries, and clearer failure messaging build trust before novelty.'],
              ['Review is the product', 'Generated output matters only if it turns into tomorrow’s revision queue.'],
              ['Wallet with clarity', 'Credits align premium AI cost with actual usage instead of forcing a subscription.'],
              ['Campus-ready story', 'The product is easier to demo live because the value is obvious in minutes.'],
            ].map(([title, body]) => (
              <div key={title} className="glass-panel p-5">
                <h3 className="text-xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-10">
          <div className="glass-panel p-6 md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="eyebrow">Public Bundles</p>
                <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] md:text-5xl">Three clean top-up options.</h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                Keep pricing simple and seasonal. Credits stay useful across exam cycles, and the public store remains easy to explain.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {bundles.map((bundle) => (
                <div key={bundle.id} className="rounded-[28px] border border-black/5 bg-white/55 p-5 dark:border-white/8 dark:bg-white/5">
                  <p className="eyebrow">{bundle.name}</p>
                  <h3 className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-950 dark:text-white">
                    {bundle.credits.toLocaleString()}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{bundle.tagline}</p>
                  <p className="mt-5 text-lg font-black text-slate-950 dark:text-white">{formatNairaFromKobo(bundle.amountKobo)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

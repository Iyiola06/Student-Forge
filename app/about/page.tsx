'use client';

import Link from 'next/link';
import BrandLogo from '@/components/ui/BrandLogo';

export default function AboutPage() {
  return (
    <div className="main-bg min-h-screen text-slate-950 dark:text-white">
      <header className="mx-auto flex w-full max-w-[1120px] items-center justify-between px-4 py-5 md:px-6">
        <BrandLogo />
        <div className="flex items-center gap-2">
          <Link href="/login" className="secondary-button hidden md:inline-flex">
            Log in
          </Link>
          <Link href="/signup" className="primary-button">
            Start free
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1120px] flex-col gap-5 px-4 pb-16 md:px-6">
        <section className="glass-panel app-panel">
          <p className="eyebrow">About</p>
          <h1 className="mt-2 text-[25px] leading-[1.05] font-black tracking-[-0.05em] text-slate-950 dark:text-white">
            What Sulva&apos;s Studify is built to do
          </h1>
          <p className="mt-3 max-w-[62ch] text-[15px] leading-7 text-slate-600 dark:text-slate-300">
            Sulva&apos;s Studify helps students turn raw study materials into a reliable daily revision loop. Upload notes or handouts,
            check extraction quality, generate practice only when it adds value, and return to a review queue built around what
            is due and what is weak.
          </p>
          <div className="mt-5 app-list">
            {[
              'Upload study notes, slides, handouts, images, and text files into one library.',
              'See processing status and extracted previews before you spend credits on generation.',
              'Turn study material into quizzes, flashcards, and recurring review sessions.',
            ].map((item) => (
              <div key={item} className="app-list-row">
                <div className="flex size-9 items-center justify-center rounded-2xl bg-[#163f73]/8 text-[#163f73] dark:bg-white/6 dark:text-[#f6b252]">
                  <span className="material-symbols-outlined text-[18px]">check</span>
                </div>
                <p className="min-w-0 flex-1 text-[14px] leading-6 text-slate-700 dark:text-slate-200">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <section className="glass-panel app-panel">
            <p className="eyebrow">Built at Venite University</p>
            <h2 className="panel-title mt-2">Who built it</h2>
            <p className="mt-3 text-[15px] leading-7 text-slate-600 dark:text-slate-300">
              Sulva&apos;s Studify was developed within the Programming Entrepreneurship context at Venite University. It started from a
              direct student problem: study tools were either too fragmented, too noisy, or too expensive to trust day after day.
            </p>
          </section>

          <section className="glass-panel app-panel">
            <p className="eyebrow">Facilitator</p>
            <h2 className="panel-title mt-2">Project guidance</h2>
            <p className="mt-3 text-[15px] leading-7 text-slate-600 dark:text-slate-300">
              Iyiola Ogunjobi is credited here as the facilitator behind the project direction. The product emphasis is practical:
              fewer distractions, clearer workflows, and study systems that can survive real exam pressure.
            </p>
          </section>
        </section>

        <section className="glass-panel app-panel">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="eyebrow">Next step</p>
              <h2 className="panel-title mt-2">Open the study workspace</h2>
              <p className="mt-2 text-[14px] leading-6 text-slate-600 dark:text-slate-300">
                Create an account, upload your first resource, and let the review loop do the heavy lifting.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/signup" className="primary-button">
                Create account
              </Link>
              <Link href="/dashboard" className="secondary-button">
                Open app
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

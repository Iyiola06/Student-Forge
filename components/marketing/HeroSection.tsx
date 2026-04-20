import Link from 'next/link';
import { ArrowRight, CheckCircle2, Play, Sparkles } from 'lucide-react';
import Panel from '@/components/ui/Panel';
import { buttonVariants } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const heroPoints = [
  'Upload notes, slides, scanned pages, or plain text.',
  'Generate quizzes, flashcards, and summaries in one pass.',
  'Return to a daily queue shaped by weak topics and due review.',
];

export default function HeroSection() {
  return (
    <section className="bg-[#faf9f6] px-4 pb-20 pt-16 md:px-6 md:pt-20">
      <div className="mx-auto grid w-full max-w-[1240px] items-center gap-12 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="max-w-[620px]">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#3b82f6] dark:text-[#93b7e7]">Daily study workspace</p>
          <h1 className="mt-5 text-5xl font-black leading-[0.95] tracking-[-0.055em] text-slate-900 md:text-6xl dark:text-white">
            Turn any study material into a daily review system.
          </h1>
          <p className="mt-6 max-w-[560px] text-lg leading-9 text-slate-500 dark:text-slate-300">
            {'Sulva\u2019s Studify'} turns notes and PDFs into quizzes, flashcards, and personalized review sessions built to help knowledge stick.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/signup" className={buttonVariants({ variant: 'primary', size: 'hero' })}>
              Start studying smarter
            </Link>
            <Link href="#how-it-works" className={cn(buttonVariants({ variant: 'secondary', size: 'hero' }), 'group')}>
              <Play className="h-4 w-4" />
              <span>See how it works</span>
            </Link>
          </div>

          <div className="mt-8 space-y-3">
            {heroPoints.map((point) => (
              <div key={point} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#eff6ff] text-[#2563eb] dark:bg-white/8 dark:text-[#93b7e7]">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <span className="leading-7">{point}</span>
              </div>
            ))}
          </div>
        </div>

        <Panel variant="spotlight" padding="lg" className="relative overflow-hidden border-white/70 bg-white/90">
          <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-[#bfdbfe] blur-3xl" />
          <div className="absolute -bottom-20 left-0 h-40 w-40 rounded-full bg-[#fde68a] blur-3xl" />

          <div className="relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-white/8">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{'Sulva\u2019s Studify'}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Daily review workspace</p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#eff6ff] px-3 py-1 text-xs font-semibold text-[#2563eb] dark:bg-white/8 dark:text-[#93b7e7]">
                <Sparkles className="h-3.5 w-3.5" />
                Ready to study
              </span>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-[1.1fr_0.9fr]">
              <Panel variant="soft" padding="sm" className="rounded-3xl">
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Review queue</p>
                <p className="mt-3 text-5xl font-black tracking-[-0.05em] text-slate-900 dark:text-white">18</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Items due today</p>

                <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-white/8 dark:bg-white/5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Weak topic</span>
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700 dark:bg-amber-400/12 dark:text-amber-200">
                      Focus
                    </span>
                  </div>
                  <p className="mt-3 text-base font-bold text-slate-900 dark:text-white">General Chemistry</p>
                  <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/8">
                    <div className="h-full w-[34%] rounded-full bg-[#3b82f6]" />
                  </div>
                </div>
              </Panel>

              <div className="space-y-4">
                <Panel variant="inset" padding="sm" className="rounded-3xl">
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Today&apos;s rhythm</p>
                  <div className="mt-4 space-y-3">
                    {['Upload class notes', 'Generate a quick quiz', 'Finish the review queue'].map((item) => (
                      <div key={item} className="flex items-center justify-between rounded-2xl bg-white/80 px-3 py-3 text-sm font-medium text-slate-700 dark:bg-white/6 dark:text-slate-200">
                        <span>{item}</span>
                        <ArrowRight className="h-4 w-4 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </Panel>

                <Panel variant="default" padding="sm" className="rounded-3xl">
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Mastery progress</p>
                  <div className="mt-5 space-y-3">
                    {[
                      ['Biology', '85%'],
                      ['Chemistry', '60%'],
                      ['Physics', '40%'],
                    ].map(([label, value], index) => (
                      <div key={label}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-700 dark:text-slate-200">{label}</span>
                          <span className="font-bold text-slate-500 dark:text-slate-400">{value}</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/8">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              index === 0 ? 'w-[85%] bg-[#3b82f6]' : index === 1 ? 'w-[60%] bg-emerald-500' : 'w-[40%] bg-amber-500'
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </section>
  );
}

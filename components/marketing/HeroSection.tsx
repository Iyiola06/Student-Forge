import Link from 'next/link';
import { ArrowRight, BookOpenCheck, CheckCircle2, Clock3, FileUp, Play, Sparkles, Target } from 'lucide-react';
import { buttonVariants } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const heroPoints = [
  'Upload messy notes, PDFs, slides, or pasted text.',
  'Generate quizzes, flashcards, and summaries in one pass.',
  'Review from a daily queue shaped around weak topics.',
];

const dailyTasks = [
  { label: 'Upload biology notes', meta: '2 min', icon: FileUp },
  { label: 'Take chemistry quiz', meta: '12 cards', icon: BookOpenCheck },
  { label: 'Review weak topics', meta: '18 due', icon: Target },
];

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-slate-200/70 bg-[#f7f4ed] px-4 pb-16 pt-12 md:px-6 md:pb-20 md:pt-16 dark:border-white/8 dark:bg-[#0b1420]">
      <div className="mx-auto grid w-full max-w-[1240px] items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="max-w-[650px]">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#2c5d92] dark:text-[#f6b252]">Daily study workspace</p>
          <h1 className="mt-5 max-w-[12ch] text-5xl font-black leading-[0.98] text-slate-950 md:text-6xl lg:text-7xl dark:text-white">
            Study from what you already have.
          </h1>
          <p className="mt-6 max-w-[590px] text-lg leading-8 text-slate-600 md:text-xl md:leading-9 dark:text-slate-300">
            {'Sulva\u2019s Studify'} turns your class material into a focused routine: upload once, practice actively, and come back to the exact topics that need another pass.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/signup" className={buttonVariants({ variant: 'primary', size: 'hero' })}>
              Start studying
            </Link>
            <Link href="#how-it-works" className={cn(buttonVariants({ variant: 'secondary', size: 'hero' }), 'group bg-white/90 dark:bg-white/8')}>
              <Play className="h-4 w-4" />
              <span>How it works</span>
            </Link>
          </div>

          <div className="mt-8 grid gap-3">
            {heroPoints.map((point) => (
              <div key={point} className="flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#2c5d92] shadow-sm dark:bg-white/8 dark:text-[#f6b252]">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] border border-white/70 bg-white p-3 shadow-[0_28px_80px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-[#101a29]">
          <div className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-[#f8fafc] dark:border-white/8 dark:bg-[#0b1420]">
            <div className="flex flex-col gap-4 border-b border-slate-200/80 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/8 dark:bg-[#111d2b]">
              <div>
                <p className="text-sm font-black text-slate-950 dark:text-white">{'Sulva\u2019s Studify'}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Today&apos;s study plan</p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#eaf2fb] px-3 py-1.5 text-xs font-black text-[#163f73] dark:bg-white/8 dark:text-[#f6b252]">
                <Sparkles className="h-3.5 w-3.5" />
                Ready to study
              </span>
            </div>

            <div className="grid gap-3 p-4 md:grid-cols-[1fr_0.9fr] md:p-5">
              <div className="rounded-[22px] border border-slate-200/80 bg-white p-5 dark:border-white/8 dark:bg-[#111d2b]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-black text-slate-500 dark:text-slate-400">Review queue</p>
                    <p className="mt-3 text-5xl font-black leading-none text-slate-950 dark:text-white">18</p>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">items due today</p>
                  </div>
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eaf2fb] text-[#2c5d92] dark:bg-white/8 dark:text-[#93b7e7]">
                    <Clock3 className="h-5 w-5" />
                  </span>
                </div>

                <div className="mt-6 rounded-[18px] border border-slate-200/80 bg-[#f8fafc] p-4 dark:border-white/8 dark:bg-white/5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-black text-slate-700 dark:text-slate-200">Weak topic</span>
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-700 dark:bg-amber-400/12 dark:text-amber-200">
                      Focus
                    </span>
                  </div>
                  <p className="mt-3 text-base font-black text-slate-950 dark:text-white">General Chemistry</p>
                  <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/8">
                    <div className="h-full w-[34%] rounded-full bg-[#3b82f6]" />
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="rounded-[22px] border border-slate-200/80 bg-white p-4 dark:border-white/8 dark:bg-[#111d2b]">
                  <p className="text-sm font-black text-slate-500 dark:text-slate-400">Next actions</p>
                  <div className="mt-4 grid gap-3">
                    {dailyTasks.map(({ label, meta, icon: Icon }) => (
                      <div key={label} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[16px] bg-[#f1f5f9] px-3 py-3 text-sm text-slate-800 dark:bg-white/6 dark:text-slate-200">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white text-[#2c5d92] dark:bg-white/8 dark:text-[#93b7e7]">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="font-bold">{label}</span>
                        <span className="text-xs font-black text-slate-500 dark:text-slate-400">{meta}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[22px] border border-slate-200/80 bg-white p-4 dark:border-white/8 dark:bg-[#111d2b]">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-slate-500 dark:text-slate-400">Mastery</p>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="mt-4 space-y-3">
                    {[
                      ['Biology', '85%'],
                      ['Chemistry', '60%'],
                      ['Physics', '40%'],
                    ].map(([label, value], index) => (
                      <div key={label}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-bold text-slate-700 dark:text-slate-200">{label}</span>
                          <span className="font-black text-slate-500 dark:text-slate-400">{value}</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/8">
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

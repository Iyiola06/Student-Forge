import Link from 'next/link';
import { ArrowRight, Flame, TimerReset } from 'lucide-react';
import Panel from '@/components/ui/Panel';
import { buttonVariants } from '@/components/ui/Button';
import SectionHeading from '@/components/marketing/SectionHeading';
import SectionWrapper from '@/components/marketing/SectionWrapper';
import { cn } from '@/lib/utils';

const rhythmSteps = [
  {
    title: 'Start where recall is weakest',
    body: 'Review sessions surface the topics under the most pressure so effort goes where it matters.',
  },
  {
    title: 'Keep momentum visible',
    body: 'Due counts, streaks, and mastery make the next step obvious without adding dashboard noise.',
  },
  {
    title: 'Return tomorrow without friction',
    body: 'The queue is already shaped for the next session, so habit feels like continuity instead of setup work.',
  },
];

export default function DailyHabitSection() {
  return (
    <SectionWrapper tone="cream">
      <div className="grid items-center gap-12 lg:grid-cols-[0.92fr_1.08fr]">
        <div>
          <SectionHeading
            align="left"
            eyebrow="Daily review habit"
            title="The homepage now leads into the habit, not just the tools."
            body={'Sulva\u2019s Studify is most valuable when students return daily. This section keeps the focus on rhythm, memory, and clear next actions.'}
          />

          <div className="mt-10 space-y-4">
            {rhythmSteps.map((step, index) => (
              <Panel key={step.title} variant="default" padding="sm" className="rounded-[26px]">
                <div className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#eff6ff] text-sm font-black text-[#2563eb] dark:bg-white/8 dark:text-[#93b7e7]">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-black tracking-[-0.03em] text-slate-900 dark:text-white">{step.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-300">{step.body}</p>
                  </div>
                </div>
              </Panel>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/signup" className={buttonVariants({ variant: 'primary', size: 'hero' })}>
              Start the daily loop
            </Link>
            <Link href="/dashboard" className={cn(buttonVariants({ variant: 'secondary', size: 'hero' }), 'group')}>
              See the workspace
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        <Panel variant="spotlight" padding="lg" className="rounded-[36px]">
          <div className="grid gap-5 md:grid-cols-[1fr_0.92fr]">
            <div className="space-y-5">
              <Panel variant="soft" padding="sm" className="rounded-[24px]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white">Review pulse</p>
                    <p className="mt-2 text-5xl font-black tracking-[-0.05em] text-slate-900 dark:text-white">18</p>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Items due today</p>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eff6ff] text-[#2563eb] dark:bg-white/8 dark:text-[#93b7e7]">
                    <TimerReset className="h-7 w-7" />
                  </div>
                </div>
              </Panel>

              <Panel variant="default" padding="sm" className="rounded-[24px]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white">Current streak</p>
                    <p className="mt-2 text-4xl font-black tracking-[-0.05em] text-slate-900 dark:text-white">5 days</p>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-amber-700 dark:bg-amber-400/12 dark:text-amber-200">
                    <Flame className="h-3.5 w-3.5" />
                    Active
                  </span>
                </div>
              </Panel>

              <Panel variant="default" padding="sm" className="rounded-[24px]">
                <p className="text-sm font-black text-slate-900 dark:text-white">Next best action</p>
                <div className="mt-4 space-y-3">
                  {['Review General Chemistry', 'Clear two flashcard sets', 'Finish today\u2019s quiz run'].map((task) => (
                    <div key={task} className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm font-medium text-slate-700 dark:border-white/8 dark:bg-white/5 dark:text-slate-200">
                      <span>{task}</span>
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            <Panel variant="inset" padding="sm" className="rounded-[28px]">
              <p className="text-sm font-black text-slate-900 dark:text-white">Mastery trend</p>
              <div className="mt-6 flex h-[220px] items-end gap-3 rounded-[24px] border border-[#dbe8fb] bg-white/80 px-4 pb-4 pt-10 dark:border-white/8 dark:bg-white/5">
                {[
                  ['Mon', 'h-[36%]'],
                  ['Tue', 'h-[44%]'],
                  ['Wed', 'h-[58%]'],
                  ['Thu', 'h-[52%]'],
                  ['Fri', 'h-[72%]'],
                  ['Sat', 'h-[68%]'],
                  ['Sun', 'h-[82%]'],
                ].map(([label, height], index) => (
                  <div key={label} className="flex flex-1 flex-col items-center justify-end gap-3">
                    <div
                      className={cn(
                        'w-full rounded-t-[14px]',
                        index === 6 ? 'bg-[linear-gradient(180deg,#3b82f6,#2563eb)]' : 'bg-[linear-gradient(180deg,#bfdbfe,#60a5fa)]',
                        height
                      )}
                    />
                    <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{label}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-500 dark:text-slate-400">
                Review consistency improves when the queue stays obvious, the workload stays finite, and progress feels visible.
              </p>
            </Panel>
          </div>
        </Panel>
      </div>
    </SectionWrapper>
  );
}

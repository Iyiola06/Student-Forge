import Link from 'next/link';
import type { CSSProperties } from 'react';
import AppStatusBadge from '@/components/app/AppStatusBadge';
import Panel from '@/components/ui/Panel';

type NextItem = {
  title: string;
  kind: string;
  dueAt: string;
  masteryScore: number;
};

type DashboardHeroCardProps = {
  dueTodayCount: number;
  overdueCount: number;
  weakTopicCount: number;
  readiness: number;
  streakDays: number;
  nextItem: NextItem | null;
};

export default function DashboardHeroCard({
  dueTodayCount,
  overdueCount,
  weakTopicCount,
  readiness,
  streakDays,
  nextItem,
}: DashboardHeroCardProps) {
  const hasDueWork = dueTodayCount > 0;
  const orbitStyle = {
    '--progress': readiness,
    '--orbit-color': '#2c5d92',
  } as CSSProperties;

  return (
    <Panel variant="spotlight" padding="lg" className="dashboard-hero-panel">
      <div className="dashboard-hero-grid">
        <div className="min-w-0">
          <p className="eyebrow">Next study action</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <AppStatusBadge tone="info">{dueTodayCount} due today</AppStatusBadge>
            {overdueCount ? <AppStatusBadge tone="warning">{overdueCount} overdue</AppStatusBadge> : null}
            <AppStatusBadge tone="neutral">{weakTopicCount} weak topics</AppStatusBadge>
          </div>

          <h2 className="mt-6 max-w-[11ch] text-[clamp(2.4rem,5vw,4.35rem)] font-black leading-[0.95] tracking-[-0.07em] text-slate-950 dark:text-white">
            {hasDueWork ? 'Continue review' : 'Start your next set'}
          </h2>

          <p className="mt-4 max-w-[58ch] text-[15px] leading-8 text-slate-600 dark:text-slate-300">
            {hasDueWork
              ? `Your next focused study block is ready. Clear what is due first, reinforce the weakest topics, and keep today's momentum intact.`
              : `Your queue is clear right now. Generate a fresh quiz or flashcard set to keep Sulva’s Studify moving your streak forward.`}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href={hasDueWork ? '/review' : '/generator'} className="primary-button">
              {hasDueWork ? 'Continue review' : 'Generate practice'}
            </Link>
            <Link href="/resources" className="secondary-button">
              Open library
            </Link>
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-3">
            <div className="dashboard-mini-surface">
              <p className="dashboard-mini-label">Due now</p>
              <p className="mt-3 text-2xl font-black tracking-[-0.05em] text-slate-950 dark:text-white">{dueTodayCount}</p>
              <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
                {overdueCount ? `${overdueCount} item${overdueCount === 1 ? '' : 's'} already slipped past schedule.` : `Nothing overdue at the moment.`}
              </p>
            </div>

            <div className="dashboard-mini-surface">
              <p className="dashboard-mini-label">Readiness</p>
              <p className="mt-3 text-2xl font-black tracking-[-0.05em] text-slate-950 dark:text-white">{readiness}%</p>
              <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
                A live blend of due load, review completion, and weak-topic pressure.
              </p>
            </div>

            <div className="dashboard-mini-surface">
              <p className="dashboard-mini-label">Consistency</p>
              <p className="mt-3 text-2xl font-black tracking-[-0.05em] text-slate-950 dark:text-white">{streakDays} day streak</p>
              <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
                Show up again today and keep the review rhythm intact.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="dashboard-mini-surface">
            <p className="dashboard-mini-label">Next up</p>
            {nextItem ? (
              <>
                <p className="mt-3 text-xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">{nextItem.title}</p>
                <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
                  {nextItem.kind} {'\u2022'} Due {new Date(nextItem.dueAt).toLocaleString()}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <AppStatusBadge tone="info">{nextItem.masteryScore}% mastery</AppStatusBadge>
                  <AppStatusBadge tone="neutral">Queue priority</AppStatusBadge>
                </div>
              </>
            ) : (
              <>
                <p className="mt-3 text-xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">Fresh study material</p>
                <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
                  Build one new set from your uploaded resources and the review engine will take it from there.
                </p>
              </>
            )}
          </div>

          <div className="dashboard-mini-surface flex items-center gap-4">
            <div className="dashboard-progress-orbit" style={orbitStyle}>
              <div className="dashboard-progress-orbit-value">
                <p className="text-[34px] font-black leading-none tracking-[-0.06em] text-slate-950 dark:text-white">{readiness}</p>
                <p className="mt-1 text-[11px] font-black uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">score</p>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="dashboard-mini-label">Study posture</p>
              <p className="mt-3 text-base font-black tracking-[-0.03em] text-slate-950 dark:text-white">Calm, focused, and ready to move</p>
              <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
                Keep the next action small and immediate. Sulva’s Studify will handle the sequence after that.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

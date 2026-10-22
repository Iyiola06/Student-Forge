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
    '--orbit-color': 'var(--accent)',
  } as CSSProperties;

  return (
    <Panel variant="spotlight" padding="default" className="dashboard-hero-panel">
      <div className="dashboard-hero-grid">
        <div className="min-w-0">
          <p className="eyebrow">Next study action</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <AppStatusBadge tone="info">{dueTodayCount} due today</AppStatusBadge>
            {overdueCount ? <AppStatusBadge tone="warning">{overdueCount} overdue</AppStatusBadge> : null}
            <AppStatusBadge tone="neutral">{weakTopicCount} weak topics</AppStatusBadge>
          </div>

          <h2 className="mt-5 text-[32px] font-display font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--text-strong)] sm:text-[38px] dark:text-white">
            {hasDueWork ? 'Continue review' : 'Start your next set'}
          </h2>

          <p className="mt-3 max-w-[48ch] text-sm leading-7 text-[var(--text-body)]">
            {hasDueWork
              ? `Clear today's due items first, then reinforce the weakest topics.`
              : `Generate a fresh quiz or flashcard set to keep your streak moving.`}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link href={hasDueWork ? '/review' : '/generator'} className="primary-button">
              {hasDueWork ? 'Continue review' : 'Generate practice'}
            </Link>
            <Link href="/resources" className="secondary-button">
              Open library
            </Link>
          </div>
        </div>

        <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <div className="dashboard-mini-surface min-w-0">
            <p className="dashboard-mini-label">Next up</p>
            {nextItem ? (
              <>
                <p className="mt-3 truncate text-lg font-display font-semibold tracking-[-0.03em] text-[var(--text-strong)]">{nextItem.title}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
                  {nextItem.kind} {'\u2022'} Due {new Date(nextItem.dueAt).toLocaleString()}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <AppStatusBadge tone="info">{nextItem.masteryScore}% mastery</AppStatusBadge>
                </div>
              </>
            ) : (
              <>
                <p className="mt-3 text-lg font-display font-semibold tracking-[-0.03em] text-[var(--text-strong)]">Fresh study material</p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">Build one new set from your uploaded resources.</p>
              </>
            )}
          </div>

          <div className="dashboard-mini-surface flex min-w-0 items-center gap-4">
            <div className="dashboard-progress-orbit" style={orbitStyle}>
              <div className="dashboard-progress-orbit-value">
                <p className="text-[30px] font-display font-semibold leading-none tracking-[-0.03em] text-[var(--text-strong)]">{readiness}</p>
                <p className="mt-1 text-[12px] font-medium text-[var(--text-soft)]">score</p>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="dashboard-mini-label">Readiness</p>
              <p className="mt-2 text-base font-display font-semibold tracking-[-0.03em] text-[var(--text-strong)]">{readiness}% ready</p>
              <p className="mt-1 text-sm leading-6 text-[var(--text-soft)]">{streakDays} day streak</p>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

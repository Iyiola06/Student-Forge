import type { CSSProperties } from 'react';

type Attempt = {
  id: string;
  result: string;
};

type DashboardProgressClusterProps = {
  examReadinessScore: number;
  reviewCompletionRate: number;
  firstReadyRate: number;
  accuracyRate: number;
  cardsMastered: number;
  level: number;
  xp: number;
  attempts: Attempt[];
};

const metricRows = [
  { key: 'examReadinessScore', label: 'Exam readiness', tone: 'brand' },
  { key: 'reviewCompletionRate', label: 'Completed sessions', tone: 'success' },
  { key: 'firstReadyRate', label: 'Resource readiness', tone: 'brand' },
  { key: 'accuracyRate', label: 'Recent accuracy', tone: 'warm' },
] as const;

export default function DashboardProgressCluster({
  examReadinessScore,
  reviewCompletionRate,
  firstReadyRate,
  accuracyRate,
  cardsMastered,
  level,
  xp,
  attempts,
}: DashboardProgressClusterProps) {
  const orbitStyle = {
    '--progress': examReadinessScore,
    '--orbit-color': 'var(--accent)',
  } as CSSProperties;

  const values = {
    examReadinessScore,
    reviewCompletionRate,
    firstReadyRate,
    accuracyRate,
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
      <div className="dashboard-mini-surface flex flex-col items-center text-center">
        <div className="dashboard-progress-orbit" style={orbitStyle}>
          <div className="dashboard-progress-orbit-value">
            <p className="text-[36px] font-display font-semibold leading-none tracking-[-0.03em] text-[var(--text-strong)]">{examReadinessScore}</p>
            <p className="mt-1 text-[12px] font-medium text-[var(--text-soft)]">readiness</p>
          </div>
        </div>

        <p className="mt-5 text-sm font-display font-semibold tracking-[-0.03em] text-[var(--text-strong)]">Learning posture</p>
        <p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">
          Your pace is being shaped by completion, accuracy, and how cleanly resources become study-ready.
        </p>

        <div className="mt-5 grid w-full gap-3">
          <div className="dashboard-mini-surface p-3">
            <p className="dashboard-mini-label">Cards mastered</p>
            <p className="mt-2 text-xl font-display font-semibold tracking-[-0.03em] text-[var(--text-strong)]">{cardsMastered}</p>
          </div>
          <div className="dashboard-mini-surface p-3">
            <p className="dashboard-mini-label">Level {'\u2022'} XP</p>
            <p className="mt-2 text-xl font-display font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
              {level} {'\u2022'} {xp}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="dashboard-mini-surface space-y-4">
          {metricRows.map((metric) => {
            const value = values[metric.key];

            return (
              <div key={metric.key}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[var(--text-strong)]">{metric.label}</p>
                  <span className="text-sm font-semibold text-[var(--text-soft)]">{value}%</span>
                </div>
                <div className="mt-2 dashboard-progress-track">
                  <div
                    className="dashboard-progress-fill"
                    data-tone={metric.tone === 'brand' ? undefined : metric.tone}
                    style={{ '--value': value } as CSSProperties}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="dashboard-mini-surface">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="dashboard-mini-label">Recent attempts</p>
              <p className="mt-2 text-sm font-semibold text-[var(--text-strong)]">Last answer quality</p>
            </div>
            <p className="text-sm text-[var(--text-soft)]">{attempts.length} captured</p>
          </div>

          {attempts.length ? (
            <div className="dashboard-attempt-strip mt-4">
              {attempts.slice(0, 12).map((attempt) => (
                <span key={attempt.id} className="dashboard-attempt-pill" data-state={attempt.result}>
                  {attempt.result === 'correct' ? '\u2713' : '\u2022'}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm leading-7 text-[var(--text-soft)]">
              Once you begin reviewing, your recent answer quality will appear here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

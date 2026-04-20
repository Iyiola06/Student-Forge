import Link from 'next/link';
import AppSection from '@/components/app/AppSection';
import AppStatCard from '@/components/app/AppStatCard';
import { formatDuration, formatSessionType } from '@/components/review/review-utils';
import type { ReviewSessionSummary as ReviewSessionSummaryType } from '@/components/review/types';

type ReviewSessionSummaryProps = {
  summary: ReviewSessionSummaryType;
  onRestart: (sessionType: ReviewSessionSummaryType['sessionType']) => void;
  isRestarting: boolean;
};

export default function ReviewSessionSummary({ summary, onRestart, isRestarting }: ReviewSessionSummaryProps) {
  const accuracy = summary.totalItems ? Math.round((summary.correctItems / summary.totalItems) * 100) : 0;

  return (
    <div className="review-focus-shell">
      <div className="review-focus-frame">
        <AppSection
          eyebrow="Session complete"
          title="Review block finished"
          description="Your queue, mastery, and weak-topic pressure are now updated. Take the next action while the context is still fresh."
          variant="spotlight"
          className="rounded-[36px]"
          bodyClassName="space-y-6"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="metric-chip">{formatSessionType(summary.sessionType)}</span>
            <span className="metric-chip">{summary.totalItems} items reviewed</span>
            <span className="metric-chip">{formatDuration(summary.durationSeconds)}</span>
          </div>

          <section className="review-summary-grid">
            <AppStatCard label="Accuracy" value={`${accuracy}%`} detail={`${summary.correctItems} correct / ${summary.incorrectItems} needs work`} />
            <AppStatCard label="Weak topics" value={summary.weakTopicCount} detail="Still shaping what should surface next." />
            <AppStatCard label="Duration" value={formatDuration(summary.durationSeconds)} detail="A single focused block, captured cleanly." />
          </section>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
            <AppSection
              eyebrow="Next move"
              title="What to do now"
              description="Choose one clean follow-up instead of reopening the whole app at once."
              variant="soft"
              bodyClassName="flex flex-wrap gap-3"
            >
              <button onClick={() => onRestart(summary.sessionType)} disabled={isRestarting} className="primary-button disabled:opacity-60">
                {isRestarting ? 'Restarting...' : 'Run another session'}
              </button>
              <Link href="/dashboard" className="secondary-button">
                Back to dashboard
              </Link>
              <Link href="/flashcards" className="ghost-button">
                Open flashcards
              </Link>
            </AppSection>

            <AppSection eyebrow="Risk view" title="Weak-topic watchlist" variant="default">
              {summary.weakTopics.length ? (
                <div className="app-list">
                  {summary.weakTopics.slice(0, 4).map((topic) => (
                    <div key={topic.topic} className="app-list-row">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-black text-slate-950 dark:text-white">{topic.topic}</p>
                          <span className="text-sm font-black text-amber-600 dark:text-amber-300">{topic.masteryScore}%</span>
                        </div>
                        <p className="mt-1 text-[13px] leading-6 text-slate-500 dark:text-slate-400">
                          {topic.dueCount} due items {'\u2022'} {topic.mistakesCount} mistakes
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-7 text-slate-500 dark:text-slate-300">
                  No strong weak-topic signal yet. That usually means your queue is still stabilizing.
                </p>
              )}
            </AppSection>
          </div>
        </AppSection>
      </div>
    </div>
  );
}

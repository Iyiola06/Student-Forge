import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { formatSessionType } from '@/components/review/review-utils';
import type { ReviewSessionType } from '@/components/review/types';

type ReviewFocusHeaderProps = {
  sessionType: ReviewSessionType;
  currentIndex: number;
  totalItems: number;
  remainingCount: number;
  weakTopicCount: number;
  masteryScore: number;
  onLeave: () => void;
  trailing?: ReactNode;
};

export default function ReviewFocusHeader({
  sessionType,
  currentIndex,
  totalItems,
  remainingCount,
  weakTopicCount,
  masteryScore,
  onLeave,
  trailing,
}: ReviewFocusHeaderProps) {
  const progress = totalItems ? Math.round(((currentIndex + 1) / totalItems) * 100) : 0;

  return (
    <header className="review-topbar">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/dashboard" className="ghost-button !h-8 !rounded-full !px-0 text-xs">
              Dashboard
            </Link>
            <span className="metric-chip">{formatSessionType(sessionType)}</span>
          </div>
          <h1 className="mt-2 text-[28px] font-black tracking-[-0.05em] text-slate-950 dark:text-white">
            Focus review
          </h1>
          <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-300">
            One item at a time. Keep the screen quiet and your next decision obvious.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="app-toolbar-chip">{masteryScore}% mastery</span>
          {trailing}
          <button onClick={onLeave} className="secondary-button !h-9 !px-3">
            Leave session
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div>
          <div className="flex items-center justify-between gap-3 text-[12px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
            <span>
              Item {currentIndex + 1} of {totalItems}
            </span>
            <span>{progress}% complete</span>
          </div>
          <div className="mt-3 review-progress-track">
            <div className="review-progress-fill" style={{ '--value': progress } as CSSProperties} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="app-toolbar-chip">{remainingCount} remaining</span>
          <span className="app-toolbar-chip">{weakTopicCount} weak topics</span>
        </div>
      </div>
    </header>
  );
}

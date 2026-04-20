'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import AppEmptyState from '@/components/app/AppEmptyState';
import AppSection from '@/components/app/AppSection';
import AppStatCard from '@/components/app/AppStatCard';
import AppStatusBadge from '@/components/app/AppStatusBadge';
import AppShell from '@/components/layout/AppShell';
import ReviewCardStage from '@/components/review/ReviewCardStage';
import ReviewFocusHeader from '@/components/review/ReviewFocusHeader';
import ReviewModeCard from '@/components/review/ReviewModeCard';
import ReviewSessionSummary from '@/components/review/ReviewSessionSummary';
import { formatSessionType } from '@/components/review/review-utils';
import type {
  ReviewQueueResponse,
  ReviewSessionSummary as ReviewSessionSummaryType,
  ReviewSessionType,
} from '@/components/review/types';

const sessionModes: Array<{ id: ReviewSessionType; label: string; body: string }> = [
  { id: 'quick_review', label: 'Quick Review', body: 'Shortest path through what is already due.' },
  { id: 'exam_prep', label: 'Exam Prep', body: 'Due work plus weak-topic reinforcement in one longer block.' },
  { id: 'streak_saver', label: 'Streak Saver', body: 'Minimal queue designed to keep habit continuity alive.' },
];

export default function ReviewPage() {
  const [queue, setQueue] = useState<ReviewQueueResponse | null>(null);
  const [summary, setSummary] = useState<ReviewSessionSummaryType | null>(null);
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null);
  const [startingMode, setStartingMode] = useState<ReviewSessionType | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentItem = queue?.items[currentIndex] ?? null;
  const remainingCount = useMemo(
    () => Math.max(0, (queue?.items.length ?? 0) - currentIndex - (currentItem ? 1 : 0)),
    [currentIndex, currentItem, queue]
  );

  async function startSession(sessionType: ReviewSessionType) {
    setStartingMode(sessionType);
    setError(null);
    setStatusMessage(null);
    setSummary(null);

    const response = await fetch('/api/review/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionType }),
    });

    const payload = await response.json();
    setStartingMode(null);

    if (!response.ok) {
      setError(payload.error || 'Failed to start review session');
      return;
    }

    if (!payload.items?.length) {
      setStatusMessage('Nothing is due right now. Your queue is clear for the moment.');
      setQueue(null);
      setSessionStartedAt(null);
      return;
    }

    setQueue(payload);
    setCurrentIndex(0);
    setShowAnswer(false);
    setSessionStartedAt(Date.now());
    if (payload.resumed) {
      setStatusMessage('Resumed your unfinished review session.');
    }
  }

  async function submitAnswer(result: 'correct' | 'incorrect') {
    if (!queue || !currentItem) return;

    setIsSubmitting(true);
    setError(null);

    const response = await fetch('/api/review/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reviewItemId: currentItem.id,
        reviewSessionId: queue.sessionId,
        result,
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      setIsSubmitting(false);
      setError(payload.error || 'Failed to submit answer');
      return;
    }

    const isLastItem = currentIndex >= queue.items.length - 1;
    if (isLastItem) {
      const completeResponse = await fetch('/api/review/session/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewSessionId: queue.sessionId }),
      });
      const completePayload = await completeResponse.json();
      setIsSubmitting(false);

      if (!completeResponse.ok) {
        setError(completePayload.error || 'Failed to complete review session');
        return;
      }

      const completedItems = Number(completePayload.session?.completed_items || queue.items.length);
      const correctItems = Number(completePayload.session?.correct_items || 0);
      setSummary({
        sessionType: queue.sessionType,
        totalItems: Number(completePayload.session?.total_items || queue.items.length),
        completedItems,
        correctItems,
        incorrectItems: Math.max(0, completedItems - correctItems),
        weakTopicCount: queue.weakTopicCount,
        weakTopics: queue.weakTopics,
        durationSeconds: Math.max(10, Math.round((Date.now() - (sessionStartedAt || Date.now())) / 1000)),
      });
      setStatusMessage('Session completed. Your queue and topic mastery are now updated.');
      setQueue(null);
      setCurrentIndex(0);
      setShowAnswer(false);
      setSessionStartedAt(null);
      return;
    }

    setCurrentIndex((index) => index + 1);
    setShowAnswer(false);
    setIsSubmitting(false);
  }

  function leaveSession() {
    setQueue(null);
    setCurrentIndex(0);
    setShowAnswer(false);
    setSessionStartedAt(null);
    setStatusMessage('Left focus mode. Your active session can be resumed later.');
  }

  if (summary) {
    return <ReviewSessionSummary summary={summary} onRestart={startSession} isRestarting={startingMode === summary.sessionType} />;
  }

  if (queue && currentItem) {
    return (
      <div className="main-bg">
        <div className="review-focus-shell">
          <div className="review-focus-frame">
            <ReviewFocusHeader
              sessionType={queue.sessionType}
              currentIndex={currentIndex}
              totalItems={queue.items.length}
              remainingCount={remainingCount}
              weakTopicCount={queue.weakTopicCount}
              masteryScore={currentItem.masteryScore ?? 0}
              onLeave={leaveSession}
              trailing={showAnswer ? <AppStatusBadge tone="success">Answer visible</AppStatusBadge> : null}
            />

            {error ? (
              <div className="rounded-[24px] border border-red-500/15 bg-red-500/8 px-5 py-4 text-sm text-red-600 dark:text-red-300">
                {error}
              </div>
            ) : null}

            <div className="review-focus-layout">
              <ReviewCardStage
                item={currentItem}
                showAnswer={showAnswer}
                isSubmitting={isSubmitting}
                onRevealToggle={() => setShowAnswer((value) => !value)}
                onRate={submitAnswer}
              />

              <div className="space-y-5">
                <AppSection
                  eyebrow="Session context"
                  title="Stay oriented"
                  description="Keep the side rail informational so the card stays central."
                  variant="soft"
                >
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    <div className="app-meta-tile">
                      <p className="dashboard-mini-label">Current block</p>
                      <p className="mt-2 text-xl font-black tracking-[-0.05em] text-slate-950 dark:text-white">
                        {formatSessionType(queue.sessionType)}
                      </p>
                    </div>
                    <div className="app-meta-tile">
                      <p className="dashboard-mini-label">Remaining</p>
                      <p className="mt-2 text-xl font-black tracking-[-0.05em] text-slate-950 dark:text-white">{remainingCount}</p>
                    </div>
                    <div className="app-meta-tile">
                      <p className="dashboard-mini-label">Due pressure</p>
                      <p className="mt-2 text-xl font-black tracking-[-0.05em] text-slate-950 dark:text-white">{queue.dueCount}</p>
                    </div>
                    <div className="app-meta-tile">
                      <p className="dashboard-mini-label">Weak topics</p>
                      <p className="mt-2 text-xl font-black tracking-[-0.05em] text-slate-950 dark:text-white">{queue.weakTopicCount}</p>
                    </div>
                  </div>
                </AppSection>

                <AppSection
                  eyebrow="Risk view"
                  title="Weak topics"
                  description="A quiet signal for where the review engine still sees fragility."
                >
                  {queue.weakTopics.length ? (
                    <div className="app-list">
                      {queue.weakTopics.map((topic) => (
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
                    <AppEmptyState description="Weak-topic pressure will sharpen as more review data accumulates." />
                  )}
                </AppSection>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppShell
      eyebrow="Review"
      title="Daily review queue"
      description="Choose a focus block and let the next study action become the only thing on screen."
      actions={
        <Link href="/flashcards" className="secondary-button hidden md:inline-flex">
          Open flashcards
        </Link>
      }
    >
      <div className="workspace-stack">
        {error ? (
          <div className="rounded-[24px] border border-red-500/15 bg-red-500/8 px-5 py-4 text-sm text-red-600 dark:text-red-300">
            {error}
          </div>
        ) : null}

        {statusMessage ? (
          <div className="rounded-[24px] border border-emerald-500/15 bg-emerald-500/8 px-5 py-4 text-sm text-emerald-700 dark:text-emerald-300">
            {statusMessage}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-3">
          <AppStatCard label="Session types" value={sessionModes.length} detail="Quick review, exam prep, and streak saver." />
          <AppStatCard label="Focus style" value="1" detail="One central card, one decision, one obvious next move." />
          <AppStatCard label="Fallback" value="Ready" detail="You can always open existing flashcards if you want a lighter pass." />
        </section>

        <AppSection
          eyebrow="Focus mode"
          title="Choose how much review you want"
          description="Each mode uses the same review engine. The difference is how much due work and weak-topic pressure you want to carry into the session."
          variant="spotlight"
        >
          <div className="app-list">
            {sessionModes.map((mode) => (
              <ReviewModeCard
                key={mode.id}
                id={mode.id}
                label={mode.label}
                body={mode.body}
                onStart={startSession}
                isStarting={startingMode === mode.id}
              />
            ))}
          </div>
        </AppSection>

        <AppSection
          eyebrow="How it works"
          title="What updates while you review"
          description="The session stays visually quiet, but the engine is still updating the important learning signals underneath."
        >
          <div className="app-list">
            <div className="app-list-row">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-slate-950 dark:text-white">Spaced repetition</p>
                <p className="mt-1 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  Every rating updates next due date, mastery score, and the review state for that item.
                </p>
              </div>
            </div>
            <div className="app-list-row">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-slate-950 dark:text-white">Weak-topic adaptation</p>
                <p className="mt-1 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  Risk signals tighten around real mistakes and overdue pressure instead of static assumptions.
                </p>
              </div>
            </div>
            <div className="app-list-row">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-slate-950 dark:text-white">Legacy sync</p>
                <p className="mt-1 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  Existing flashcards and quiz questions continue to flow into the review engine automatically.
                </p>
              </div>
            </div>
          </div>
        </AppSection>
      </div>
    </AppShell>
  );
}

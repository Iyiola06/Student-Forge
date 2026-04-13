'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';

type ReviewSessionType = 'quick_review' | 'exam_prep' | 'streak_saver';

type ReviewQueueItem = {
  id: string;
  itemType: 'flashcard' | 'quiz_question';
  sourceTopic?: string | null;
  dueAt: string;
  masteryScore: number;
  reviewState: 'new' | 'learning' | 'review' | 'mastered';
  contentPayload?: Record<string, any>;
};

type ReviewQueueResponse = {
  sessionId: string;
  sessionType: ReviewSessionType;
  resumed?: boolean;
  items: ReviewQueueItem[];
  dueCount: number;
  weakTopicCount: number;
  weakTopics: Array<{
    topic: string;
    masteryScore: number;
    dueCount: number;
    mistakesCount: number;
  }>;
};

const sessionModes: Array<{ id: ReviewSessionType; label: string; body: string }> = [
  { id: 'quick_review', label: 'Quick Review', body: 'Shortest path through what is already due.' },
  { id: 'exam_prep', label: 'Exam Prep', body: 'Due work plus weak-topic reinforcement in one longer block.' },
  { id: 'streak_saver', label: 'Streak Saver', body: 'Minimal queue designed to keep habit continuity alive.' },
];

export default function ReviewPage() {
  const [queue, setQueue] = useState<ReviewQueueResponse | null>(null);
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

    setQueue(payload);
    setCurrentIndex(0);
    setShowAnswer(false);
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
    setIsSubmitting(false);

    if (!response.ok) {
      setError(payload.error || 'Failed to submit answer');
      return;
    }

    const isLastItem = currentIndex >= queue.items.length - 1;
    if (isLastItem) {
      await fetch('/api/review/session/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewSessionId: queue.sessionId }),
      });
      setStatusMessage('Session completed. Your queue and topic mastery are now updated.');
      setQueue(null);
      setCurrentIndex(0);
      setShowAnswer(false);
      return;
    }

    setCurrentIndex((index) => index + 1);
    setShowAnswer(false);
  }

  const sidebar = (
    <>
      <section className="glass-panel app-panel-tight">
        <p className="eyebrow">Review Signals</p>
        <div className="mt-4 app-list">
          <div className="app-list-row">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">Due in session</p>
              <p className="mt-2 text-2xl font-black tracking-[-0.05em] text-slate-950 dark:text-white">{queue?.dueCount ?? 0}</p>
            </div>
          </div>
          <div className="app-list-row">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">Weak topics</p>
              <p className="mt-2 text-2xl font-black tracking-[-0.05em] text-slate-950 dark:text-white">{queue?.weakTopicCount ?? 0}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="glass-panel app-panel-tight">
        <p className="eyebrow">Fallback Route</p>
        <Link
          href="/flashcards"
          className="mt-4 inline-flex h-10 items-center justify-center rounded-2xl bg-[#102117] px-4 text-sm font-black text-white transition hover:bg-[#163623]"
        >
          Open flashcards
        </Link>
      </section>
    </>
  );

  return (
    <AppShell eyebrow="Review" title="Daily review queue" sidebar={sidebar}>
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

      {!queue ? (
        <>
          <section className="glass-panel app-panel">
            <p className="eyebrow">Session Mode</p>
            <h3 className="panel-title mt-2">Choose how much review you want</h3>
            <div className="mt-4 app-list">
              {sessionModes.map((mode) => (
                <div key={mode.id} className="app-list-row items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-slate-950 dark:text-white">{mode.label}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{mode.body}</p>
                  </div>
                  <button
                    onClick={() => startSession(mode.id)}
                    disabled={startingMode === mode.id}
                    className="inline-flex h-10 shrink-0 items-center justify-center rounded-2xl bg-[#102117] px-4 text-sm font-black text-white transition hover:bg-[#163623] disabled:opacity-60"
                  >
                    {startingMode === mode.id ? 'Starting...' : 'Start session'}
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-panel app-panel">
            <p className="eyebrow">Engine</p>
            <h3 className="panel-title mt-2">What gets updated</h3>
            <div className="mt-4 app-list">
              <div className="app-list-row">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-slate-950 dark:text-white">Legacy sync</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Existing flashcards and quiz questions are pulled into the review engine automatically.
                  </p>
                </div>
              </div>
              <div className="app-list-row">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-slate-950 dark:text-white">Spaced repetition</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Every answer updates next due date, mastery score, and the learning state for that item.
                  </p>
                </div>
              </div>
              <div className="app-list-row">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-slate-950 dark:text-white">Topic adaptation</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Weak-topic counts and due pressure now come from actual review results, not static placeholders.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </>
      ) : (
        <section className="grid gap-5 lg:grid-cols-[1.12fr_0.88fr]">
          <section className="glass-panel app-panel">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="eyebrow">{queue.sessionType.replace(/_/g, ' ')}</p>
                <h3 className="panel-title mt-2">
                  Item {currentIndex + 1} of {queue.items.length}
                </h3>
              </div>
              <span className="metric-chip">{currentItem?.masteryScore ?? 0}% mastery</span>
            </div>

            {currentItem ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-[24px] border border-black/5 bg-white/55 p-5 dark:border-white/8 dark:bg-white/5">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                    {currentItem.itemType === 'flashcard' ? 'Prompt' : 'Question'}
                  </p>
                  <p className="mt-3 text-lg font-black leading-8 text-slate-950 dark:text-white">
                    {currentItem.contentPayload?.front || currentItem.contentPayload?.question || currentItem.sourceTopic || 'Review item'}
                  </p>
                  {currentItem.contentPayload?.options?.length ? (
                    <div className="mt-4 grid gap-2.5">
                      {currentItem.contentPayload.options.map((option: string, index: number) => (
                        <div
                          key={`${option}-${index}`}
                          className="rounded-2xl border border-black/5 bg-white/70 px-4 py-2.5 text-sm text-slate-700 dark:border-white/8 dark:bg-white/6 dark:text-slate-200"
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                {showAnswer ? (
                  <div className="rounded-[24px] border border-emerald-500/15 bg-emerald-500/8 p-5">
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300">Answer</p>
                    <p className="mt-3 text-base font-bold leading-7 text-slate-900 dark:text-white">
                      {currentItem.contentPayload?.back ||
                        currentItem.contentPayload?.answer ||
                        currentItem.contentPayload?.model_answer ||
                        'No answer stored yet.'}
                    </p>
                    {currentItem.contentPayload?.explanation ? (
                      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{currentItem.contentPayload.explanation}</p>
                    ) : null}
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setShowAnswer((value) => !value)}
                    className="inline-flex h-10 items-center justify-center rounded-2xl border border-black/8 bg-white/60 px-4 text-sm font-black text-slate-950 transition hover:border-[#1a5c2a]/30 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  >
                    {showAnswer ? 'Hide answer' : 'Reveal answer'}
                  </button>
                  <button
                    onClick={() => submitAnswer('incorrect')}
                    disabled={isSubmitting}
                    className="inline-flex h-10 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 text-sm font-black text-amber-700 transition hover:bg-amber-500/15 dark:text-amber-300 disabled:opacity-60"
                  >
                    Needs work
                  </button>
                  <button
                    onClick={() => submitAnswer('correct')}
                    disabled={isSubmitting}
                    className="inline-flex h-10 items-center justify-center rounded-2xl bg-[#102117] px-4 text-sm font-black text-white transition hover:bg-[#163623] disabled:opacity-60"
                  >
                    I got it
                  </button>
                </div>
              </div>
            ) : null}
          </section>

          <div className="space-y-5">
            <section className="glass-panel app-panel">
              <p className="eyebrow">Queue Health</p>
              <div className="mt-4 app-list">
                <div className="app-list-row">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">Remaining</p>
                    <p className="mt-2 text-2xl font-black tracking-[-0.05em] text-slate-950 dark:text-white">{remainingCount}</p>
                  </div>
                </div>
                <div className="app-list-row">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">Weak topics</p>
                    <p className="mt-2 text-2xl font-black tracking-[-0.05em] text-slate-950 dark:text-white">{queue.weakTopicCount}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="glass-panel app-panel">
              <p className="eyebrow">Weak Topics</p>
              <h3 className="panel-title mt-2">Where the system sees risk</h3>
              <div className="mt-4">
                {queue.weakTopics.length ? (
                  <div className="app-list">
                    {queue.weakTopics.map((topic) => (
                      <div key={topic.topic} className="app-list-row">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-black text-slate-950 dark:text-white">{topic.topic}</p>
                            <span className="text-sm font-black text-amber-600 dark:text-amber-300">{topic.masteryScore}%</span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {topic.dueCount} due items / {topic.mistakesCount} mistakes
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="app-empty">Weak topics will sharpen as you complete more review attempts.</div>
                )}
              </div>
            </section>
          </div>
        </section>
      )}
    </AppShell>
  );
}

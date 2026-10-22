'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import AppStatusBadge from '@/components/app/AppStatusBadge';
import Icon3D from '@/components/ui/Icon3D';
import type { ReviewQueueItem } from '@/components/review/types';
import { getReviewAnswer, getReviewExplanation, getReviewOptions, getReviewPrompt } from '@/components/review/review-utils';
import { GRADE_LABELS, previewIntervals, type Grade, type ScheduleOptions } from '@/lib/review/fsrs';
import { cn } from '@/lib/utils';

export type ReviewSubmission = {
  grade: Grade;
  result: 'correct' | 'incorrect';
  responseTimeMs: number;
  submittedAnswer?: string;
};

type ReviewCardStageProps = {
  item: ReviewQueueItem;
  showAnswer: boolean;
  isSubmitting: boolean;
  onRevealToggle: () => void;
  onSubmit: (submission: ReviewSubmission) => void;
  scheduleOptions?: ScheduleOptions;
};

const GRADE_HINTS: Record<Grade, string> = {
  1: 'Forgot it',
  2: 'Got it, with effort',
  3: 'Recalled it',
  4: 'Instant',
};

const GRADE_TONES: Record<Grade, string> = {
  1: 'bg-[var(--danger-soft)] hover:ring-[var(--danger)]',
  2: 'bg-[var(--warning-soft)] hover:ring-[var(--warning)]',
  3: 'bg-[var(--accent-soft)] hover:ring-[var(--accent)]',
  4: 'bg-[var(--success-soft)] hover:ring-[var(--success)]',
};

function normalise(value: string) {
  return value.trim().toLowerCase().replace(/^[a-d][.)]\s*/, '').replace(/\s+/g, ' ');
}

export default function ReviewCardStage({ item, showAnswer, isSubmitting, onRevealToggle, onSubmit, scheduleOptions }: ReviewCardStageProps) {
  const prompt = getReviewPrompt(item);
  const answer = getReviewAnswer(item);
  const explanation = getReviewExplanation(item);
  const options = getReviewOptions(item);
  const isMcq = options.length > 1;
  const startedAt = useRef(0);
  const [picked, setPicked] = useState<string | null>(null);

  // The parent remounts this component per item (key={item.id}), so state starts fresh.
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const intervals = useMemo(
    () =>
      previewIntervals({
        stability: item.stability ?? 0.3,
        difficulty: item.difficulty ?? 0.5,
        reviewsCount: item.reviewsCount ?? 0,
        lastReviewedAt: item.lastReviewedAt,
      }, new Date(), scheduleOptions),
    [item, scheduleOptions]
  );

  const pickedCorrect = picked !== null && normalise(picked) === normalise(String(answer));
  const answered = isMcq ? picked !== null : showAnswer;

  const submit = (grade: Grade) => {
    if (isSubmitting) return;
    onSubmit({
      grade,
      result: grade >= 2 ? 'correct' : 'incorrect',
      responseTimeMs: Date.now() - startedAt.current,
      submittedAnswer: picked ?? undefined,
    });
  };

  const pick = (option: string) => {
    if (picked !== null) return;
    setPicked(option);
    if (!showAnswer) onRevealToggle();
  };

  // Keyboard: space reveals, 1-4 grade, a-d pick an option.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key === ' ' && !isMcq && !showAnswer) {
        event.preventDefault();
        onRevealToggle();
      } else if (answered && ['1', '2', '3', '4'].includes(event.key)) {
        const grade = Number(event.key) as Grade;
        if (isMcq && !pickedCorrect && grade > 1) return;
        submit(grade);
      } else if (isMcq && picked === null) {
        const index = 'abcd'.indexOf(event.key.toLowerCase());
        if (index >= 0 && options[index]) pick(options[index]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // A wrong MCQ pick is a lapse; a right one can still be graded Hard / Good / Easy.
  const grades: Grade[] = isMcq && picked !== null && !pickedCorrect ? [1] : [1, 2, 3, 4];

  return (
    <section className="review-stage">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <AppStatusBadge tone="neutral">{item.itemType === 'flashcard' ? 'Flashcard' : 'Quiz question'}</AppStatusBadge>
          <AppStatusBadge tone={item.reviewState === 'new' ? 'info' : item.reviewState === 'learning' ? 'warning' : 'success'}>
            {item.reviewState}
          </AppStatusBadge>
          {item.sourceTopic ? <AppStatusBadge tone="neutral">{item.sourceTopic}</AppStatusBadge> : null}
        </div>

        <div className="review-prompt-shell">
          <p className="eyebrow">{item.itemType === 'flashcard' ? 'Recall this' : 'Question'}</p>
          <div className="mt-3 font-display text-[clamp(1.45rem,3.2vw,2.4rem)] leading-[1.18] font-semibold tracking-[-0.02em] text-[var(--text-strong)]">
            <ReactMarkdown>{String(prompt)}</ReactMarkdown>
          </div>

          {isMcq ? (
            <div className="mt-6 grid gap-2.5">
              {options.map((option, index) => {
                const isAnswer = normalise(option) === normalise(String(answer));
                const isPicked = picked === option;
                return (
                  <button
                    key={`${option}-${index}`}
                    type="button"
                    onClick={() => pick(option)}
                    disabled={picked !== null}
                    className={cn(
                      'review-option flex items-center gap-3 transition',
                      picked === null && 'hover:-translate-y-px hover:border-[var(--accent)]',
                      picked !== null && isAnswer && '!border-[var(--success)] !bg-[var(--success-soft)]',
                      isPicked && !isAnswer && '!border-[var(--danger)] !bg-[var(--danger-soft)]',
                      picked !== null && !isAnswer && !isPicked && 'opacity-60'
                    )}
                  >
                    <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--card-2)] text-[12px] font-semibold text-[var(--text-soft)]">
                      {'ABCD'[index] ?? index + 1}
                    </span>
                    <span className="text-[var(--text-strong)]">{option}</span>
                  </button>
                );
              })}
            </div>
          ) : !showAnswer ? (
            <p className="mt-5 flex items-center gap-2 text-sm text-[var(--text-soft)]">
              <Icon3D name="thinking" size={22} />
              Say or write the answer in your head first. Effortful recall is what makes it stick.
            </p>
          ) : null}
        </div>

        {showAnswer || picked !== null ? (
          <div className={cn('review-answer-shell', isMcq && picked !== null && !pickedCorrect && '!bg-[var(--danger-soft)]')}>
            <div className="flex items-center gap-2">
              <Icon3D name={isMcq ? (pickedCorrect ? 'check' : 'thinking') : 'bulb'} size={24} />
              <p className="eyebrow !text-[var(--text-strong)]">
                {isMcq ? (pickedCorrect ? 'Correct' : 'Not quite. Here is why.') : 'Answer'}
              </p>
            </div>
            <div className="study-prose mt-3 text-[16px]">
              <ReactMarkdown>{String(answer)}</ReactMarkdown>
            </div>
            {explanation ? <p className="mt-3 text-sm leading-7 text-[var(--text-body)]">{explanation}</p> : null}
          </div>
        ) : null}
      </div>

      <div className="space-y-4">
        {!isMcq ? (
          <button onClick={onRevealToggle} className={showAnswer ? 'secondary-button' : 'primary-button'}>
            {showAnswer ? 'Hide answer' : 'Reveal answer'}
            {!showAnswer ? <kbd className="ml-1 rounded-md bg-white/15 px-1.5 text-[11px]">Space</kbd> : null}
          </button>
        ) : null}

        {answered ? (
          <div>
            <p className="mb-2 text-[13px] text-[var(--text-soft)]">How well did you know it? Your next review is scheduled from this.</p>
            <div className={cn('grid gap-2.5', grades.length === 1 ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-4')}>
              {grades.map((grade) => (
                <button
                  key={grade}
                  onClick={() => submit(grade)}
                  disabled={isSubmitting}
                  className={cn(
                    'rounded-[20px] px-4 py-3 text-left ring-2 ring-transparent transition hover:-translate-y-px disabled:opacity-60',
                    GRADE_TONES[grade]
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-display text-[15px] font-semibold text-[var(--text-strong)]">
                      {grades.length === 1 ? 'Review again soon' : GRADE_LABELS[grade]}
                    </span>
                    <kbd className="rounded-md bg-[var(--card)] px-1.5 text-[11px] text-[var(--text-soft)]">{grade}</kbd>
                  </span>
                  <span className="mt-1 block text-[12.5px] text-[var(--text-soft)]">
                    {GRADE_HINTS[grade]} &middot; next in {intervals[grade]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : isMcq ? (
          <p className="text-sm text-[var(--text-soft)]">Pick an answer (or press A to D). Committing before you see it is the point.</p>
        ) : null}
      </div>
    </section>
  );
}

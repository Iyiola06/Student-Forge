'use client';

import { useMemo, useState } from 'react';
import Icon3D from '@/components/ui/Icon3D';
import { cn } from '@/lib/utils';

type PracticeItemProps = {
  index: number;
  kind: 'mcq' | 'flashcards' | 'theory';
  item: {
    question?: string;
    options?: string[];
    answer?: string;
    explanation?: string;
    front?: string;
    back?: string;
    model_answer?: string;
    key_points?: string[];
  };
  onAnswered?: (correct: boolean) => void;
};

function reportToReview(question: string | undefined, correct: boolean, submittedAnswer?: string) {
  if (!question) return;
  // Fire and forget: practice results feed the spaced-repetition queue.
  fetch('/api/review/practice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, correct, submittedAnswer }),
  }).catch(() => undefined);
}

/** One generated item, practised actively: commit to an answer before seeing it. */
export default function PracticeItem({ index, kind, item, onAnswered }: PracticeItemProps) {
  const [picked, setPicked] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [selfRated, setSelfRated] = useState<boolean | null>(null);
  const options = useMemo(() => {
    const list = Array.isArray(item.options) ? item.options.filter(Boolean) : [];
    // Stable shuffle once the question has fully streamed, so the answer is not always first.
    if (list.length < 4 || !item.answer) return list;
    let seed = 0;
    for (const ch of String(item.question ?? '')) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
    const shuffled = [...list];
    for (let i = shuffled.length - 1; i > 0; i--) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const j = seed % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [item.options, item.answer, item.question]);
  const isMcq = kind === 'mcq' && options.length > 1;
  const correct = picked !== null && picked.trim() === String(item.answer ?? '').trim();

  const pick = (option: string) => {
    if (picked !== null || !item.answer) return;
    setPicked(option);
    const wasCorrect = option.trim() === String(item.answer).trim();
    onAnswered?.(wasCorrect);
    reportToReview(item.question, wasCorrect, option);
  };

  return (
    <div className="rounded-[22px] border border-[var(--line)] bg-[var(--card)] p-4 sm:p-5">
      <p className="text-[12px] text-[var(--text-soft)]">{kind === 'flashcards' ? `Card ${index + 1}` : `Question ${index + 1}`}</p>
      <p className="mt-1.5 font-display text-[16px] leading-7 font-medium text-[var(--text-strong)]">{item.question || item.front}</p>

      {isMcq ? (
        <div className="mt-3 grid gap-2">
          {options.map((option, i) => {
            const isAnswer = option.trim() === String(item.answer ?? '').trim();
            return (
              <button
                key={`${option}-${i}`}
                type="button"
                disabled={picked !== null || !item.answer}
                onClick={() => pick(option)}
                className={cn(
                  'flex items-start gap-3 rounded-2xl border border-[var(--line)] px-3.5 py-2.5 text-left text-[14px] text-[var(--text-body)] transition',
                  picked === null && 'hover:border-[var(--accent)]',
                  picked !== null && isAnswer && 'border-[var(--success)] bg-[var(--success-soft)] text-[var(--text-strong)]',
                  picked === option && !isAnswer && 'border-[var(--danger)] bg-[var(--danger-soft)]',
                  picked !== null && !isAnswer && picked !== option && 'opacity-60'
                )}
              >
                <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--card-2)] text-[11px] font-semibold text-[var(--text-soft)]">
                  {'ABCD'[i] ?? i + 1}
                </span>
                {option}
              </button>
            );
          })}
        </div>
      ) : null}

      {isMcq && picked !== null ? (
        <div className={cn('mt-3 flex gap-3 rounded-2xl p-3 text-[13.5px] leading-6', correct ? 'bg-[var(--success-soft)]' : 'bg-[var(--danger-soft)]')}>
          <Icon3D name={correct ? 'check' : 'thinking'} size={22} className="mt-0.5 shrink-0" />
          <p className="text-[var(--text-body)]">
            <span className="font-semibold text-[var(--text-strong)]">{correct ? 'Correct. ' : `Answer: ${item.answer}. `}</span>
            {item.explanation}
          </p>
        </div>
      ) : null}

      {!isMcq ? (
        revealed ? (
          <div className="mt-3 rounded-2xl bg-[var(--accent-softer)] p-3 text-[14px] leading-6 text-[var(--text-body)]">
            <p>{item.back || item.model_answer || item.answer}</p>
            {Array.isArray(item.key_points) && item.key_points.length ? (
              <ul className="mt-2 list-disc space-y-0.5 pl-5 text-[13px]">
                {item.key_points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            ) : null}
            {item.explanation && kind === 'theory' ? <p className="mt-2 text-[13px] text-[var(--text-soft)]">{item.explanation}</p> : null}
            {selfRated === null ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-[12.5px] text-[var(--text-soft)]">Did you get it?</span>
                {[true, false].map((knew) => (
                  <button
                    key={String(knew)}
                    type="button"
                    onClick={() => {
                      setSelfRated(knew);
                      onAnswered?.(knew);
                      reportToReview(item.question || item.front, knew);
                    }}
                    className={cn('!h-8 !px-3 !text-[12.5px]', knew ? 'primary-button' : 'secondary-button')}
                  >
                    {knew ? 'Yes, I knew it' : 'Not yet'}
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-[12.5px] text-[var(--text-soft)]">
                {selfRated ? 'Nice. It will come back later to lock it in.' : 'No problem. It is scheduled to come back soon.'}
              </p>
            )}
          </div>
        ) : (
          <button type="button" onClick={() => setRevealed(true)} className="secondary-button mt-3 !h-9 !px-4">
            Think, then reveal
          </button>
        )
      ) : null}
    </div>
  );
}

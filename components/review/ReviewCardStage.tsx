import AppStatusBadge from '@/components/app/AppStatusBadge';
import type { ReviewQueueItem } from '@/components/review/types';
import {
  getReviewAnswer,
  getReviewExplanation,
  getReviewOptions,
  getReviewPrompt,
} from '@/components/review/review-utils';

type ReviewCardStageProps = {
  item: ReviewQueueItem;
  showAnswer: boolean;
  isSubmitting: boolean;
  onRevealToggle: () => void;
  onRate: (result: 'correct' | 'incorrect') => void;
};

export default function ReviewCardStage({
  item,
  showAnswer,
  isSubmitting,
  onRevealToggle,
  onRate,
}: ReviewCardStageProps) {
  const prompt = getReviewPrompt(item);
  const answer = getReviewAnswer(item);
  const explanation = getReviewExplanation(item);
  const options = getReviewOptions(item);

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
          <p className="eyebrow">{item.itemType === 'flashcard' ? 'Prompt' : 'Question'}</p>
          <p className="mt-4 text-[clamp(1.7rem,4vw,3.1rem)] font-black leading-[1.08] tracking-[-0.055em] text-slate-950 dark:text-white">
            {prompt}
          </p>

          {options.length ? (
            <div className="mt-6 grid gap-3">
              {options.map((option, index) => (
                <div key={`${option}-${index}`} className="review-option">
                  {option}
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {showAnswer ? (
          <div className="review-answer-shell">
            <p className="eyebrow">Answer</p>
            <p className="mt-4 text-lg font-black leading-8 text-slate-950 dark:text-white">{answer}</p>
            {explanation ? <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">{explanation}</p> : null}
          </div>
        ) : null}
      </div>

      <div className="space-y-4">
        <button onClick={onRevealToggle} className={showAnswer ? 'secondary-button' : 'primary-button'}>
          {showAnswer ? 'Hide answer' : 'Reveal answer'}
        </button>

        {showAnswer ? (
          <div className="review-rating-grid">
            <button
              onClick={() => onRate('incorrect')}
              disabled={isSubmitting}
              data-tone="miss"
              className="review-rating-button disabled:opacity-60"
            >
              <p className="text-sm font-black text-slate-950 dark:text-white">Needs work</p>
              <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-300">
                Keep this card close and bring it back sooner.
              </p>
            </button>
            <button
              onClick={() => onRate('correct')}
              disabled={isSubmitting}
              data-tone="got-it"
              className="review-rating-button disabled:opacity-60"
            >
              <p className="text-sm font-black text-slate-950 dark:text-white">Locked in</p>
              <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-300">
                Move it forward and let spacing do the rest.
              </p>
            </button>
          </div>
        ) : (
          <p className="text-sm leading-7 text-slate-500 dark:text-slate-300">
            Reveal the answer first, then rate how well you actually knew it.
          </p>
        )}
      </div>
    </section>
  );
}

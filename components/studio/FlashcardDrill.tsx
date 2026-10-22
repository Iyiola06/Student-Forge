'use client';

import { useEffect, useState } from 'react';
import Icon3D from '@/components/ui/Icon3D';
import { cn } from '@/lib/utils';

export type DrillCard = { front: string; back: string };

type FlashcardDrillProps = {
  cards: DrillCard[];
  onExit: () => void;
};

/** Quick flip-card drill. Cards you miss go to the back of the pile until you know them. */
export default function FlashcardDrill({ cards, onExit }: FlashcardDrillProps) {
  const [queue, setQueue] = useState(() => cards.map((_, index) => index));
  const [flipped, setFlipped] = useState(false);
  const [missed, setMissed] = useState<Set<number>>(() => new Set());
  const [knownFirstTry, setKnownFirstTry] = useState(0);

  const current = queue[0];
  const done = queue.length === 0;

  const answer = (knew: boolean) => {
    if (current === undefined) return;
    setFlipped(false);
    if (knew) {
      if (!missed.has(current)) setKnownFirstTry((n) => n + 1);
      setQueue((q) => q.slice(1));
    } else {
      setMissed((m) => new Set(m).add(current));
      // Bring it back a few cards later, not immediately.
      setQueue((q) => {
        const rest = q.slice(1);
        const at = Math.min(rest.length, 3);
        return [...rest.slice(0, at), current, ...rest.slice(at)];
      });
    }
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key === ' ') {
        event.preventDefault();
        setFlipped((f) => !f);
      } else if (flipped && event.key === '1') answer(false);
      else if (flipped && event.key === '2') answer(true);
      else if (event.key === 'Escape') onExit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (done) {
    return (
      <div className="flex flex-col items-center rounded-[28px] border border-[var(--line)] bg-[var(--card)] p-8 text-center">
        <Icon3D name={missed.size ? 'flexed' : 'party'} size={80} className="animate-float" />
        <h3 className="mt-4 font-display text-[22px] font-semibold text-[var(--text-strong)]">
          {missed.size ? 'Drill complete' : 'Perfect run!'}
        </h3>
        <p className="mt-2 max-w-sm text-sm text-[var(--text-soft)]">
          {knownFirstTry} of {cards.length} known on the first try.
          {missed.size ? ` ${missed.size} needed another look.` : ''} Every card is also in your spaced review queue, which brings it back
          right before you would forget it.
        </p>
        <div className="mt-5 flex gap-2">
          <button className="secondary-button" onClick={() => { setQueue(cards.map((_, i) => i)); setMissed(new Set()); setKnownFirstTry(0); }}>
            Drill again
          </button>
          <button className="primary-button" onClick={onExit}>
            Done
          </button>
        </div>
      </div>
    );
  }

  const card = cards[current];
  const progress = Math.round(((cards.length - queue.length) / Math.max(1, cards.length)) * 100);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="dashboard-progress-track flex-1">
          <div className="dashboard-progress-fill" style={{ '--value': progress } as React.CSSProperties} />
        </div>
        <span className="text-[12.5px] text-[var(--text-soft)]">{queue.length} left</span>
        <button className="ghost-button !h-8 !px-3" onClick={onExit}>
          Exit
        </button>
      </div>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="perspective-1000 block h-[320px] w-full text-left sm:h-[360px]"
        aria-label={flipped ? 'Show question' : 'Show answer'}
      >
        <div className={cn('preserve-3d relative h-full w-full transition-transform duration-500', flipped && 'rotate-y-180')}>
          <div className="backface-hidden absolute inset-0 flex flex-col justify-between rounded-[32px] border border-[var(--line)] bg-[var(--card)] p-7 shadow-[var(--shadow-md)] pastel-sky">
            <span className="pill-tag w-fit">Question {missed.has(current) ? '• again' : ''}</span>
            <p className="font-display text-[clamp(1.3rem,3vw,1.9rem)] leading-snug font-semibold text-[var(--text-strong)]">{card.front}</p>
            <span className="text-[12.5px] text-[var(--text-soft)]">Think of the answer, then tap or press Space</span>
          </div>
          <div className="backface-hidden rotate-y-180 absolute inset-0 flex flex-col justify-between rounded-[32px] border border-[var(--line)] bg-[var(--card)] p-7 shadow-[var(--shadow-md)] pastel-mint">
            <span className="pill-tag w-fit">Answer</span>
            <p className="text-[clamp(1.05rem,2.4vw,1.4rem)] leading-relaxed text-[var(--text-strong)]">{card.back}</p>
            <span className="text-[12.5px] text-[var(--text-soft)]">Be honest: it only helps you</span>
          </div>
        </div>
      </button>

      <div className={cn('grid grid-cols-2 gap-3 transition', flipped ? 'opacity-100' : 'pointer-events-none opacity-40')}>
        <button className="rounded-[20px] bg-[var(--warning-soft)] px-4 py-3 text-left" onClick={() => answer(false)}>
          <span className="font-display text-[15px] font-semibold text-[var(--text-strong)]">Not yet</span>
          <span className="block text-[12px] text-[var(--text-soft)]">Show it again soon (1)</span>
        </button>
        <button className="rounded-[20px] bg-[var(--success-soft)] px-4 py-3 text-left" onClick={() => answer(true)}>
          <span className="font-display text-[15px] font-semibold text-[var(--text-strong)]">I knew it</span>
          <span className="block text-[12px] text-[var(--text-soft)]">Next card (2)</span>
        </button>
      </div>
    </div>
  );
}

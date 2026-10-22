import { retrievability, type FsrsParams } from '@/lib/review/fsrs';

export type ReviewObservation = {
  /** Model stability before the review (days). */
  stability: number;
  elapsedDays: number;
  recalled: boolean;
};

export const MIN_OBSERVATIONS = 200;

function logLoss(observations: ReviewObservation[], scale: number) {
  let loss = 0;
  for (const o of observations) {
    const p = Math.min(0.999, Math.max(0.001, retrievability(o.elapsedDays, o.stability * scale)));
    loss -= o.recalled ? Math.log(p) : Math.log(1 - p);
  }
  return loss / observations.length;
}

/**
 * Fits a personal stability scale: how much faster or slower this student forgets than the
 * default FSRS model predicts. Golden-section search on log-loss over [0.3, 3].
 * Returns null when there is not enough history to say anything reliable.
 */
export function fitPersonalParams(observations: ReviewObservation[]): (FsrsParams & { loss: number; baselineLoss: number }) | null {
  const usable = observations.filter((o) => o.elapsedDays >= 0.5 && o.stability > 0);
  if (usable.length < MIN_OBSERVATIONS) return null;

  let lo = Math.log(0.3);
  let hi = Math.log(3);
  const phi = (Math.sqrt(5) - 1) / 2;
  let a = hi - phi * (hi - lo);
  let b = lo + phi * (hi - lo);
  let fa = logLoss(usable, Math.exp(a));
  let fb = logLoss(usable, Math.exp(b));
  for (let i = 0; i < 40; i++) {
    if (fa < fb) {
      hi = b;
      b = a;
      fb = fa;
      a = hi - phi * (hi - lo);
      fa = logLoss(usable, Math.exp(a));
    } else {
      lo = a;
      a = b;
      fa = fb;
      b = lo + phi * (hi - lo);
      fb = logLoss(usable, Math.exp(b));
    }
  }
  const scale = Math.exp((lo + hi) / 2);
  return {
    stabilityScale: Math.round(scale * 1000) / 1000,
    fittedOn: usable.length,
    fittedAt: new Date().toISOString(),
    loss: logLoss(usable, scale),
    baselineLoss: logLoss(usable, 1),
  };
}

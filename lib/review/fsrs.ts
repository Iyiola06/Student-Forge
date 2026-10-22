/**
 * FSRS-4.5 style memory model (Free Spaced Repetition Scheduler), default parameters.
 *
 * Each card keeps a stability S (days until recall probability drops to 90%) and a
 * difficulty D (1-10). After every review, S and D are updated from the grade and from how
 * much time actually passed, and the card is scheduled for when recall is predicted to hit
 * the target retention. Pure and isomorphic so the UI can preview intervals exactly.
 */

export type Grade = 1 | 2 | 3 | 4; // Again, Hard, Good, Easy

export const GRADE_LABELS: Record<Grade, string> = { 1: 'Again', 2: 'Hard', 3: 'Good', 4: 'Easy' };

const W = [0.4072, 1.1829, 3.1262, 15.4722, 7.2102, 0.5316, 1.0651, 0.0234, 1.616, 0.1544, 1.0824, 1.9813, 0.0953, 0.2975, 2.2042, 0.2407, 2.9466];
const DECAY = -0.5;
const FACTOR = 19 / 81;
const DAY_MS = 86_400_000;
export const TARGET_RETENTION = 0.9;
export const MAX_INTERVAL_DAYS = 365;
const RELEARN_MINUTES = 10;

export type MemoryState = {
  stability: number;
  difficulty: number;
  reviewsCount: number;
  lastReviewedAt?: string | null;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function retrievability(elapsedDays: number, stability: number) {
  return Math.pow(1 + (FACTOR * Math.max(0, elapsedDays)) / Math.max(0.1, stability), DECAY);
}

function initialStability(grade: Grade) {
  return W[grade - 1];
}

function initialDifficulty(grade: Grade) {
  return clamp(W[4] - Math.exp(W[5] * (grade - 1)) + 1, 1, 10);
}

/** Older rows stored difficulty on a 0-1 scale; FSRS uses 1-10. */
function normaliseState(state: MemoryState) {
  const legacy = state.difficulty < 1;
  return {
    stability: Math.max(0.1, Number(state.stability) || 0.3),
    difficulty: legacy ? clamp(1 + Number(state.difficulty) * 9, 1, 10) : clamp(Number(state.difficulty) || 5, 1, 10),
    isNew: !state.reviewsCount,
  };
}

export type ScheduleResult = {
  stability: number;
  difficulty: number;
  intervalDays: number;
  nextDueAt: string;
  retrievability: number;
};

export function schedule(state: MemoryState, grade: Grade, now = new Date()): ScheduleResult {
  const current = normaliseState(state);
  const elapsedDays = state.lastReviewedAt ? (now.getTime() - new Date(state.lastReviewedAt).getTime()) / DAY_MS : 0;
  const r = current.isNew ? 1 : retrievability(elapsedDays, current.stability);

  let stability: number;
  let difficulty: number;

  if (current.isNew) {
    stability = initialStability(grade);
    difficulty = initialDifficulty(grade);
  } else {
    const nextD = current.difficulty - W[6] * (grade - 3);
    difficulty = clamp(W[7] * initialDifficulty(4) + (1 - W[7]) * nextD, 1, 10);

    if (grade === 1) {
      stability = Math.min(
        current.stability,
        W[11] * Math.pow(difficulty, -W[12]) * (Math.pow(current.stability + 1, W[13]) - 1) * Math.exp(W[14] * (1 - r))
      );
    } else {
      const hardPenalty = grade === 2 ? W[15] : 1;
      const easyBonus = grade === 4 ? W[16] : 1;
      const growth =
        Math.exp(W[8]) * (11 - difficulty) * Math.pow(current.stability, -W[9]) * (Math.exp(W[10] * (1 - r)) - 1) * hardPenalty * easyBonus;
      stability = current.stability * (1 + Math.max(0.05, growth));
    }
  }

  stability = clamp(stability, 0.1, 36500);

  let intervalDays: number;
  let nextDueAt: Date;
  if (grade === 1) {
    intervalDays = 0;
    nextDueAt = new Date(now.getTime() + RELEARN_MINUTES * 60_000);
  } else {
    // Interval where predicted recall equals the target retention.
    const ideal = (stability / FACTOR) * (Math.pow(TARGET_RETENTION, 1 / DECAY) - 1);
    intervalDays = clamp(Math.round(ideal), 1, MAX_INTERVAL_DAYS);
    if (grade === 2) intervalDays = Math.max(1, Math.min(intervalDays, Math.round(ideal * 0.8) || 1));
    nextDueAt = new Date(now.getTime() + intervalDays * DAY_MS);
  }

  return {
    stability: Math.round(stability * 100) / 100,
    difficulty: Math.round(difficulty * 100) / 100,
    intervalDays,
    nextDueAt: nextDueAt.toISOString(),
    retrievability: r,
  };
}

/** Mastery 0-100 derived from stability: ~50 at 3 weeks of memory, ~92 at 2 months. */
export function masteryFromStability(stability: number) {
  return clamp(Math.round(100 * (1 - Math.exp(-stability / 25))), 0, 100);
}

export function stateFromMastery(mastery: number, grade: Grade) {
  if (grade === 1) return 'learning' as const;
  if (mastery >= 92) return 'mastered' as const;
  if (mastery >= 45) return 'review' as const;
  return 'learning' as const;
}

export function formatInterval(days: number) {
  if (days <= 0) return '10 min';
  if (days === 1) return '1 day';
  if (days < 30) return `${days} days`;
  if (days < 365) return `${Math.round(days / 30)} mo`;
  return `${Math.round((days / 365) * 10) / 10} yr`;
}

export function previewIntervals(state: MemoryState, now = new Date()): Record<Grade, string> {
  return {
    1: formatInterval(schedule(state, 1, now).intervalDays),
    2: formatInterval(schedule(state, 2, now).intervalDays),
    3: formatInterval(schedule(state, 3, now).intervalDays),
    4: formatInterval(schedule(state, 4, now).intervalDays),
  };
}

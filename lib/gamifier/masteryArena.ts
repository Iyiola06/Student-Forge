export type GameMode = 'quick_recall' | 'exam_sprint' | 'weak_spot_rescue';
export type ChallengeType = 'flash' | 'mcq' | 'gap' | 'recap' | 'boss';
export type GameSourceType =
    | 'flashcards'
    | 'quizzes'
    | 'resources'
    | 'past_questions'
    | 'ai_fallback';

export interface ChallengePayload {
    prompt: string;
    options: string[];
    answer: string;
    explanation: string;
    content?: string;
    sourceLabel?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
}

export interface RoundResult {
    correct: boolean;
    answer: string;
    elapsedMs: number;
    scoreDelta: number;
}

export interface GameRound {
    roundId: string;
    roundOrder: number;
    challengeType: ChallengeType;
    topic: string;
    subject: string;
    sourceType: GameSourceType;
    payload: ChallengePayload;
    result?: RoundResult | null;
    completedAt?: string | null;
}

export interface TopicMeta {
    topic: string;
    subject: string;
    sourceType: GameSourceType | string;
}

export interface GameSessionState {
    shields: number;
    streak: number;
    multiplier: number;
    focus: number;
    roundTimer: number;
    score: number;
    currentTopic: TopicMeta;
    correctAnswers: number;
    wrongAnswers: number;
    bossRoundsCleared: number;
    streakRestoreUsed?: boolean;
}

export interface GameSessionRecord {
    id: string;
    user_id: string;
    mode: GameMode;
    status: 'in_progress' | 'completed' | 'failed';
    topic: string;
    subject: string;
    source_type: GameSourceType | string;
    source_id: string | null;
    current_round: number;
    current_state: GameSessionState;
    score: number;
    best_streak: number;
    started_at: string;
    finished_at?: string | null;
    rounds: GameRound[];
}

export interface SessionSummary {
    totalXp: number;
    completionXp: number;
    streakBonusXp: number;
    accuracyBonusXp: number;
    weakSpotBonusXp: number;
    dailyBonusXp: number;
    totalScore: number;
    bestStreak: number;
    accuracy: number;
    masteryDelta: number;
    weakConcepts: string[];
    topic: string;
    subject: string;
    mode: GameMode;
    personalBest?: boolean;
}

export const modeLabels: Record<GameMode, { title: string; description: string; eyebrow: string }> = {
    quick_recall: {
        title: 'Quick Recall',
        description: 'Fast mixed recall from your flashcards, notes, and saved material.',
        eyebrow: 'Fastest mode',
    },
    exam_sprint: {
        title: 'Exam Sprint',
        description: 'Timed exam-style pressure built from quizzes, MCQs, and past-question context.',
        eyebrow: 'Score chase',
    },
    weak_spot_rescue: {
        title: 'Weak Spot Rescue',
        description: 'A focused recovery loop for recent misses and low-confidence topics.',
        eyebrow: 'Fix weak areas',
    },
};

export const modeConfig: Record<GameMode, { rounds: number; timer: number }> = {
    quick_recall: { rounds: 8, timer: 16 },
    exam_sprint: { rounds: 10, timer: 18 },
    weak_spot_rescue: { rounds: 6, timer: 20 },
};

export function slugifyTopic(topic: string) {
    return topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'general';
}

export function toTitleCase(value: string) {
    return value
        .split(/[\s_-]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
}

export function getTopicTheme(subject: string) {
    const lower = subject.toLowerCase();
    if (lower.includes('bio') || lower.includes('agric')) {
        return {
            gradient: 'from-emerald-500/25 via-lime-400/10 to-teal-500/15',
            accent: 'text-emerald-300',
            border: 'border-emerald-400/25',
            badge: 'bg-emerald-500/10 text-emerald-300',
            pulse: 'shadow-[0_0_45px_rgba(16,185,129,0.18)]',
        };
    }
    if (lower.includes('math') || lower.includes('physics') || lower.includes('chem')) {
        return {
            gradient: 'from-sky-500/25 via-cyan-400/10 to-blue-500/15',
            accent: 'text-sky-300',
            border: 'border-sky-400/25',
            badge: 'bg-sky-500/10 text-sky-300',
            pulse: 'shadow-[0_0_45px_rgba(14,165,233,0.18)]',
        };
    }
    if (lower.includes('history') || lower.includes('government') || lower.includes('civic')) {
        return {
            gradient: 'from-amber-500/20 via-orange-400/10 to-yellow-500/15',
            accent: 'text-amber-300',
            border: 'border-amber-400/25',
            badge: 'bg-amber-500/10 text-amber-300',
            pulse: 'shadow-[0_0_45px_rgba(245,158,11,0.18)]',
        };
    }
    if (lower.includes('english') || lower.includes('literature')) {
        return {
            gradient: 'from-rose-500/20 via-fuchsia-400/10 to-pink-500/15',
            accent: 'text-rose-200',
            border: 'border-rose-400/25',
            badge: 'bg-rose-500/10 text-rose-200',
            pulse: 'shadow-[0_0_45px_rgba(244,63,94,0.16)]',
        };
    }
    return {
        gradient: 'from-slate-500/25 via-zinc-300/10 to-indigo-500/15',
        accent: 'text-indigo-200',
        border: 'border-indigo-400/20',
        badge: 'bg-indigo-500/10 text-indigo-200',
        pulse: 'shadow-[0_0_45px_rgba(99,102,241,0.16)]',
    };
}

export function createInitialSessionState(topic: string, subject: string, sourceType: string, timer: number): GameSessionState {
    return {
        shields: 3,
        streak: 0,
        multiplier: 1,
        focus: 0,
        roundTimer: timer,
        score: 0,
        currentTopic: { topic, subject, sourceType },
        correctAnswers: 0,
        wrongAnswers: 0,
        bossRoundsCleared: 0,
        streakRestoreUsed: false,
    };
}

export function scoreRound(isCorrect: boolean, elapsedMs: number, state: GameSessionState, challengeType: ChallengeType) {
    if (!isCorrect) {
        const shouldRestoreShield = state.focus >= 80 && !state.streakRestoreUsed && state.shields < 3;
        return {
            scoreDelta: 0,
            nextState: {
                ...state,
                shields: Math.max(0, state.shields - 1 + (shouldRestoreShield ? 1 : 0)),
                streak: 0,
                multiplier: 1,
                focus: Math.max(0, state.focus - 20),
                wrongAnswers: state.wrongAnswers + 1,
                streakRestoreUsed: shouldRestoreShield ? true : state.streakRestoreUsed,
            },
            restoredShield: shouldRestoreShield,
        };
    }

    const fastBonus = elapsedMs < 5000 ? 25 : elapsedMs < 9000 ? 10 : 0;
    const bossBonus = challengeType === 'boss' ? 40 : 0;
    const scoreDelta = Math.round((100 + fastBonus + bossBonus) * state.multiplier);
    const nextStreak = state.streak + 1;
    const nextMultiplier = Math.min(4, 1 + Math.floor(nextStreak / 2) * 0.5);

    return {
        scoreDelta,
        nextState: {
            ...state,
            streak: nextStreak,
            multiplier: nextMultiplier,
            focus: Math.min(100, state.focus + 18),
            score: state.score + scoreDelta,
            correctAnswers: state.correctAnswers + 1,
            bossRoundsCleared: state.bossRoundsCleared + (challengeType === 'boss' ? 1 : 0),
        },
        restoredShield: false,
    };
}

export function calculateAccuracy(state: GameSessionState) {
    const total = state.correctAnswers + state.wrongAnswers;
    return total > 0 ? state.correctAnswers / total : 0;
}

export function calculateSessionXp(state: GameSessionState, mode: GameMode, isFirstToday: boolean) {
    const accuracy = calculateAccuracy(state);

    let xp = 40;
    xp += Math.floor(state.score / 60);
    xp += state.streak >= 5 ? 25 : 0;
    xp += accuracy >= 0.8 ? 20 : 0;
    xp += mode === 'weak_spot_rescue' && accuracy >= 0.7 ? 20 : 0;
    xp += isFirstToday ? 30 : 0;

    return {
        totalXp: xp,
        streakBonusXp: state.streak >= 5 ? 25 : 0,
        accuracyBonusXp: accuracy >= 0.8 ? 20 : 0,
        weakSpotBonusXp: mode === 'weak_spot_rescue' && accuracy >= 0.7 ? 20 : 0,
        dailyBonusXp: isFirstToday ? 30 : 0,
        completionXp: 40,
        accuracy,
    };
}

export function shuffleList<T>(items: T[]) {
    const next = [...items];
    for (let index = next.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    }
    return next;
}

export function dedupeStrings(values: string[]) {
    return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export function buildOptionSet(correctAnswer: string, distractors: string[], fallbackPrefix: string) {
    const cleanCorrect = correctAnswer.trim();
    const uniqueDistractors = dedupeStrings(distractors).filter((option) => option !== cleanCorrect);
    const pool = shuffleList(uniqueDistractors).slice(0, 3);

    while (pool.length < 3) {
        pool.push(`${fallbackPrefix} ${pool.length + 1}`);
    }

    return shuffleList([cleanCorrect, ...pool]);
}

export function extractStudySentences(content: string, limit = 8) {
    return content
        .replace(/\s+/g, ' ')
        .split(/(?<=[.!?])\s+/)
        .map((sentence) => sentence.trim())
        .filter((sentence) => sentence.length > 50)
        .slice(0, limit);
}

export function createQuestionFromSentence(sentence: string) {
    const words = sentence
        .replace(/[^a-zA-Z0-9\s-]/g, '')
        .split(/\s+/)
        .filter((word) => word.length > 4);

    if (!words.length) return null;

    const answer = words[Math.min(2, words.length - 1)];
    const prompt = sentence.replace(answer, '_____');
    return {
        prompt,
        answer,
        explanation: `The missing key term is "${answer}", taken directly from the study note.`,
    };
}

export function hydrateSessionRecord(session: any, rounds: any[]): GameSessionRecord {
    return {
        ...session,
        rounds: (rounds || []).map((round) => ({
            roundId: round.round_id,
            roundOrder: round.round_order,
            challengeType: round.challenge_type,
            topic: round.topic,
            subject: round.subject,
            sourceType: round.source_type,
            payload: round.payload,
            result: round.result,
            completedAt: round.completed_at,
        })),
    };
}

export function summarizeWeakConcepts(rounds: GameRound[]) {
    return rounds
        .filter((round) => round.result && !round.result.correct)
        .slice(0, 3)
        .map((round) => round.payload.prompt)
        .map((prompt) => prompt.length > 90 ? `${prompt.slice(0, 87)}...` : prompt);
}

export function calculateMasteryDelta(state: GameSessionState, mode: GameMode) {
    const accuracy = calculateAccuracy(state);
    const base = Math.round((accuracy - 0.5) * 24);
    const modeBonus = mode === 'weak_spot_rescue' ? 4 : mode === 'exam_sprint' ? 2 : 0;
    return Math.max(-8, Math.min(18, base + modeBonus + state.bossRoundsCleared * 2));
}

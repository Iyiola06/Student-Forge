'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import Icon3D, { type Icon3DName } from '@/components/ui/Icon3D';
import { modeVisuals } from '@/components/gamifier/GameLobby';
import {
    ChallengeType,
    GameSessionRecord,
    GameSessionState,
    modeLabels,
    scoreRound,
} from '@/lib/gamifier/masteryArena';

const challengeLabels: Record<ChallengeType, { label: string; icon: Icon3DName }> = {
    flash: { label: 'Flash recall', icon: 'bolt' },
    mcq: { label: 'Multiple choice', icon: 'thinking' },
    gap: { label: 'Fill the gap', icon: 'puzzle' },
    recap: { label: 'Recap', icon: 'memo' },
    boss: { label: 'Boss round', icon: 'crown' },
};

interface SessionPlayProps {
    session: GameSessionRecord;
    onPersist: (
        sessionId: string,
        currentRound: number,
        currentState: GameSessionState,
        score: number,
        bestStreak: number,
        roundResult?: any
    ) => Promise<void>;
    onComplete: (sessionId: string) => Promise<void>;
    onAbort: () => Promise<void>;
}

export default function SessionPlay({ session, onPersist, onComplete, onAbort }: SessionPlayProps) {
    const [state, setState] = useState<GameSessionState>(session.current_state);
    const [roundIndex, setRoundIndex] = useState(session.current_round || 0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState(session.current_state.roundTimer || 16);
    const [isSaving, setIsSaving] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);

    const rounds = session.rounds || [];
    const currentRound = useMemo(() => rounds[roundIndex] || rounds[rounds.length - 1], [roundIndex, rounds]);
    const bestStreak = Math.max(session.best_streak || 0, state.streak);

    useEffect(() => {
        if (!currentRound || selectedOption || isCompleting) return;
        setTimeLeft(state.roundTimer);
        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    void handleAnswer('__timeout__', state.roundTimer * 1000);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [currentRound?.roundId, selectedOption, isCompleting]);

    const progress = rounds.length > 0 ? Math.min(100, ((roundIndex + 1) / rounds.length) * 100) : 0;

    const persist = async (nextRound: number, nextState: GameSessionState, roundResult?: any) => {
        setIsSaving(true);
        try {
            await onPersist(session.id, nextRound, nextState, nextState.score, Math.max(bestStreak, nextState.streak), roundResult);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAnswer = async (option: string, elapsedOverride?: number) => {
        if (!currentRound || selectedOption) return;

        const elapsedMs = elapsedOverride ?? ((state.roundTimer - timeLeft) * 1000);
        const isCorrect = option === currentRound.payload.answer;
        const result = scoreRound(isCorrect, elapsedMs, state, currentRound.challengeType);

        setSelectedOption(option);

        const nextState: GameSessionState = {
            ...result.nextState,
            currentTopic: {
                topic: currentRound.topic,
                subject: currentRound.subject,
                sourceType: currentRound.sourceType,
            },
        };

        setState(nextState);
        setFeedback(
            result.restoredShield
                ? 'Shield saved by your focus meter. Keep the run alive.'
                : currentRound.payload.explanation
        );

        const nextRound = roundIndex + 1;
        await persist(nextRound, nextState, {
            roundOrder: currentRound.roundOrder,
            answer: option,
            elapsedMs,
            correct: isCorrect,
            scoreDelta: result.scoreDelta,
        });

        if (nextState.shields <= 0 || nextRound >= rounds.length) {
            setIsCompleting(true);
            try {
                await onComplete(session.id);
            } finally {
                setIsCompleting(false);
            }
            return;
        }

        setTimeout(() => {
            setRoundIndex(nextRound);
            setSelectedOption(null);
            setFeedback(null);
            setTimeLeft(nextState.roundTimer);
        }, 900);
    };

    const saveAndExit = async () => {
        await persist(roundIndex, state);
        await onAbort();
    };

    if (!currentRound) return null;

    const challenge = challengeLabels[currentRound.challengeType] || { label: currentRound.challengeType, icon: 'bolt' as Icon3DName };
    const maxShields = Math.max(3, state.shields);
    const answeredCorrectly = selectedOption !== null && selectedOption === currentRound.payload.answer;
    const timedOut = selectedOption === '__timeout__';
    const isLowTime = timeLeft <= 5;

    const shieldRow = (
        <div className="flex items-center gap-0.5" aria-label={`${state.shields} shields left`}>
            {Array.from({ length: maxShields }).map((_, i) => (
                <Icon3D
                    key={i}
                    name="heart"
                    size={22}
                    className={i < state.shields ? 'transition' : 'opacity-25 grayscale transition'}
                />
            ))}
        </div>
    );

    return (
        <div className="main-bg">
            <div className="review-focus-shell">
                <div className="review-focus-frame">
                    <header className="review-topbar">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="flex min-w-0 items-center gap-3">
                                <span className={`icon-tile size-14 ${modeVisuals[session.mode].tone}`}>
                                    <Icon3D name={modeVisuals[session.mode].icon} size={38} />
                                </span>
                                <div className="min-w-0">
                                    <p className="eyebrow">{modeLabels[session.mode].title} · {currentRound.subject}</p>
                                    <h1 className="mt-0.5 line-clamp-2 font-display text-[20px] font-semibold leading-tight tracking-[-0.02em] text-[var(--text-strong)] sm:text-[24px]">
                                        {currentRound.topic}
                                    </h1>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <span className="app-toolbar-chip !py-1.5">{shieldRow}</span>
                                <span className="app-toolbar-chip">
                                    <Icon3D name="gem" size={18} />
                                    <span className="font-display text-sm font-semibold text-[var(--text-strong)]">{state.score}</span>
                                </span>
                                <span className="app-toolbar-chip">
                                    <Icon3D name="fire" size={18} />
                                    <span className="font-display text-sm font-semibold text-[var(--text-strong)]">{state.streak}</span>
                                </span>
                                <button onClick={() => void saveAndExit()} className="secondary-button !h-9 !px-4">
                                    Save and exit
                                </button>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between gap-3 text-[12.5px] text-[var(--text-soft)]">
                                <span>Round {roundIndex + 1} of {rounds.length}</span>
                                <span>{isSaving ? 'Saving...' : `${Math.round(progress)}% through`}</span>
                            </div>
                            <div className="mt-2 review-progress-track">
                                <div className="review-progress-fill" style={{ '--value': progress } as CSSProperties} />
                            </div>
                        </div>
                    </header>

                    <div className="review-focus-layout">
                        <main className="review-stage !min-h-0 gap-6">
                            <div className="flex flex-col gap-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <span className="pill-tag">
                                            <Icon3D name={challenge.icon} size={16} />
                                            {challenge.label}
                                        </span>
                                        <p className="mt-3 text-[12.5px] text-[var(--text-soft)]">
                                            Source: {currentRound.payload.sourceLabel || currentRound.sourceType}
                                        </p>
                                    </div>

                                    <div
                                        className={`flex shrink-0 items-center gap-2 rounded-[22px] border px-3 py-2 shadow-[var(--shadow-sm)] transition sm:px-4 ${isLowTime ? 'border-[var(--danger)] bg-[var(--danger-soft)]' : 'border-[var(--line)] bg-[var(--card)]'}`}
                                        aria-label={`${timeLeft} seconds left`}
                                    >
                                        <Icon3D name="stopwatch" size={30} className={isLowTime ? 'animate-pulse' : undefined} />
                                        <span className={`font-display text-[32px] font-semibold leading-none tabular-nums sm:text-[40px] ${isLowTime ? 'text-[var(--danger)]' : 'text-[var(--text-strong)]'}`}>
                                            {timeLeft}
                                        </span>
                                    </div>
                                </div>

                                <h2 className="font-display text-[22px] font-semibold leading-snug tracking-[-0.02em] text-[var(--text-strong)] break-words sm:text-[30px]">
                                    {currentRound.payload.prompt}
                                </h2>

                                {currentRound.payload.content && (
                                    <div className="rounded-[22px] border border-[var(--line)] bg-[var(--card-2)] p-4 text-sm leading-7 text-[var(--text-body)] break-words sm:p-5">
                                        {currentRound.payload.content}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                    {currentRound.payload.options.map((option, index) => {
                                        const isPicked = selectedOption === option;
                                        const isCorrect = option === currentRound.payload.answer;
                                        const stateClass = selectedOption
                                            ? isCorrect
                                                ? 'border-[var(--success)] bg-[var(--success-soft)]'
                                                : isPicked
                                                    ? 'border-[var(--danger)] bg-[var(--danger-soft)]'
                                                    : 'border-[var(--line)] bg-[var(--card)] opacity-55'
                                            : 'border-[var(--line)] bg-[var(--card)] shadow-[var(--shadow-sm)] hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-[var(--shadow-md)]';
                                        const badgeClass = selectedOption && isCorrect
                                            ? 'bg-[var(--success)] text-[var(--action-ink)]'
                                            : selectedOption && isPicked
                                                ? 'bg-[var(--danger)] text-[var(--action-ink)]'
                                                : 'bg-[var(--accent-soft)] text-[var(--accent-strong)]';

                                        return (
                                            <button
                                                key={option}
                                                disabled={selectedOption !== null}
                                                onClick={() => void handleAnswer(option)}
                                                className={`flex min-w-0 items-start gap-3 rounded-[22px] border px-4 py-4 text-left transition ${stateClass}`}
                                            >
                                                <span className={`inline-flex size-8 shrink-0 items-center justify-center rounded-full font-display text-sm font-semibold ${badgeClass}`}>
                                                    {String.fromCharCode(65 + index)}
                                                </span>
                                                <span className="min-w-0 flex-1 pt-1 text-[15px] font-medium leading-6 text-[var(--text-strong)] break-words">{option}</span>
                                                {selectedOption && isCorrect ? <Icon3D name="check" size={24} className="shrink-0" /> : null}
                                            </button>
                                        );
                                    })}
                                </div>

                                {feedback && (
                                    <div className={`flex items-start gap-3 rounded-[22px] p-4 sm:p-5 ${answeredCorrectly ? 'bg-[var(--success-soft)]' : 'bg-[var(--warning-soft)]'}`}>
                                        <Icon3D name={answeredCorrectly ? 'party' : timedOut ? 'hourglass' : 'bulb'} size={36} className="shrink-0" />
                                        <div className="min-w-0">
                                            <p className="font-display text-[15px] font-semibold text-[var(--text-strong)]">
                                                {answeredCorrectly ? 'Nice one!' : timedOut ? 'Time is up' : 'Not quite'}
                                            </p>
                                            <p className="mt-1 text-sm leading-6 text-[var(--text-body)] break-words">{feedback}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <span className="metric-chip">
                                    <Icon3D name="check" size={16} />
                                    Correct: {state.correctAnswers}
                                </span>
                                <span className="metric-chip">
                                    <Icon3D name="thinking" size={16} />
                                    Misses: {state.wrongAnswers}
                                </span>
                                <span className="metric-chip">
                                    <Icon3D name="fire" size={16} />
                                    Best streak: {bestStreak}
                                </span>
                            </div>
                        </main>

                        <aside className="space-y-5">
                            <section className="glass-panel app-panel-tight">
                                <p className="eyebrow">Your run</p>
                                <div className="mt-3 grid grid-cols-2 gap-3">
                                    {[
                                        { label: 'Score', value: state.score, icon: 'gem' as const, tone: 'pastel-sky' },
                                        { label: 'Streak', value: state.streak, icon: 'fire' as const, tone: 'pastel-peach' },
                                        { label: 'Multiplier', value: `x${state.multiplier}`, icon: 'bolt' as const, tone: 'pastel-butter' },
                                        { label: 'Shields', value: state.shields, icon: 'heart' as const, tone: 'pastel-blush' },
                                    ].map((stat) => (
                                        <div key={stat.label} className={`relative min-w-0 overflow-hidden rounded-[20px] border border-[var(--line)] p-3 ${stat.tone}`}>
                                            <Icon3D name={stat.icon} size={28} className="absolute top-2.5 right-2.5" />
                                            <p className="text-[12px] text-[var(--text-soft)]">{stat.label}</p>
                                            <p className="mt-3 truncate font-display text-[24px] font-semibold leading-none text-[var(--text-strong)]">{stat.value}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4 rounded-[20px] border border-[var(--line)] bg-[var(--card-2)] p-3">
                                    <div className="flex items-center justify-between gap-3 text-[12.5px]">
                                        <span className="inline-flex items-center gap-1.5 font-medium text-[var(--text-strong)]">
                                            <Icon3D name="brain" size={18} />
                                            Focus meter
                                        </span>
                                        <span className="text-[var(--text-soft)]">{state.focus}%</span>
                                    </div>
                                    <div className="mt-2 dashboard-progress-track">
                                        <div className="dashboard-progress-fill" data-tone="success" style={{ '--value': state.focus } as CSSProperties} />
                                    </div>
                                    <p className="mt-2 text-[12px] leading-5 text-[var(--text-soft)]">High focus can save one shield once per run.</p>
                                </div>
                            </section>
                        </aside>
                    </div>
                </div>
            </div>
        </div>
    );
}

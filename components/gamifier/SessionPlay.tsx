'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    GameSessionRecord,
    GameSessionState,
    getTopicTheme,
    modeLabels,
    scoreRound,
} from '@/lib/gamifier/masteryArena';

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
    const theme = getTopicTheme(currentRound?.subject || session.subject);
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

    return (
        <div className="relative min-h-[100dvh] overflow-hidden bg-[#0a0c12] text-white">
            <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient}`} />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_28%),linear-gradient(180deg,rgba(10,12,18,0.05),rgba(10,12,18,0.96))]" />

            <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
                <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
                    <aside className={`h-fit rounded-[2rem] border ${theme.border} bg-[#11141d]/78 p-6 backdrop-blur-xl xl:sticky xl:top-6`}>
                        <div className="mb-3 text-xs font-black uppercase tracking-[0.35em] text-slate-300">{modeLabels[session.mode].title}</div>
                        <h1 className="text-3xl font-black leading-tight">{currentRound.topic}</h1>
                        <p className="mt-2 text-sm text-slate-400">{currentRound.subject}</p>

                        <div className="mt-6 space-y-4">
                            <div>
                                <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-widest text-slate-500">
                                    <span>Progress</span>
                                    <span>{roundIndex + 1}/{rounds.length}</span>
                                </div>
                                <div className="h-3 overflow-hidden rounded-full bg-white/5">
                                    <div className="h-full rounded-full bg-gradient-to-r from-[#f97316] to-[#fb7185]" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                    <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Score</div>
                                    <div className="mt-2 text-2xl font-black text-orange-300">{state.score}</div>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                    <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Streak</div>
                                    <div className={`mt-2 text-2xl font-black ${state.streak >= 3 ? theme.accent : 'text-white'}`}>{state.streak}</div>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                    <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Multiplier</div>
                                    <div className="mt-2 text-2xl font-black text-sky-300">x{state.multiplier}</div>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                    <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Shields</div>
                                    <div className="mt-2 text-2xl font-black text-emerald-300">{state.shields}</div>
                                </div>
                            </div>
                            <div>
                                <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-widest text-slate-500">
                                    <span>Focus</span>
                                    <span>{state.focus}%</span>
                                </div>
                                <div className="h-3 overflow-hidden rounded-full bg-white/5">
                                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-lime-400" style={{ width: `${state.focus}%` }} />
                                </div>
                                <p className="mt-2 text-xs text-slate-500">High focus can save one shield once per run.</p>
                            </div>
                        </div>

                        <button
                            onClick={() => void saveAndExit()}
                            className="mt-6 w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 font-bold text-slate-200 transition hover:bg-white/10"
                        >
                            Save And Exit
                        </button>
                        {isSaving && <div className="mt-3 text-xs text-slate-500">Saving session...</div>}
                    </aside>

                    <main className="rounded-[2rem] border border-white/10 bg-[#11141d]/78 p-6 backdrop-blur-xl sm:p-8">
                        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <div className={`mb-2 inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] ${theme.badge}`}>
                                    {currentRound.challengeType}
                                </div>
                                <h2 className="text-3xl font-black leading-tight sm:text-4xl">{currentRound.payload.prompt}</h2>
                                <p className="mt-3 text-sm text-slate-400">
                                    Topic: {currentRound.topic} • Source: {currentRound.payload.sourceLabel || currentRound.sourceType}
                                </p>
                            </div>

                            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-5 py-4 text-center">
                                <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Timer</div>
                                <div className={`mt-1 text-5xl font-black ${timeLeft <= 5 ? 'text-rose-300' : theme.accent}`}>{timeLeft}</div>
                            </div>
                        </div>

                        {currentRound.payload.content && (
                            <div className="mb-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-sm leading-relaxed text-slate-300">
                                {currentRound.payload.content}
                            </div>
                        )}

                        <div className="grid gap-4 md:grid-cols-2">
                            {currentRound.payload.options.map((option) => {
                                const isPicked = selectedOption === option;
                                const isCorrect = option === currentRound.payload.answer;
                                const stateClass = selectedOption
                                    ? isCorrect
                                        ? 'border-emerald-400 bg-emerald-500/10'
                                        : isPicked
                                            ? 'border-rose-400 bg-rose-500/10'
                                            : 'border-white/10 bg-white/5 opacity-60'
                                    : 'border-white/10 bg-white/5 hover:border-white/30 hover:-translate-y-0.5';

                                return (
                                    <button
                                        key={option}
                                        disabled={selectedOption !== null}
                                        onClick={() => void handleAnswer(option)}
                                        className={`rounded-[1.35rem] border px-5 py-5 text-left transition ${stateClass}`}
                                    >
                                        <div className="text-base font-bold leading-relaxed">{option}</div>
                                    </button>
                                );
                            })}
                        </div>

                        {feedback && (
                            <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-slate-300">
                                {feedback}
                            </div>
                        )}

                        <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-slate-400">
                            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">Correct: {state.correctAnswers}</span>
                            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">Misses: {state.wrongAnswers}</span>
                            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">Best streak: {bestStreak}</span>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}

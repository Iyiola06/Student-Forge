'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    AdventureNode,
    AdventureRunRecord,
    AdventureRunState,
    BattleQuestion,
    RewardId,
    StoryChoiceOption,
    applyRewardToState,
    awardNodeXp,
    getNextNodeLabel,
    missionXpConfig,
    rewardCatalog,
} from '@/lib/gamifier/adventure';

interface AdventureRunProps {
    run: AdventureRunRecord;
    onPersist: (runId: string, currentNodeId: string, currentState: AdventureRunState, completedNodeId?: string) => Promise<void>;
    onComplete: (runId: string) => Promise<void>;
    onAbort: () => Promise<void>;
}

function calcDamage(base: number, timeRemaining: number, state: AdventureRunState) {
    let damage = base;
    let energyGain = 1;
    let consumedFocus = false;

    if (timeRemaining >= 8) {
        damage += 15;
        energyGain += 1;
    }
    if (state.activeEffects.focusBonusCharges > 0) {
        damage += 20;
        consumedFocus = true;
    }
    if (state.combo >= 2) {
        damage += 10;
    }

    return { damage, energyGain, consumedFocus };
}

export default function AdventureRun({ run, onPersist, onComplete, onAbort }: AdventureRunProps) {
    const [state, setState] = useState<AdventureRunState>(run.current_state);
    const [workingNodeId, setWorkingNodeId] = useState(run.current_state.currentNodeId);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [battleHealth, setBattleHealth] = useState<number | null>(null);
    const [battleQuestionIndex, setBattleQuestionIndex] = useState(0);
    const [revealedWrongOptions, setRevealedWrongOptions] = useState<string[]>([]);
    const [timeLeft, setTimeLeft] = useState(25);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [battleResult, setBattleResult] = useState<'won' | 'lost' | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);

    const currentNode = useMemo(
        () => run.nodes.find((node) => node.id === workingNodeId) || run.nodes[0],
        [run.nodes, workingNodeId]
    );

    const currentQuestion: BattleQuestion | null = useMemo(() => {
        if (!currentNode) return null;
        if (currentNode.nodeType === 'battle') return currentNode.payload.question as BattleQuestion;
        if (currentNode.nodeType === 'boss') return (currentNode.payload.questions as BattleQuestion[])[battleQuestionIndex] || null;
        return null;
    }, [battleQuestionIndex, currentNode]);

    useEffect(() => {
        if (currentNode.nodeType === 'battle' || currentNode.nodeType === 'boss') {
            setBattleHealth(currentNode.payload.enemyHealth as number);
            setTimeLeft(currentNode.payload.timerSeconds as number);
            setSelectedOption(null);
            setRevealedWrongOptions([]);
            setFeedback(null);
            setBattleResult(null);
            setBattleQuestionIndex(0);
        }
    }, [currentNode.id, currentNode.nodeType, currentNode.payload.enemyHealth, currentNode.payload.timerSeconds]);

    useEffect(() => {
        if (!(currentNode.nodeType === 'battle' || currentNode.nodeType === 'boss')) return;
        if (selectedOption || battleResult) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    void handleAnswer('__timeout__');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [currentNode.nodeType, selectedOption, battleResult]);

    const persistState = async (nextNodeId: string, nextState: AdventureRunState, completedNodeId?: string) => {
        setIsSaving(true);
        try {
            await onPersist(run.id, nextNodeId, nextState, completedNodeId);
        } finally {
            setIsSaving(false);
        }
    };

    const moveToNode = async (nextNodeId: string, nextState: AdventureRunState, completedNodeId?: string) => {
        setState(nextState);
        setWorkingNodeId(nextNodeId);
        await persistState(nextNodeId, nextState, completedNodeId);
    };

    const grantBaseNodeXp = async (completedNode: AdventureNode, nextNodeId: string, nextState: AdventureRunState) => {
        const xpResult = awardNodeXp(nextState, missionXpConfig.nodeCompletion);
        const boostedState: AdventureRunState = {
            ...nextState,
            xpBank: nextState.xpBank + xpResult.xpAwarded,
            nodeXp: nextState.nodeXp + xpResult.xpAwarded,
            activeEffects: {
                ...nextState.activeEffects,
                doubleXpCharges: xpResult.consumedDoubleXp
                    ? Math.max(0, nextState.activeEffects.doubleXpCharges - 1)
                    : nextState.activeEffects.doubleXpCharges,
            },
        };
        await moveToNode(nextNodeId, boostedState, completedNode.id);
    };

    const continueLinearNode = async () => {
        if (!currentNode.nextNodeId) {
            setIsCompleting(true);
            try {
                await onComplete(run.id);
            } finally {
                setIsCompleting(false);
            }
            return;
        }

        let nextState = {
            ...state,
            completedNodeIds: state.completedNodeIds.includes(currentNode.id)
                ? state.completedNodeIds
                : [...state.completedNodeIds, currentNode.id],
            currentNodeId: currentNode.nextNodeId,
        };

        if (currentNode.nodeType === 'mentor') {
            nextState = { ...nextState, energy: Math.min(5, nextState.energy + 2) };
        }
        if (currentNode.nodeType === 'recap') {
            nextState = { ...nextState, shields: Math.min(100, nextState.shields + 20) };
        }

        await grantBaseNodeXp(currentNode, currentNode.nextNodeId, nextState);
    };

    const chooseReward = async (rewardId: RewardId) => {
        if (!currentNode.nextNodeId) return;
        const rewarded = applyRewardToState(state, rewardId);
        const nextState = {
            ...rewarded,
            completedNodeIds: rewarded.completedNodeIds.includes(currentNode.id)
                ? rewarded.completedNodeIds
                : [...rewarded.completedNodeIds, currentNode.id],
            currentNodeId: currentNode.nextNodeId,
        };
        await grantBaseNodeXp(currentNode, currentNode.nextNodeId, nextState);
    };

    const chooseBranch = async (option: StoryChoiceOption) => {
        const rewarded = option.reward ? applyRewardToState(state, option.reward) : state;
        const nextState = {
            ...rewarded,
            selectedBranch: option.id,
            currentNodeId: option.nextNodeId,
            completedNodeIds: rewarded.completedNodeIds.includes(currentNode.id)
                ? rewarded.completedNodeIds
                : [...rewarded.completedNodeIds, currentNode.id],
            objective: option.id === 'mentor_route'
                ? 'Use the mentor route bonus to win the elite encounter.'
                : 'Use the recovery route to survive the elite encounter.',
            shields: Math.min(100, rewarded.shields + (option.heal || 0)),
        };
        await grantBaseNodeXp(currentNode, option.nextNodeId, nextState);
    };

    const useAbility = (ability: 'scan' | 'guard' | 'finisher') => {
        if (!currentQuestion) return;
        if (state.energy <= 0 && ability !== 'guard') return;

        if (ability === 'scan' && state.energy >= 1) {
            const hiddenWrong = currentQuestion.options.find(
                (option) => option !== currentQuestion.answer && !revealedWrongOptions.includes(option)
            );
            if (!hiddenWrong) return;
            setState((prev) => ({
                ...prev,
                energy: prev.energy - 1,
                usedAbilities: prev.usedAbilities + 1,
            }));
            setRevealedWrongOptions((prev) => [...prev, hiddenWrong]);
        }

        if (ability === 'guard' && state.energy >= 1) {
            setState((prev) => ({
                ...prev,
                energy: prev.energy - 1,
                usedAbilities: prev.usedAbilities + 1,
                activeEffects: {
                    ...prev.activeEffects,
                    guardActive: true,
                },
            }));
        }

        if (ability === 'finisher' && state.energy >= 2) {
            setState((prev) => ({
                ...prev,
                energy: prev.energy - 2,
                usedAbilities: prev.usedAbilities + 1,
                combo: prev.combo + 1,
            }));
            setFeedback('Finisher primed: your next correct strike hits harder.');
        }
    };

    const handleFailure = async (nextState: AdventureRunState) => {
        if (nextState.health <= 0 && nextState.activeEffects.secondChance) {
            const revived = {
                ...nextState,
                health: 60,
                shields: 25,
                activeEffects: {
                    ...nextState.activeEffects,
                    secondChance: false,
                },
            };
            setFeedback('Phoenix Core activated. You were revived for one last push.');
            setState(revived);
            setSelectedOption(null);
            setBattleResult(null);
            return;
        }

        setBattleResult('lost');
        await persistState(currentNode.id, nextState);
    };

    const handleAnswer = async (option: string) => {
        if (!currentQuestion || selectedOption || battleResult) return;
        setSelectedOption(option);

        const isCorrect = option === currentQuestion.answer;
        let nextState = {
            ...state,
            correctAnswers: state.correctAnswers + (isCorrect ? 1 : 0),
            wrongAnswers: state.wrongAnswers + (isCorrect ? 0 : 1),
        };

        if (isCorrect) {
            const { damage, energyGain, consumedFocus } = calcDamage(45, timeLeft, state);
            const updatedHealth = Math.max(0, (battleHealth || 100) - damage);
            const bonusXp = awardNodeXp(nextState, missionXpConfig.battleWin);
            nextState = {
                ...nextState,
                combo: nextState.combo + 1,
                streak: nextState.streak + 1,
                maxStreak: Math.max(nextState.maxStreak, nextState.streak + 1),
                energy: Math.min(5, nextState.energy + energyGain),
                xpBank: nextState.xpBank + bonusXp.xpAwarded,
                nodeXp: nextState.nodeXp + bonusXp.xpAwarded,
                activeEffects: {
                    ...nextState.activeEffects,
                    doubleXpCharges: bonusXp.consumedDoubleXp ? Math.max(0, nextState.activeEffects.doubleXpCharges - 1) : nextState.activeEffects.doubleXpCharges,
                    focusBonusCharges: consumedFocus ? Math.max(0, nextState.activeEffects.focusBonusCharges - 1) : nextState.activeEffects.focusBonusCharges,
                },
            };

            setBattleHealth(updatedHealth);
            setFeedback(currentQuestion.explanation);

            const questionCount = currentNode.nodeType === 'boss'
                ? (currentNode.payload.questions as BattleQuestion[]).length
                : 1;
            const finishedQuestionSet = currentNode.nodeType === 'battle' || battleQuestionIndex >= questionCount - 1;
            const finishedEncounter = updatedHealth <= 0 || finishedQuestionSet;

            if (currentNode.nodeType === 'boss' && !finishedEncounter) {
                setTimeout(() => {
                    setBattleQuestionIndex((prev) => prev + 1);
                    setSelectedOption(null);
                    setRevealedWrongOptions([]);
                    setTimeLeft(currentNode.payload.timerSeconds as number);
                    setFeedback(null);
                }, 1400);
                setState(nextState);
                return;
            }

            if (finishedEncounter) {
                const completedState = {
                    ...nextState,
                    battlesWon: nextState.battlesWon + 1,
                    completedNodeIds: nextState.completedNodeIds.includes(currentNode.id)
                        ? nextState.completedNodeIds
                        : [...nextState.completedNodeIds, currentNode.id],
                };
                setState(completedState);
                setBattleResult('won');
                await persistState(currentNode.id, completedState, currentNode.id);
                return;
            }
        } else {
            const incomingDamage = state.activeEffects.guardActive ? 10 : 25;
            const shieldsAbsorbed = Math.min(nextState.shields, incomingDamage);
            const healthDamage = Math.max(0, incomingDamage - shieldsAbsorbed);
            nextState = {
                ...nextState,
                combo: 0,
                streak: 0,
                shields: Math.max(0, nextState.shields - incomingDamage),
                health: Math.max(0, nextState.health - healthDamage),
                activeEffects: {
                    ...nextState.activeEffects,
                    guardActive: false,
                },
            };
            setFeedback(currentQuestion.explanation);
            setState(nextState);
            if (nextState.health <= 0) {
                await handleFailure(nextState);
                return;
            }

            const questionCount = currentNode.nodeType === 'boss'
                ? (currentNode.payload.questions as BattleQuestion[]).length
                : 1;
            const lastQuestion = currentNode.nodeType === 'battle' || battleQuestionIndex >= questionCount - 1;

            if (currentNode.nodeType === 'boss' && !lastQuestion) {
                setTimeout(() => {
                    setBattleQuestionIndex((prev) => prev + 1);
                    setSelectedOption(null);
                    setRevealedWrongOptions([]);
                    setTimeLeft(currentNode.payload.timerSeconds as number);
                    setFeedback(null);
                }, 1400);
                return;
            }

            const completedState = {
                ...nextState,
                battlesWon: nextState.battlesWon + 1,
                completedNodeIds: nextState.completedNodeIds.includes(currentNode.id)
                    ? nextState.completedNodeIds
                    : [...nextState.completedNodeIds, currentNode.id],
            };
            setState(completedState);
            setBattleResult('won');
            await persistState(currentNode.id, completedState, currentNode.id);
        }
    };

    const continueAfterBattle = async () => {
        if (!currentNode.nextNodeId) {
            setIsCompleting(true);
            try {
                await onComplete(run.id);
            } finally {
                setIsCompleting(false);
            }
            return;
        }

        const nextState = {
            ...state,
            currentNodeId: currentNode.nextNodeId,
        };
        await moveToNode(currentNode.nextNodeId, nextState);
    };

    const saveAndExit = async () => {
        await persistState(currentNode.id, state);
        await onAbort();
    };

    if (battleResult === 'lost') {
        return (
            <div className="min-h-[100dvh] bg-[#050510] text-white flex items-center justify-center p-6">
                <div className="max-w-lg w-full rounded-[2rem] border border-red-500/20 bg-[#101022] p-8 text-center">
                    <div className="text-red-400 text-xs font-black uppercase tracking-[0.4em] mb-4">Mission Failed</div>
                    <h2 className="text-4xl font-black mb-4">The Examiner Broke Your Line</h2>
                    <p className="text-slate-400 mb-8 leading-relaxed">
                        Your run has stalled, but your progress is saved. You can return to the hub and launch a fresh mission whenever you are ready.
                    </p>
                    <button
                        onClick={() => void onAbort()}
                        className="w-full rounded-2xl bg-[#ea580c] hover:bg-[#c2410c] text-white font-black px-5 py-4 transition-colors"
                    >
                        Return To Mission Hub
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[100dvh] bg-[#050510] text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
                <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6">
                    <aside className="bg-[#101022]/85 backdrop-blur-xl border border-[#2d2d3f] rounded-[2rem] p-6 h-fit xl:sticky xl:top-6">
                        <div className="text-xs font-black uppercase tracking-[0.35em] text-cyan-400 mb-3">Mission Control</div>
                        <h2 className="text-3xl font-black leading-tight mb-2">{state.missionTitle}</h2>
                        <p className="text-sm text-slate-400 mb-6">{state.objective}</p>

                        <div className="space-y-4 mb-6">
                            <div>
                                <div className="flex items-center justify-between text-xs uppercase tracking-widest text-slate-500 mb-2">
                                    <span>Health</span>
                                    <span>{state.health}%</span>
                                </div>
                                <div className="h-3 rounded-full bg-[#1c1c2f] overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-red-500 to-orange-500" style={{ width: `${state.health}%` }} />
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between text-xs uppercase tracking-widest text-slate-500 mb-2">
                                    <span>Shields</span>
                                    <span>{state.shields}%</span>
                                </div>
                                <div className="h-3 rounded-full bg-[#1c1c2f] overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500" style={{ width: `${state.shields}%` }} />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-6">
                            <div className="rounded-2xl bg-[#161625] border border-[#2d2d3f] p-3 text-center">
                                <div className="text-xl font-black text-[#ea580c]">{state.energy}</div>
                                <div className="text-[10px] uppercase tracking-widest text-slate-500">Energy</div>
                            </div>
                            <div className="rounded-2xl bg-[#161625] border border-[#2d2d3f] p-3 text-center">
                                <div className="text-xl font-black text-cyan-400">{state.maxStreak}</div>
                                <div className="text-[10px] uppercase tracking-widest text-slate-500">Best Streak</div>
                            </div>
                            <div className="rounded-2xl bg-[#161625] border border-[#2d2d3f] p-3 text-center">
                                <div className="text-xl font-black text-violet-400">{state.xpBank}</div>
                                <div className="text-[10px] uppercase tracking-widest text-slate-500">Run XP</div>
                            </div>
                        </div>

                        <div className="rounded-2xl bg-[#161625] border border-[#2d2d3f] p-4 mb-6">
                            <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-2">Next Potential</div>
                            <div className="text-sm font-bold">{getNextNodeLabel(run.nodes, currentNode.id)}</div>
                        </div>

                        <div className="rounded-2xl bg-[#161625] border border-[#2d2d3f] p-4 mb-6">
                            <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-3">Unlocked Rewards</div>
                            <div className="flex flex-wrap gap-2">
                                {state.unlockedRewards.length > 0 ? state.unlockedRewards.map((rewardId) => (
                                    <span key={rewardId} className="px-3 py-1 rounded-full bg-[#ea580c]/10 border border-[#ea580c]/20 text-xs font-bold text-[#ea580c]">
                                        {rewardCatalog[rewardId].title}
                                    </span>
                                )) : (
                                    <span className="text-sm text-slate-500">No artifacts chosen yet.</span>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={() => void saveAndExit()}
                            className="w-full rounded-2xl border border-[#2d2d3f] bg-[#161625] hover:bg-[#1d1d31] text-slate-300 font-bold px-5 py-4 transition-colors"
                        >
                            Save And Exit
                        </button>
                        {isSaving && <div className="text-xs text-slate-500 mt-3">Saving mission state...</div>}
                    </aside>

                    <main className="bg-[#101022]/85 backdrop-blur-xl border border-[#2d2d3f] rounded-[2rem] p-6 sm:p-8 min-h-[70vh]">
                        <div className="flex items-start justify-between gap-4 mb-6">
                            <div>
                                <div className="text-xs font-black uppercase tracking-[0.35em] text-cyan-400 mb-2">{currentNode.nodeType}</div>
                                <h1 className="text-3xl sm:text-4xl font-black leading-tight">{currentNode.title}</h1>
                                {currentNode.subtitle && <p className="text-slate-400 mt-2">{currentNode.subtitle}</p>}
                            </div>
                            <div className="rounded-2xl bg-[#161625] border border-[#2d2d3f] px-4 py-3 text-right">
                                <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-1">Progress</div>
                                <div className="text-lg font-black">{state.completedNodeIds.length}/{run.nodes.length}</div>
                            </div>
                        </div>

                        {(currentNode.nodeType === 'lore' || currentNode.nodeType === 'mentor') && (
                            <div className="max-w-3xl">
                                <div className="rounded-[1.75rem] bg-[linear-gradient(145deg,#15152a,#0f0f19)] border border-[#2d2d3f] p-6 sm:p-8 mb-6">
                                    <p className="text-lg leading-relaxed text-slate-200">{currentNode.payload.body}</p>
                                    {currentNode.payload.bonusText && (
                                        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-sm font-bold text-emerald-400">
                                            <span className="material-symbols-outlined text-base">bolt</span>
                                            {currentNode.payload.bonusText}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => void continueLinearNode()}
                                    className="rounded-2xl bg-[#ea580c] hover:bg-[#c2410c] text-white font-black px-6 py-4 transition-colors"
                                >
                                    Continue Mission
                                </button>
                            </div>
                        )}

                        {currentNode.nodeType === 'recap' && (
                            <div className="max-w-3xl">
                                <div className="grid grid-cols-1 gap-4 mb-6">
                                    {(currentNode.payload.facts as string[]).map((fact, index) => (
                                        <div key={index} className="rounded-[1.5rem] bg-[linear-gradient(145deg,#15152a,#0f0f19)] border border-[#2d2d3f] p-5">
                                            <div className="text-[10px] uppercase tracking-[0.3em] text-cyan-400 mb-2">Key Fact {index + 1}</div>
                                            <p className="text-slate-200 leading-relaxed">{fact}</p>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={() => void continueLinearNode()}
                                    className="rounded-2xl bg-[#ea580c] hover:bg-[#c2410c] text-white font-black px-6 py-4 transition-colors"
                                >
                                    Bank These Notes
                                </button>
                            </div>
                        )}

                        {currentNode.nodeType === 'reward' && (
                            <div className="max-w-4xl">
                                <p className="text-slate-300 text-lg leading-relaxed mb-6">{currentNode.payload.body}</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {(currentNode.reward || []).map((reward) => (
                                        <button
                                            key={reward.id}
                                            onClick={() => void chooseReward(reward.id)}
                                            className="text-left rounded-[1.5rem] bg-[linear-gradient(145deg,#15152a,#0f0f19)] border border-[#2d2d3f] p-5 hover:border-[#ea580c]/40 hover:-translate-y-1 transition-all"
                                        >
                                            <div className="text-lg font-black mb-2">{reward.title}</div>
                                            <p className="text-sm text-slate-400 leading-relaxed">{reward.description}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {currentNode.nodeType === 'choice' && (
                            <div className="max-w-4xl">
                                <p className="text-slate-300 text-lg leading-relaxed mb-6">{currentNode.payload.prompt}</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {(currentNode.payload.options as StoryChoiceOption[]).map((option) => (
                                        <button
                                            key={option.id}
                                            onClick={() => void chooseBranch(option)}
                                            className="text-left rounded-[1.75rem] bg-[linear-gradient(145deg,#15152a,#0f0f19)] border border-[#2d2d3f] p-6 hover:border-cyan-400/40 hover:-translate-y-1 transition-all"
                                        >
                                            <div className="text-2xl font-black mb-2">{option.title}</div>
                                            <p className="text-slate-400 leading-relaxed mb-4">{option.description}</p>
                                            <div className="text-xs font-black uppercase tracking-[0.3em] text-cyan-400">
                                                {option.id === 'mentor_route' ? 'Energy route' : 'Recovery route'}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {(currentNode.nodeType === 'battle' || currentNode.nodeType === 'boss') && currentQuestion && (
                            <div className="max-w-5xl">
                                <div className="flex flex-col lg:flex-row gap-6 mb-6">
                                    <div className="flex-1 rounded-[1.75rem] bg-[linear-gradient(145deg,#15152a,#0f0f19)] border border-[#2d2d3f] p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <div className="text-[10px] uppercase tracking-[0.3em] text-red-400 mb-2">{currentNode.payload.enemyName}</div>
                                                <div className="text-lg font-black">Enemy Integrity</div>
                                            </div>
                                            <div className="text-3xl font-black text-red-400">{battleHealth}</div>
                                        </div>
                                        <div className="h-3 rounded-full bg-[#1c1c2f] overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-red-500 to-orange-500"
                                                style={{ width: `${Math.max(0, Math.min(100, battleHealth || 0))}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="w-full lg:w-[240px] rounded-[1.75rem] bg-[linear-gradient(145deg,#15152a,#0f0f19)] border border-[#2d2d3f] p-6">
                                        <div className="text-[10px] uppercase tracking-[0.3em] text-cyan-400 mb-2">Timer</div>
                                        <div className={`text-5xl font-black ${timeLeft <= 5 ? 'text-red-400' : 'text-white'}`}>{timeLeft}</div>
                                        {currentNode.nodeType === 'boss' && (
                                            <div className="text-sm text-slate-400 mt-4">Phase {battleQuestionIndex + 1} of {(currentNode.payload.questions as BattleQuestion[]).length}</div>
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-[1.75rem] bg-[linear-gradient(145deg,#15152a,#0f0f19)] border border-[#2d2d3f] p-6 sm:p-8 mb-6">
                                    <h3 className="text-2xl font-black leading-tight mb-6">{currentQuestion.prompt}</h3>

                                    <div className="flex flex-wrap gap-3 mb-6">
                                        <button
                                            onClick={() => useAbility('scan')}
                                            disabled={state.energy < 1 || selectedOption !== null}
                                            className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-bold text-cyan-300 disabled:opacity-40"
                                        >
                                            Scan (-1)
                                        </button>
                                        <button
                                            onClick={() => useAbility('guard')}
                                            disabled={state.energy < 1 || selectedOption !== null}
                                            className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-300 disabled:opacity-40"
                                        >
                                            Guard (-1)
                                        </button>
                                        <button
                                            onClick={() => useAbility('finisher')}
                                            disabled={state.energy < 2 || selectedOption !== null}
                                            className="rounded-full border border-[#ea580c]/30 bg-[#ea580c]/10 px-4 py-2 text-sm font-bold text-[#ea580c] disabled:opacity-40"
                                        >
                                            Finisher (-2)
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {currentQuestion.options.map((option) => {
                                            const hidden = revealedWrongOptions.includes(option);
                                            const wasPicked = selectedOption === option;
                                            const isCorrect = option === currentQuestion.answer;
                                            const stateClass = hidden
                                                ? 'opacity-30 border-slate-800'
                                                : wasPicked && isCorrect
                                                    ? 'border-emerald-400 bg-emerald-500/10'
                                                    : wasPicked && !isCorrect
                                                        ? 'border-red-400 bg-red-500/10'
                                                        : selectedOption && isCorrect
                                                            ? 'border-emerald-400 bg-emerald-500/10'
                                                            : 'border-[#2d2d3f] hover:border-cyan-400/50';

                                            return (
                                                <button
                                                    key={option}
                                                    disabled={hidden || selectedOption !== null}
                                                    onClick={() => void handleAnswer(option)}
                                                    className={`rounded-[1.25rem] border px-5 py-4 text-left transition-all ${stateClass}`}
                                                >
                                                    <div className="text-base font-bold leading-relaxed">{option}</div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {feedback && (
                                    <div className="rounded-[1.5rem] bg-[#161625] border border-[#2d2d3f] p-5 mb-6 text-slate-300 leading-relaxed">
                                        {feedback}
                                    </div>
                                )}

                                {battleResult === 'won' && (
                                    <button
                                        onClick={() => void continueAfterBattle()}
                                        className="rounded-2xl bg-[#ea580c] hover:bg-[#c2410c] text-white font-black px-6 py-4 transition-colors"
                                    >
                                        {isCompleting ? 'Completing Mission...' : currentNode.nextNodeId ? 'Advance To Next Node' : 'Finish Mission'}
                                    </button>
                                )}
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}

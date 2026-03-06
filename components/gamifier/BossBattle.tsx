'use client';

import { useState, useEffect } from 'react';
import BossSVG from './BossSVG';
import { XP_BOSS_WIN, XP_BOSS_CONTINUE_COST } from '@/lib/constants/spaceConstants';

interface Question {
    question: string;
    options: string[];
    answer: string;
    explanation: string;
}

export default function BossBattle({
    content,
    milestone,
    onWin,
    onLose
}: {
    content: string;
    milestone: string;
    onWin: (xp: number) => void;
    onLose: (retry: boolean) => void;
}) {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [bossHealth, setBossHealth] = useState(100);
    const [playerShields, setPlayerShields] = useState(100);
    const [hitEffect, setHitEffect] = useState(false);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [battleState, setBattleState] = useState<'intro' | 'fighting' | 'won' | 'lost'>('intro');

    // Overhaul States
    const [timeLeft, setTimeLeft] = useState(20);
    const [taunt, setTaunt] = useState("Your primitive brain cannot fathom this knowledge!");

    const INTRO_TAUNTS = [
        "A challenger? How predictably pathetic.",
        "I feed on the ignorant. Come closer.",
        "Your 'study' means nothing in the void!"
    ];

    const HIT_TAUNTS = [
        "A lucky strike, insect!",
        "Gah! You actually read that chapter?!",
        "Impossible! My shields are impregnable!"
    ];

    const MISS_TAUNTS = [
        "Hahaha! Is that all you got?",
        "Weak! Your focus wanes!",
        "Predictable. Your failure was assured."
    ];

    const HURRY_TAUNTS = [
        "Time is ticking, fleshling!",
        "Thinking hard? Or hardly thinking?",
        "Hesitation is defeat!"
    ];

    useEffect(() => {
        async function fetchQuestions() {
            try {
                const res = await fetch('/api/ai/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        content,
                        type: 'mcq',
                        difficulty: 'medium',
                        count: 3
                    })
                });
                const data = await res.json();
                if (data.success) {
                    setQuestions(data.data);
                } else {
                    throw new Error(data.error || 'Failed to generate boss quiz');
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        }
        fetchQuestions();
    }, [content]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (battleState === 'fighting' && !selectedOption && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(t => {
                    const newTime = t - 1;
                    if (newTime === 5) {
                        setTaunt(HURRY_TAUNTS[Math.floor(Math.random() * HURRY_TAUNTS.length)]);
                    }
                    if (newTime <= 0) {
                        handleAnswerTimeout();
                        return 0;
                    }
                    return newTime;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [battleState, selectedOption, timeLeft]);

    const handleAnswer = (option: string) => {
        if (selectedOption || battleState !== 'fighting') return;

        setSelectedOption(option);
        const currentQuestion = questions[currentIdx];
        if (!currentQuestion) return; // safety guard

        const correct = option === currentQuestion.answer;
        setIsCorrect(correct);

        let newBossHealth = bossHealth;
        let newPlayerShields = playerShields;

        if (correct) {
            newBossHealth = Math.max(0, bossHealth - 35);
            setBossHealth(newBossHealth);
            setHitEffect(true);
            setTaunt(HIT_TAUNTS[Math.floor(Math.random() * HIT_TAUNTS.length)]);
            setTimeout(() => setHitEffect(false), 500);
        } else {
            newPlayerShields = Math.max(0, playerShields - 35);
            setPlayerShields(newPlayerShields);
            setTaunt(MISS_TAUNTS[Math.floor(Math.random() * MISS_TAUNTS.length)]);
        }

        setTimeout(() => checkEncounterEnd(correct, newBossHealth, newPlayerShields), 2000);
    };

    const handleAnswerTimeout = () => {
        if (selectedOption || battleState !== 'fighting') return;
        const newShields = Math.max(0, playerShields - 35);
        setSelectedOption('TIMEOUT');
        setIsCorrect(false);
        setPlayerShields(newShields);
        setTaunt("Too slow! The void claims your shields!");
        setTimeout(() => checkEncounterEnd(false, bossHealth, newShields), 2000);
    };

    const checkEncounterEnd = (wasCorrect: boolean, newBossHealth: number, newPlayerShields: number) => {
        if (wasCorrect && newBossHealth <= 0) {
            setBattleState('won');
        } else if (!wasCorrect && newPlayerShields <= 0) {
            setBattleState('lost');
        } else {
            const nextIdx = currentIdx + 1;
            if (nextIdx >= questions.length) {
                // Ran out of questions without either side dying — boss is defeated
                setBattleState('won');
            } else {
                setCurrentIdx(nextIdx);
                setSelectedOption(null);
                setIsCorrect(null);
                setTimeLeft(20);
            }
        }
    };


    const startFight = () => {
        setBattleState('fighting');
        setTaunt(INTRO_TAUNTS[Math.floor(Math.random() * INTRO_TAUNTS.length)]);
        setTimeLeft(20);
    };

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center text-white">
                <div className="text-[#ea580c] font-black text-4xl mb-8 animate-pulse">⚠️ BOSS ENCOUNTERED</div>
                <div className="size-16 rounded-full border-4 border-[#7c3aed] border-t-transparent animate-spin mb-4" />
                <div className="text-sm font-bold uppercase tracking-[0.3em] text-slate-400">Scanning Weak Points...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center text-white p-6 text-center">
                <div className="text-red-500 font-black text-4xl mb-4">SYSTEM ERROR</div>
                <p className="text-slate-400 mb-8 max-w-md">{error}</p>
                <button onClick={() => onLose(false)} className="px-8 py-3 bg-[#1e1b4b] border border-[#3730a3] rounded-xl font-bold hover:bg-[#2e2a7a] transition-colors">
                    Continue Navigation
                </button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center text-white p-6 overflow-hidden">

            {/* Red Flash Overlay for lost shields */}
            <div className={`absolute inset-0 bg-red-600/20 pointer-events-none transition-opacity duration-300 ${isCorrect === false ? 'opacity-100' : 'opacity-0'}`} />

            {/* Battle Header */}
            <header className="absolute top-4 md:top-10 left-0 w-full flex justify-between px-4 md:px-10 items-center z-50">
                <div className="flex flex-col gap-1 md:gap-2 w-32 md:w-64 max-w-[30vw]">
                    <div className="text-[8px] md:text-[10px] uppercase font-bold text-[#38bdf8] tracking-widest bg-[#38bdf8]/10 w-max px-1 md:px-2 py-0.5 rounded truncate max-w-full">Shields</div>
                    <div className="h-3 md:h-4 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700 relative">
                        <div
                            className="h-full bg-gradient-to-r from-[#0369a1] to-[#38bdf8] transition-all duration-500 ease-out"
                            style={{ width: `${playerShields}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-[8px] md:text-[10px] font-bold text-white drop-shadow-md">
                            {Math.ceil(playerShields)}%
                        </div>
                    </div>
                </div>

                <div className="text-center">
                    <div className="text-lg md:text-4xl font-black text-[#ea580c] tracking-tighter uppercase drop-shadow-[0_0_15px_rgba(234,88,12,0.5)]">NEBULA BEAST</div>
                    <div className="text-[8px] md:text-[10px] uppercase font-bold text-[#7c3aed] tracking-[0.2em] md:tracking-[0.5em] mt-1">Milestone {milestone}</div>
                </div>

                <div className="flex flex-col gap-1 md:gap-2 items-end w-32 md:w-64 max-w-[30vw]">
                    <div className="text-[8px] md:text-[10px] uppercase font-bold text-red-500 tracking-widest bg-red-500/10 w-max px-1 md:px-2 py-0.5 rounded truncate max-w-full">Boss Health</div>
                    <div className="h-3 md:h-4 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700 relative flex justify-end">
                        <div
                            className="h-full bg-gradient-to-l from-[#7f1d1d] to-[#ef4444] transition-all duration-500 ease-out absolute right-0"
                            style={{ width: `${bossHealth}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-[8px] md:text-[10px] font-bold text-white drop-shadow-md">
                            {Math.ceil(bossHealth)}%
                        </div>
                    </div>
                </div>
            </header>

            {battleState === 'intro' ? (
                <div className="flex flex-col items-center max-w-2xl text-center">
                    <BossSVG type="beast" isHit={false} />
                    <h2 className="text-4xl font-black mt-8 mb-4">A Knowledge Rift Has Opened!</h2>
                    <p className="text-slate-400 mb-10 leading-relaxed text-lg">
                        To survive this encounter, you must correctly answer 3 questions derived from the data you've just uploaded.<br />
                        <span className="text-red-400 font-bold mt-2 inline-block">Warning: Questions are timed. Hesitation equals damage!</span>
                    </p>
                    <button
                        onClick={startFight}
                        className="px-14 py-5 bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] rounded-2xl font-black text-xl shadow-[0_0_40px_rgba(124,58,237,0.5)] hover:scale-105 transition-all w-full max-w-sm hover:from-[#8b5cf6] hover:to-[#60a5fa] uppercase tracking-wider relative overflow-hidden group"
                    >
                        <span className="relative z-10 hidden sm:inline">Engage Target</span>
                        <span className="relative z-10 sm:hidden">Engage</span>
                        <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-500 skew-x-12" />
                    </button>
                </div>
            ) : battleState === 'fighting' ? (
                <div className="flex flex-col items-center w-full max-w-4xl pt-20 md:pt-32 pb-4 md:pb-8 h-full">

                    {/* Timer */}
                    <div className={`shrink-0 z-20 flex flex-col items-center mb-2 md:mb-4 ${timeLeft <= 5 && !selectedOption ? 'animate-bounce text-red-500' : 'text-slate-300'}`}>
                        <div className="text-[8px] md:text-[10px] uppercase font-black tracking-widest mb-1 opacity-70">Time Remaining</div>
                        <div className="text-3xl md:text-5xl font-black drop-shadow-md">
                            0:{timeLeft.toString().padStart(2, '0')}
                        </div>
                    </div>

                    <div className="shrink-0 mb-4 md:mb-8 flex items-center justify-center relative hidden sm:flex h-20 md:h-32">
                        {/* Boss Trash Talk Bubble */}
                        <div className="absolute left-[calc(50%+60px)] -top-4 bg-[#1e1b4b] border-2 border-[#7c3aed] p-3 rounded-2xl rounded-bl-none max-w-[200px] shadow-[0_0_20px_rgba(124,58,237,0.3)] z-20 transition-all transform origin-bottom-left animate-[bounce_3s_ease-in-out_infinite] hidden lg:block">
                            <p className="text-white font-bold text-xs leading-tight italic">
                                "{taunt}"
                            </p>
                        </div>
                        <div className="scale-50 md:scale-75 origin-center">
                            <BossSVG type="beast" isHit={hitEffect} />
                        </div>
                    </div>

                    <div className="w-full bg-[#101022]/80 backdrop-blur-md border border-[#2d2d3f] p-4 md:p-8 rounded-3xl relative overflow-y-auto flex-1 min-h-0 scrollbar-hide">
                        {/* Question Badge */}
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#7c3aed] px-3 md:px-4 py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest whitespace-nowrap z-10">
                            Inquiry {currentIdx + 1} / 3
                        </div>

                        <h3 className="text-base md:text-2xl font-bold text-center mb-6 md:mb-8 px-2 md:px-4 leading-normal mt-4 md:mt-0">
                            {questions[currentIdx].question}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                            {questions[currentIdx].options.map((option, idx) => {
                                const isThisSelected = selectedOption === option;
                                const isThisCorrect = option === questions[currentIdx].answer;

                                let style = "border-[#2d2d3f] text-slate-300 hover:border-[#7c3aed] hover:bg-[#1e1b4b]/50";
                                if (isThisSelected) {
                                    style = isCorrect ? "border-green-500 bg-green-500/20 text-white" : "border-red-500 bg-red-500/20 text-white";
                                } else if (selectedOption && isThisCorrect) {
                                    style = "border-green-500 bg-green-500/20 text-white";
                                }

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleAnswer(option)}
                                        disabled={!!selectedOption}
                                        className={`p-3 md:p-5 rounded-2xl border-2 transition-all text-left font-medium relative group text-sm md:text-base ${style}`}
                                    >
                                        <div className="flex items-center gap-3 md:gap-4">
                                            <div className={`size-6 md:size-8 text-xs md:text-base rounded-full border-2 flex items-center justify-center shrink-0 font-bold ${isThisSelected ? 'border-white' : 'border-[#2d2d3f] group-hover:border-[#7c3aed]'}`}>
                                                {String.fromCharCode(65 + idx)}
                                            </div>
                                            <span className="flex-1">{option}</span>
                                            {isThisSelected && (
                                                <span className="material-symbols-outlined text-xl md:text-2xl">
                                                    {isCorrect ? 'check_circle' : 'cancel'}
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Explanation text on answer */}
                        <div className={`mt-6 text-center text-sm text-slate-400 transition-opacity duration-300 ${selectedOption ? 'opacity-100' : 'opacity-0'}`}>
                            {questions[currentIdx].explanation}
                        </div>
                    </div>
                </div>
            ) : battleState === 'won' ? (
                <div className="flex flex-col items-center text-center">
                    <div className="mb-4 scale-125 brightness-150">✨</div>
                    <h2 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-[#ea580c] mb-6">BOSS DEFEATED!</h2>
                    <p className="text-xl text-slate-300 mb-10">Target neutralized. Scanning data recovered... <br /> <span className="font-bold text-[#ea580c]">+{XP_BOSS_WIN} XP earned.</span></p>
                    <button
                        onClick={() => onWin(XP_BOSS_WIN)}
                        className="px-12 py-4 bg-[#ea580c] rounded-2xl font-black text-lg shadow-[0_0_30px_rgba(234,88,12,0.4)] hover:scale-105 transition-transform"
                    >
                        EXTRACT DATA & CONTINUE
                    </button>
                </div>
            ) : (
                <div className="flex flex-col items-center text-center max-w-md">
                    <div className="text-7xl mb-6">💥</div>
                    <h2 className="text-5xl font-black text-red-500 mb-6">SHIELD BREACHED!</h2>
                    <p className="text-slate-400 mb-10 leading-relaxed">
                        Your energy shields have collapsed. Navigation through this rift is critically compromised.
                    </p>
                    <div className="flex flex-col gap-4 w-full">
                        <button
                            onClick={() => onLose(true)}
                            className="w-full py-4 bg-[#1e1b4b] border border-[#3730a3] rounded-2xl font-bold hover:bg-[#2e2a7a] transition-colors"
                        >
                            RETRY ENCOUNTER (CONSUME FUEL)
                        </button>
                        <button
                            onClick={() => onLose(false)}
                            className="w-full py-4 bg-transparent border border-red-500/30 text-red-400 rounded-2xl font-bold hover:bg-red-500/10 transition-colors"
                        >
                            ABORT TO GALAXY (-{XP_BOSS_CONTINUE_COST} XP)
                        </button>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-20px); }
                }
            `}</style>

        </div>
    );
}

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

    const [bossHealth, setBossHealth] = useState(3);
    const [playerShields, setPlayerShields] = useState(3);
    const [hitEffect, setHitEffect] = useState(false);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [battleState, setBattleState] = useState<'intro' | 'fighting' | 'won' | 'lost'>('intro');

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

    const handleAnswer = (option: string) => {
        if (selectedOption || battleState !== 'fighting') return;

        setSelectedOption(option);
        const correct = option === questions[currentIdx].answer;
        setIsCorrect(correct);

        if (correct) {
            setBossHealth(h => h - 1);
            setHitEffect(true);
            setTimeout(() => setHitEffect(false), 500);
        } else {
            setPlayerShields(s => s - 1);
        }

        setTimeout(() => {
            if (correct && bossHealth === 1) {
                setBattleState('won');
            } else if (!correct && playerShields === 1) {
                setBattleState('lost');
            } else {
                setCurrentIdx(i => i + 1);
                setSelectedOption(null);
                setIsCorrect(null);
            }
        }, 2000);
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
            <header className="absolute top-10 left-0 w-full flex justify-between px-10 items-center">
                <div className="flex flex-col gap-2">
                    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Shield Integrity</div>
                    <div className="flex gap-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`h-2 w-12 rounded-full ${i <= playerShields ? 'bg-[#38bdf8] shadow-[0_0_10px_#38bdf8]' : 'bg-slate-800'}`} />
                        ))}
                    </div>
                </div>

                <div className="text-center">
                    <div className="text-3xl font-black text-[#ea580c] tracking-tighter">THE NEBULA BEAST</div>
                    <div className="text-[10px] uppercase font-bold text-[#7c3aed] tracking-[0.5em]">Milestone {milestone}</div>
                </div>

                <div className="flex flex-col gap-2 items-end">
                    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest text-right">Anomaly Health</div>
                    <div className="flex gap-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`h-2 w-12 rounded-full ${i <= bossHealth ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-slate-800'}`} />
                        ))}
                    </div>
                </div>
            </header>

            {battleState === 'intro' ? (
                <div className="flex flex-col items-center max-w-2xl text-center">
                    <BossSVG type="beast" isHit={false} />
                    <h2 className="text-4xl font-black mt-8 mb-4">A Knowledge Rift Has Opened!</h2>
                    <p className="text-slate-400 mb-10 leading-relaxed">
                        To survive this encounter, you must correctly answer 3 questions derived from the data you've just uploaded. Wrong answers will deplete your energy shields.
                    </p>
                    <button
                        onClick={() => setBattleState('fighting')}
                        className="px-12 py-4 bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] rounded-2xl font-black text-lg shadow-[0_0_30px_rgba(124,58,237,0.4)] hover:scale-105 transition-transform"
                    >
                        ENGAGE TARGET
                    </button>
                </div>
            ) : battleState === 'fighting' ? (
                <div className="flex flex-col items-center w-full max-w-4xl relative">

                    <div className="mb-8 scale-75">
                        <BossSVG type="beast" isHit={hitEffect} />
                    </div>

                    <div className="w-full bg-[#101022]/80 backdrop-blur-md border border-[#2d2d3f] p-8 rounded-3xl relative">
                        {/* Question Badge */}
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#7c3aed] px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                            Inquiry {currentIdx + 1} / 3
                        </div>

                        <h3 className="text-2xl font-bold text-center mb-8 px-4 leading-normal">
                            {questions[currentIdx].question}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                        className={`p-5 rounded-2xl border-2 transition-all text-left font-medium relative group ${style}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`size-8 rounded-full border-2 flex items-center justify-center shrink-0 font-bold ${isThisSelected ? 'border-white' : 'border-[#2d2d3f] group-hover:border-[#7c3aed]'}`}>
                                                {String.fromCharCode(65 + idx)}
                                            </div>
                                            <span className="flex-1">{option}</span>
                                            {isThisSelected && (
                                                <span className="material-symbols-outlined text-2xl">
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

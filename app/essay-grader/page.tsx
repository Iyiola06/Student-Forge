'use client';

import Sidebar from '@/components/layout/Sidebar';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function EssayGraderPage() {
    const [question, setQuestion] = useState('');
    const [context, setContext] = useState('');
    const [typedAnswer, setTypedAnswer] = useState('');
    const [isGrading, setIsGrading] = useState(false);
    const [result, setResult] = useState<{
        score: number;
        feedback: string;
        correctAnswer: string;
        isCorrect: boolean;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGrade = async () => {
        if (!question.trim() || !typedAnswer.trim()) {
            setError('Please provide both a question and an essay/answer to grade.');
            return;
        }

        setIsGrading(true);
        setError(null);
        setResult(null);

        try {
            const res = await fetch('/api/ai/grade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'typed',
                    question,
                    context: context.trim() || 'General Academic Knowledge',
                    typedAnswer
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to grade essay');
            setResult(data);

            // Give XP
            awardXP();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsGrading(false);
        }
    };

    const awardXP = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
            .from('profiles')
            .select('xp, level')
            .eq('id', user.id)
            .single();

        if (profile) {
            const newXp = profile.xp + 50; // 50 XP for grading
            const newLevel = Math.floor(Math.sqrt(newXp / 100)) + 1;

            await supabase
                .from('profiles')
                .update({ xp: newXp, level: newLevel > profile.level ? newLevel : profile.level })
                .eq('id', user.id);
        }
    };

    return (
        <div className="bg-[#f5f5f8] dark:bg-[#101022] font-display min-h-screen flex flex-col antialiased selection:bg-[#ea580c]/30 selection:text-[#ea580c]">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden w-full max-w-[1440px] mx-auto md:ml-64">
                <div className="px-6 pt-8 pb-4 md:px-10">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
                        <span className="material-symbols-outlined text-[#ea580c] text-3xl">grading</span>
                        AI Essay Grader
                    </h1>
                    <p className="text-slate-500 dark:text-[#9c9cba] text-base mt-2">Get instant, rubric-based feedback on your long-form answers and essays.</p>
                </div>

                <main className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col lg:flex-row gap-8 items-start">

                    {/* Left Panel: Input Area */}
                    <div className="w-full lg:w-[600px] shrink-0 space-y-6">
                        <div className="bg-white dark:bg-[#1b1b27] rounded-2xl border border-slate-200 dark:border-[#2d2d3f] p-6 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                <span className="material-symbols-outlined text-8xl">keyboard</span>
                            </div>

                            {error && (
                                <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                                    <span className="material-symbols-outlined text-xl">error</span>
                                    {error}
                                </div>
                            )}

                            <div className="space-y-5 relative z-10">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                        Question / Prompt
                                    </label>
                                    <textarea
                                        value={question}
                                        onChange={(e) => setQuestion(e.target.value)}
                                        className="w-full h-24 rounded-xl border border-slate-300 dark:border-[#2d2d3f] bg-slate-50 dark:bg-[#111118] p-4 text-sm focus:ring-2 focus:ring-[#ea580c] focus:outline-none dark:text-white transition-shadow resize-none"
                                        placeholder="e.g. Explain the impact of the Industrial Revolution on European society."
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex justify-between">
                                        Subject Context
                                        <span className="text-slate-400 font-normal text-xs">(Optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={context}
                                        onChange={(e) => setContext(e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 dark:border-[#2d2d3f] bg-slate-50 dark:bg-[#111118] p-3 pl-4 text-sm focus:ring-2 focus:ring-[#ea580c] focus:outline-none dark:text-white transition-shadow"
                                        placeholder="e.g. 19th Century European History"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                        Your Essay / Answer
                                    </label>
                                    <textarea
                                        value={typedAnswer}
                                        onChange={(e) => setTypedAnswer(e.target.value)}
                                        className="w-full h-64 rounded-xl border border-slate-300 dark:border-[#2d2d3f] bg-slate-50 dark:bg-[#111118] p-4 text-sm focus:ring-2 focus:ring-[#ea580c] focus:outline-none dark:text-white transition-shadow leading-relaxed"
                                        placeholder="Paste your essay or paragraph here..."
                                    ></textarea>
                                </div>
                            </div>

                            <button
                                onClick={handleGrade}
                                disabled={isGrading}
                                className="w-full mt-6 bg-[#ea580c] hover:bg-[#ea580c]/90 disabled:opacity-70 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-[#ea580c]/25 transition-all flex items-center justify-center gap-2 text-[15px] relative z-10"
                            >
                                {isGrading ? (
                                    <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <span className="material-symbols-outlined text-[20px]">magic_button</span>
                                )}
                                {isGrading ? 'Analyzing Essay...' : 'Grade Essay'}
                            </button>
                        </div>
                    </div>

                    {/* Right Panel: Grading Results */}
                    <div className="flex-1 w-full lg:w-auto">
                        {!result && !isGrading ? (
                            <div className="bg-white/50 dark:bg-[#1b1b27]/30 border border-dashed border-slate-300 dark:border-[#2d2d3f] rounded-2xl h-full min-h-[500px] flex flex-col items-center justify-center text-center p-10">
                                <div className="bg-slate-200 dark:bg-[#252535] p-5 rounded-full mb-6 text-slate-500 dark:text-slate-400">
                                    <span className="material-symbols-outlined text-5xl">fact_check</span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Awaiting Submission</h3>
                                <p className="text-slate-500 dark:text-[#9c9cba] max-w-sm text-sm leading-relaxed">
                                    Provide a prompt and your answer on the left. Our AI will analyze your structure, content, and accuracy to give you actionable feedback.
                                </p>
                            </div>
                        ) : isGrading ? (
                            <div className="bg-white dark:bg-[#1b1b27] rounded-2xl border border-slate-200 dark:border-[#2d2d3f] h-full min-h-[500px] flex flex-col items-center justify-center text-center p-10 shadow-sm">
                                <div className="relative mb-8">
                                    <div className="size-20 border-4 border-slate-100 dark:border-[#252535] rounded-full"></div>
                                    <div className="absolute inset-0 size-20 border-4 border-[#ea580c] border-t-transparent rounded-full animate-spin"></div>
                                    <span className="absolute inset-0 flex items-center justify-center material-symbols-outlined text-[#ea580c] text-3xl animate-pulse">
                                        psychology
                                    </span>
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Evaluating Answer</h3>
                                <p className="text-slate-500 dark:text-[#9c9cba] animate-pulse">Running advanced heuristics and cross-referencing context...</p>
                            </div>
                        ) : result ? (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Score Header */}
                                <div className="bg-white dark:bg-[#1b1b27] rounded-2xl border border-slate-200 dark:border-[#2d2d3f] p-8 shadow-sm flex flex-col sm:flex-row items-center gap-8 relative overflow-hidden">
                                    <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full opacity-20 -mr-10 -mt-10 ${result.score >= 80 ? 'bg-green-500' : result.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>

                                    <div className="relative shrink-0 flex items-center justify-center size-36">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle
                                                className="text-slate-100 dark:text-[#252535]"
                                                cx="72"
                                                cy="72"
                                                fill="transparent"
                                                r="64"
                                                stroke="currentColor"
                                                strokeWidth="12"
                                            ></circle>
                                            <circle
                                                className={`transition-all duration-1000 ease-out ${result.score >= 80 ? 'text-green-500' : result.score >= 50 ? 'text-yellow-500' : 'text-red-500'}`}
                                                cx="72"
                                                cy="72"
                                                fill="transparent"
                                                r="64"
                                                stroke="currentColor"
                                                strokeDasharray="402.12" // 2 * pi * 64
                                                strokeDashoffset={402.12 * (1 - result.score / 100)}
                                                strokeLinecap="round"
                                                strokeWidth="12"
                                            ></circle>
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                                                {result.score}%
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex-1 text-center sm:text-left z-10">
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-[#252535] rounded-full text-xs font-bold text-slate-500 dark:text-[#9c9cba] uppercase tracking-wider mb-3">
                                            <span className="material-symbols-outlined text-[14px]">
                                                {result.score >= 80 ? 'rewarded_ads' : result.score >= 50 ? 'warning' : 'dangerous'}
                                            </span>
                                            {result.score >= 80 ? 'Excellent' : result.score >= 50 ? 'Needs Improvement' : 'Unsatisfactory'}
                                        </div>
                                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 leading-tight">
                                            {result.score >= 80 ? "Great job! You've grasped the core concepts." : result.score >= 50 ? "You're getting there, but there are some gaps." : "Review the material and try again."}
                                        </h3>
                                        <p className="text-slate-500 dark:text-[#9c9cba] text-sm leading-relaxed">
                                            Your answer was analyzed for factual accuracy, comprehensiveness, and relevance to the prompt.
                                        </p>
                                    </div>
                                </div>

                                {/* Detailed Feedback */}
                                <div className="bg-white dark:bg-[#1b1b27] rounded-2xl border border-slate-200 dark:border-[#2d2d3f] p-8 shadow-sm">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-[#2d2d3f]">
                                        <span className="material-symbols-outlined text-[#ea580c] bg-[#ea580c]/10 p-1.5 rounded-lg">rate_review</span>
                                        Examiner's Feedback
                                    </h3>
                                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-[15px]">
                                        {result.feedback}
                                    </p>
                                </div>

                                {/* Correct Answer Box */}
                                <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30 p-8 shadow-sm">
                                    <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2 pb-4 border-b border-blue-100/50 dark:border-blue-900/30">
                                        <span className="material-symbols-outlined text-blue-500 bg-blue-500/10 p-1.5 rounded-lg">verified</span>
                                        Ideal Model Answer
                                    </h3>
                                    <p className="text-blue-800 dark:text-blue-200/80 leading-relaxed whitespace-pre-wrap text-[15px]">
                                        {result.correctAnswer}
                                    </p>
                                </div>
                            </div>
                        ) : null}
                    </div>

                </main>
            </div>
        </div>
    );
}

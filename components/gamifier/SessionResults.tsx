'use client';

import { GameMode, getTopicTheme, modeLabels } from '@/lib/gamifier/masteryArena';

interface SessionResultsProps {
    summary: any;
    onReturn: () => void;
    onReplay: (mode: GameMode) => void;
}

export default function SessionResults({ summary, onReturn, onReplay }: SessionResultsProps) {
    const weakConcepts = summary?.weakConcepts || [];
    const theme = getTopicTheme(summary?.subject || 'General Study');
    const mode: GameMode = summary?.mode && modeLabels[summary.mode as GameMode]
        ? summary.mode as GameMode
        : 'quick_recall';

    return (
        <div className="relative min-h-[100dvh] overflow-hidden bg-[#0a0c12] px-4 py-8 text-white">
            <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient}`} />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_32%),linear-gradient(180deg,rgba(10,12,18,0.12),rgba(10,12,18,0.96))]" />

            <div className="relative z-10 mx-auto w-full max-w-5xl rounded-[2.5rem] border border-white/10 bg-[#11141d]/82 p-8 backdrop-blur-xl sm:p-10">
                <div className="mb-10 text-center">
                    <div className={`mb-4 inline-flex rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.35em] ${theme.badge}`}>
                        {modeLabels[mode].title}
                    </div>
                    <h1 className="text-4xl font-black tracking-tight sm:text-6xl">{summary?.topic || 'Session Complete'}</h1>
                    <p className="mt-3 text-lg text-slate-400">Score locked in. XP awarded. Mastery updated.</p>
                </div>

                <div className="mb-10 grid gap-4 md:grid-cols-5">
                    <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-center md:col-span-2">
                        <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Total XP</div>
                        <div className="mt-2 text-5xl font-black text-orange-300">{summary?.totalXp || 0}</div>
                    </div>
                    <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-center">
                        <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Score</div>
                        <div className="mt-2 text-3xl font-black text-sky-300">{summary?.totalScore || 0}</div>
                    </div>
                    <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-center">
                        <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Best Streak</div>
                        <div className="mt-2 text-3xl font-black text-emerald-300">{summary?.bestStreak || 0}</div>
                    </div>
                    <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-center">
                        <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Mastery</div>
                        <div className={`mt-2 text-3xl font-black ${(summary?.masteryDelta || 0) >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                            {(summary?.masteryDelta || 0) >= 0 ? '+' : ''}{summary?.masteryDelta || 0}
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
                    <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
                        <h2 className="mb-5 text-2xl font-black">XP Breakdown</h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#0f1219] px-4 py-3">
                                <span className="text-slate-400">Session completion</span>
                                <span className="font-black">{summary?.completionXp || 0}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#0f1219] px-4 py-3">
                                <span className="text-slate-400">Accuracy bonus</span>
                                <span className="font-black">{summary?.accuracyBonusXp || 0}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#0f1219] px-4 py-3">
                                <span className="text-slate-400">Streak bonus</span>
                                <span className="font-black">{summary?.streakBonusXp || 0}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#0f1219] px-4 py-3">
                                <span className="text-slate-400">Weak spot bonus</span>
                                <span className="font-black">{summary?.weakSpotBonusXp || 0}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#0f1219] px-4 py-3">
                                <span className="text-slate-400">First run today</span>
                                <span className="font-black">{summary?.dailyBonusXp || 0}</span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
                        <h2 className="mb-5 text-2xl font-black">Weak Concepts Saved</h2>
                        {weakConcepts.length > 0 ? (
                            <div className="space-y-3">
                                {weakConcepts.map((concept: string) => (
                                    <div key={concept} className="rounded-2xl border border-white/10 bg-[#0f1219] px-4 py-4 text-sm text-slate-300">
                                        {concept}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-white/10 bg-[#0f1219] px-4 py-4 text-slate-400">
                                Clean run. No weak concepts were flagged this time.
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <button
                        onClick={() => onReplay(mode)}
                        className="rounded-2xl bg-[#f97316] px-8 py-4 font-black text-white transition hover:bg-[#ea580c]"
                    >
                        One More Run
                    </button>
                    <button
                        onClick={onReturn}
                        className="rounded-2xl border border-white/10 bg-white/5 px-8 py-4 font-black text-slate-200 transition hover:bg-white/10"
                    >
                        Back To Lobby
                    </button>
                </div>
            </div>
        </div>
    );
}

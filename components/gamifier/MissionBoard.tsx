'use client';

import { useState } from 'react';

interface Mission {
    id: string;
    title: string;
    desc: string;
    xp: number;
    reward?: string;
    progress: number;
    target: number;
    type: 'daily' | 'weekly';
}

export default function MissionBoard({
    profile,
    onClose
}: {
    profile: any;
    onClose: () => void
}) {
    // In a real app, these would come from profile.missions JSONB
    // We'll simulate some data based on what we've added to the profile interface
    const [missions] = useState<Mission[]>([
        {
            id: 'd1', title: 'Planetary Scavenger', desc: 'Read 10 pages today',
            xp: 50, progress: Math.min(profile?.pages_read_today || 4, 10), target: 10, type: 'daily'
        },
        {
            id: 'd2', title: 'Ace Pilot', desc: 'Defeat 1 Boss Battle',
            xp: 75, progress: profile?.boss_wins_today || 0, target: 1, type: 'daily'
        },
        {
            id: 'd3', title: 'First Contact', desc: 'Open any document',
            xp: 20, progress: 1, target: 1, type: 'daily'
        },
        {
            id: 'w1', title: 'Galactic Conqueror', desc: 'Complete any document',
            xp: 300, reward: 'Reward Chest', progress: profile?.docs_completed_week || 0, target: 1, type: 'weekly'
        },
        {
            id: 'w2', title: 'Hyperdrive Hero', desc: 'Maintain 5-day streak',
            xp: 200, reward: 'Rare Badge', progress: Math.min(profile?.streak_days || 0, 5), target: 5, type: 'weekly'
        },
        {
            id: 'w3', title: 'Elite Vanguard', desc: 'Win 3 Boss Battles',
            xp: 250, reward: 'Title Card', progress: Math.min(profile?.boss_wins_week || 1, 3), target: 3, type: 'weekly'
        }
    ]);

    const [tab, setTab] = useState<'daily' | 'weekly'>('daily');

    const filteredMissions = missions.filter(m => m.type === tab);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-10 font-display">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-[#101022] border border-[#2d2d3f] rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[80vh]">

                {/* Header */}
                <header className="p-8 border-b border-[#2d2d3f] bg-gradient-to-r from-[#101022] to-[#1a1a2e] flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-black text-white">MISSION BOARD</h2>
                        <p className="text-xs font-bold text-[#38bdf8] uppercase tracking-[0.3em] mt-1">Galactic Priority Assignments</p>
                    </div>
                    <button onClick={onClose} className="size-10 rounded-full border border-[#2d2d3f] flex items-center justify-center hover:bg-[#1b1b2f] transition-colors">
                        <span className="material-symbols-outlined text-slate-400">close</span>
                    </button>
                </header>

                {/* Tabs */}
                <div className="flex border-b border-[#2d2d3f] p-2 bg-[#0c0c16]">
                    <button
                        onClick={() => setTab('daily')}
                        className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${tab === 'daily' ? 'bg-[#ea580c] text-white shadow-lg shadow-[#ea580c]/20' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Daily Missions
                    </button>
                    <button
                        onClick={() => setTab('weekly')}
                        className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${tab === 'weekly' ? 'bg-[#7c3aed] text-white shadow-lg shadow-[#7c3aed]/20' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Weekly Missions
                    </button>
                </div>

                {/* Content */}
                <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
                    {filteredMissions.map((m) => {
                        const isComplete = m.progress >= m.target;
                        const pct = (m.progress / m.target) * 100;

                        return (
                            <div key={m.id} className={`p-5 rounded-2xl border transition-all flex items-center gap-6 ${isComplete ? 'bg-[#050510]/50 border-green-500/30' : 'bg-[#1b1b2f]/50 border-[#2d2d3f] hover:border-slate-700'}`}>
                                <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 ${isComplete ? 'bg-green-500/20 text-green-500' : 'bg-[#0c0c16] text-[#38bdf8]'}`}>
                                    <span className="material-symbols-outlined text-2xl">
                                        {isComplete ? 'verified' : (m.type === 'daily' ? 'schedule' : 'stars')}
                                    </span>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className={`font-bold text-base truncate ${isComplete ? 'text-slate-400 line-through' : 'text-white'}`}>{m.title}</h4>
                                        <div className="flex items-center gap-1 text-[10px] font-black text-[#ea580c]">
                                            <span className="material-symbols-outlined text-[14px]">diamond</span>
                                            +{m.xp} XP
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-3">{m.desc}</p>

                                    <div className="flex items-center gap-4">
                                        <div className="flex-1 h-1.5 bg-[#0c0c16] rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${isComplete ? 'bg-green-500' : (m.type === 'daily' ? 'bg-[#ea580c]' : 'bg-[#7c3aed]')}`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <span className={`text-[10px] font-black tabular-nums ${isComplete ? 'text-green-500' : 'text-slate-400'}`}>
                                            {m.progress} / {m.target}
                                        </span>
                                    </div>
                                </div>

                                {m.reward && !isComplete && (
                                    <div className="shrink-0 flex flex-col items-center gap-1">
                                        <div className="size-10 rounded-full border border-dashed border-[#7c3aed] flex items-center justify-center animate-pulse">
                                            <span className="material-symbols-outlined text-[#7c3aed] text-xl">redeem</span>
                                        </div>
                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter w-12 text-center">{m.reward}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </main>

                {/* Footer */}
                <footer className="p-4 border-t border-[#2d2d3f] bg-[#0c0c16] text-center">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                        {tab === 'daily' ? 'Next refresh at 00:00 Local Galactic Time' : 'Season ends in 4 Days, 12 Hours'}
                    </p>
                </footer>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #2d2d3f;
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
}

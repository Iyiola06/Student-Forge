'use client';

interface MissionResultsProps {
    missionTitle: string;
    summary: any;
    onReturn: () => void;
}

export default function MissionResults({ missionTitle, summary, onReturn }: MissionResultsProps) {
    const unlocked = summary?.unlocked || [];

    return (
        <div className="min-h-[100dvh] bg-[#050510] text-white flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-5xl rounded-[2.5rem] border border-[#2d2d3f] bg-[#101022]/90 backdrop-blur-xl p-8 sm:p-10">
                <div className="text-center mb-10">
                    <div className="text-xs font-black uppercase tracking-[0.45em] text-cyan-400 mb-4">Mission Clear</div>
                    <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-3">{missionTitle}</h1>
                    <p className="text-slate-400 text-lg">You cleared the route, beat the final examiner, and banked permanent progress.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-10">
                    <div className="rounded-[1.5rem] bg-[#161625] border border-[#2d2d3f] p-5 text-center md:col-span-2">
                        <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-2">Total XP</div>
                        <div className="text-5xl font-black text-[#ea580c]">{summary?.totalXp || 0}</div>
                    </div>
                    <div className="rounded-[1.5rem] bg-[#161625] border border-[#2d2d3f] p-5 text-center">
                        <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-2">Node XP</div>
                        <div className="text-3xl font-black text-cyan-400">{summary?.nodeXp || 0}</div>
                    </div>
                    <div className="rounded-[1.5rem] bg-[#161625] border border-[#2d2d3f] p-5 text-center">
                        <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-2">Boss XP</div>
                        <div className="text-3xl font-black text-violet-400">{summary?.bossXp || 0}</div>
                    </div>
                    <div className="rounded-[1.5rem] bg-[#161625] border border-[#2d2d3f] p-5 text-center">
                        <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-2">Unlock Bonus</div>
                        <div className="text-3xl font-black text-emerald-400">{summary?.unlockBonusXp || 0}</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.8fr] gap-6">
                    <div className="rounded-[1.75rem] bg-[#161625] border border-[#2d2d3f] p-6">
                        <h2 className="text-2xl font-black mb-5">Reward Breakdown</h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex items-center justify-between rounded-2xl bg-[#101022] border border-[#2d2d3f] px-4 py-3">
                                <span className="text-slate-400">Node completions</span>
                                <span className="font-black">{summary?.nodeXp || 0}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-2xl bg-[#101022] border border-[#2d2d3f] px-4 py-3">
                                <span className="text-slate-400">Mission clear bonus</span>
                                <span className="font-black">{summary?.missionXp || 0}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-2xl bg-[#101022] border border-[#2d2d3f] px-4 py-3">
                                <span className="text-slate-400">Boss victory bonus</span>
                                <span className="font-black">{summary?.bossXp || 0}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-2xl bg-[#101022] border border-[#2d2d3f] px-4 py-3">
                                <span className="text-slate-400">Perfect streak bonus</span>
                                <span className="font-black">{summary?.streakBonusXp || 0}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-2xl bg-[#101022] border border-[#2d2d3f] px-4 py-3">
                                <span className="text-slate-400">First-time chapter unlock</span>
                                <span className="font-black">{summary?.unlockBonusXp || 0}</span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-[1.75rem] bg-[#161625] border border-[#2d2d3f] p-6">
                        <h2 className="text-2xl font-black mb-5">Unlocked</h2>
                        {unlocked.length > 0 ? (
                            <div className="space-y-3">
                                {unlocked.map((item: any) => (
                                    <div key={`${item.unlockType}-${item.unlockKey}`} className="rounded-2xl bg-[#101022] border border-[#2d2d3f] px-4 py-4">
                                        <div className="text-[10px] uppercase tracking-[0.3em] text-cyan-400 mb-2">{item.unlockType}</div>
                                        <div className="font-black">{item.label}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-2xl bg-[#101022] border border-[#2d2d3f] px-4 py-4 text-slate-400">
                                No new chapter unlock this run, but your XP and mastery still counted.
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-8 flex justify-center">
                    <button
                        onClick={onReturn}
                        className="rounded-2xl bg-[#ea580c] hover:bg-[#c2410c] text-white font-black px-8 py-4 transition-colors"
                    >
                        Return To Mission Hub
                    </button>
                </div>
            </div>
        </div>
    );
}

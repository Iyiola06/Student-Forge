'use client';

import Link from 'next/link';
import { Profile } from '@/hooks/useProfile';

interface MissionHubProps {
    profile: Profile | null;
    resources: any[];
    activeRun: any | null;
    onStartMission: (resourceId?: string) => void;
    onResumeMission: () => void;
    isLaunching: boolean;
}

export default function MissionHub({
    profile,
    resources,
    activeRun,
    onStartMission,
    onResumeMission,
    isLaunching,
}: MissionHubProps) {
    const featuredResources = resources.slice(0, 3);

    return (
        <div className="relative min-h-[100dvh] bg-[#050510] text-white overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1d4ed820,transparent_35%),radial-gradient(circle_at_bottom_right,#ea580c20,transparent_30%)] pointer-events-none" />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
                <div className="flex flex-col lg:flex-row gap-8 items-start justify-between mb-10">
                    <div className="max-w-2xl">
                        <p className="text-xs font-black uppercase tracking-[0.4em] text-cyan-400 mb-4">Story Adventure</p>
                        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[0.95] mb-4">
                            Study Runs That
                            <span className="block text-[#ea580c]">Actually Feel Playable</span>
                        </h1>
                        <p className="text-slate-300 text-base sm:text-lg max-w-xl leading-relaxed">
                            Pick a mission, clear branching nodes, use tactical abilities, and defeat a final examiner in a fast 5-10 minute run.
                        </p>
                    </div>

                    <div className="w-full lg:w-[340px] bg-[#101022]/80 backdrop-blur-xl border border-[#2d2d3f] rounded-[2rem] p-6 shadow-2xl">
                        <div className="flex items-center gap-4 mb-6">
                            <div
                                className="size-16 rounded-2xl border-2 border-[#ea580c] bg-cover bg-center"
                                style={{ backgroundImage: `url("${profile?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=story-adventure'}")` }}
                            />
                            <div>
                                <div className="text-lg font-black">{profile?.full_name || 'Student'}</div>
                                <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Level {profile?.level || 1}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-6">
                            <div className="rounded-2xl bg-[#161625] border border-[#2d2d3f] p-3 text-center">
                                <div className="text-xl font-black text-[#ea580c]">{profile?.xp?.toLocaleString() || 0}</div>
                                <div className="text-[10px] uppercase tracking-widest text-slate-500">XP</div>
                            </div>
                            <div className="rounded-2xl bg-[#161625] border border-[#2d2d3f] p-3 text-center">
                                <div className="text-xl font-black text-cyan-400">{profile?.streak_days || 0}</div>
                                <div className="text-[10px] uppercase tracking-widest text-slate-500">Streak</div>
                            </div>
                            <div className="rounded-2xl bg-[#161625] border border-[#2d2d3f] p-3 text-center">
                                <div className="text-xl font-black text-violet-400">{resources.length}</div>
                                <div className="text-[10px] uppercase tracking-widest text-slate-500">Sources</div>
                            </div>
                        </div>

                        {activeRun ? (
                            <button
                                onClick={onResumeMission}
                                className="w-full rounded-2xl bg-[#ea580c] hover:bg-[#c2410c] text-white font-black px-5 py-4 transition-colors"
                            >
                                Resume Active Mission
                            </button>
                        ) : (
                            <button
                                onClick={() => onStartMission()}
                                disabled={isLaunching}
                                className="w-full rounded-2xl bg-[#ea580c] hover:bg-[#c2410c] disabled:opacity-60 text-white font-black px-5 py-4 transition-colors"
                            >
                                {isLaunching ? 'Launching Mission...' : 'Launch Story Run'}
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.9fr] gap-8">
                    <div className="bg-[#101022]/70 backdrop-blur-xl border border-[#2d2d3f] rounded-[2rem] p-6 sm:p-8">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-black">Mission Seeds</h2>
                                <p className="text-slate-400 text-sm mt-1">Use your own materials first, then fall back to community challenge data.</p>
                            </div>
                            <Link href="/resources" className="text-sm font-bold text-cyan-400 hover:text-cyan-300">
                                Manage Sources
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {featuredResources.map((resource, index) => (
                                <button
                                    key={resource.id}
                                    onClick={() => onStartMission(resource.id)}
                                    disabled={isLaunching}
                                    className="text-left rounded-[1.5rem] border border-[#2d2d3f] bg-[linear-gradient(145deg,#121225,#0b0b16)] p-5 hover:border-[#ea580c]/50 hover:-translate-y-1 transition-all"
                                >
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                        <div>
                                            <div className="text-[10px] uppercase tracking-[0.3em] text-cyan-400 mb-2">Resource Mission {index + 1}</div>
                                            <div className="text-xl font-black leading-tight">{resource.title}</div>
                                        </div>
                                        <div className="size-12 rounded-2xl bg-[#ea580c]/10 border border-[#ea580c]/20 flex items-center justify-center text-[#ea580c]">
                                            <span className="material-symbols-outlined">rocket_launch</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-400 leading-relaxed mb-4">
                                        Tactical encounters generated from your notes, plus a boss round inspired by broader exam patterns.
                                    </p>
                                    <div className="flex items-center justify-between text-xs uppercase tracking-widest text-slate-500">
                                        <span>{resource.subject || 'General'}</span>
                                        <span>5-10 min</span>
                                    </div>
                                </button>
                            ))}

                            <button
                                onClick={() => onStartMission()}
                                disabled={isLaunching}
                                className="text-left rounded-[1.5rem] border border-violet-500/30 bg-[linear-gradient(145deg,#161028,#0b0b16)] p-5 hover:border-violet-400 hover:-translate-y-1 transition-all"
                            >
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <div>
                                        <div className="text-[10px] uppercase tracking-[0.3em] text-violet-400 mb-2">Community Challenge</div>
                                        <div className="text-xl font-black leading-tight">Final Examiner Relay</div>
                                    </div>
                                    <div className="size-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                                        <span className="material-symbols-outlined">travel_explore</span>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-400 leading-relaxed mb-4">
                                    No upload needed. The run will pull from the community past-questions bank and subject-level fallback knowledge.
                                </p>
                                <div className="flex items-center justify-between text-xs uppercase tracking-widest text-slate-500">
                                    <span>Hybrid Source</span>
                                    <span>Replayable</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-[#101022]/70 backdrop-blur-xl border border-[#2d2d3f] rounded-[2rem] p-6">
                            <h3 className="text-lg font-black mb-4">How The Run Works</h3>
                            <div className="space-y-3 text-sm text-slate-300">
                                <div className="rounded-2xl bg-[#161625] border border-[#2d2d3f] p-4">1. Start with a mission seed from your notes or community topics.</div>
                                <div className="rounded-2xl bg-[#161625] border border-[#2d2d3f] p-4">2. Win fast tactical battles by answering correctly and using energy abilities well.</div>
                                <div className="rounded-2xl bg-[#161625] border border-[#2d2d3f] p-4">3. Choose rewards and routes that change the rest of the session.</div>
                                <div className="rounded-2xl bg-[#161625] border border-[#2d2d3f] p-4">4. Beat the Final Examiner for mission XP and chapter unlocks.</div>
                            </div>
                        </div>

                        <div className="bg-[#101022]/70 backdrop-blur-xl border border-[#2d2d3f] rounded-[2rem] p-6">
                            <h3 className="text-lg font-black mb-4">Tactical Kit</h3>
                            <div className="grid grid-cols-1 gap-3">
                                <div className="rounded-2xl bg-[#161625] border border-[#2d2d3f] p-4">
                                    <div className="font-black text-cyan-400 mb-1">Scan</div>
                                    <div className="text-sm text-slate-400">Spend energy to eliminate one wrong option.</div>
                                </div>
                                <div className="rounded-2xl bg-[#161625] border border-[#2d2d3f] p-4">
                                    <div className="font-black text-emerald-400 mb-1">Guard</div>
                                    <div className="text-sm text-slate-400">Reduce the next wrong-answer hit and stabilize your run.</div>
                                </div>
                                <div className="rounded-2xl bg-[#161625] border border-[#2d2d3f] p-4">
                                    <div className="font-black text-[#ea580c] mb-1">Finisher</div>
                                    <div className="text-sm text-slate-400">Spend extra energy to turn one correct answer into a heavy strike.</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

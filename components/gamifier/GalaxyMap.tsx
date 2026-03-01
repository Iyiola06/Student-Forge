'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { generateStars, getPlanetGradient, getActiveTitle } from '@/lib/constants/spaceConstants';
import MissionBoard from './MissionBoard';

export default function GalaxyMap({
    profile,
    resources,
    onSelectPlanet
}: {
    profile: any;
    resources: any[];
    onSelectPlanet: (resource: any) => void;
}) {
    const starsShadow = useMemo(() => generateStars(200), []);
    const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null);
    const [showMissions, setShowMissions] = useState(false);

    const currentLevel = profile?.level || 1;
    const userXp = profile?.xp || 0;
    const targetXp = currentLevel * 500;
    const progressPercent = Math.min(100, Math.round((userXp / targetXp) * 100));

    // Stats
    const planetsExplored = resources.length;
    const totalPagesRead = profile?.pages_read || 0; // if tracked globally, otherwise 0 for now

    return (
        <div className="relative w-full h-screen bg-[#050510] overflow-hidden flex flex-col font-display selection:bg-[#ea580c]/30">
            {/* Deep Space Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div
                    className="w-[2px] h-[2px] bg-transparent rounded-full"
                    style={{ boxShadow: starsShadow }}
                />
            </div>

            {/* Nebula Gradients */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#581c87]/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-[#0e7490]/15 rounded-full blur-[150px] pointer-events-none mix-blend-screen" />

            {/* HUD: Top Bar */}
            <header className="relative z-20 flex items-start justify-between p-6 pointer-events-none">
                {/* Top Left: Commander Profile */}
                <div className="flex items-center gap-4 bg-[#101022]/80 backdrop-blur-md border border-[#2d2d3f] p-3 pl-4 pr-6 rounded-2xl pointer-events-auto shadow-2xl shadow-[#ea580c]/10">
                    <div className="relative">
                        <div className="size-14 rounded-full bg-cover bg-center border-2 border-[#ea580c] relative z-10"
                            style={{ backgroundImage: `url("${profile?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback'}")` }}
                        />
                        <div className="absolute inset-[-4px] border border-slate-700 rounded-full opacity-50 border-dashed animate-[spin_10s_linear_infinite]" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-white leading-tight">{profile?.full_name || 'Student'}</h2>
                        <div className="text-xs font-bold text-[#ea580c] uppercase tracking-widest mb-2">{getActiveTitle(profile)}</div>

                        {/* XP Fuel Gauge */}
                        <div className="w-32 bg-[#1b1b27] rounded-full h-1.5 overflow-hidden mb-1">
                            <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400 h-full rounded-full transition-all duration-1000 relative"
                                style={{ width: `${progressPercent}%` }}>
                                <div className="absolute top-0 right-0 bottom-0 w-2 bg-white/40 blur-[1px]" />
                            </div>
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-500 font-bold">
                            <span>LVL {currentLevel}</span>
                            <span>{userXp}/{targetXp} XP</span>
                        </div>
                    </div>
                    <div className="ml-4 pl-4 border-l border-[#2d2d3f] flex flex-col items-center justify-center">
                        <span className="text-xl">🔥</span>
                        <span className="text-xs font-bold text-slate-400">{profile?.streak_days || 0}</span>
                    </div>
                </div>

                {/* Top Right: Stats */}
                <div className="flex gap-3 pointer-events-auto">
                    {[
                        { label: 'Planets', value: planetsExplored, icon: 'public' },
                        { label: 'Pages', value: totalPagesRead, icon: 'auto_stories' },
                        { label: 'Total XP', value: userXp, icon: 'diamond' }
                    ].map((s, i) => (
                        <div key={i} className="bg-[#101022]/80 backdrop-blur-md border border-[#2d2d3f] px-4 py-2 rounded-xl flex items-center gap-3">
                            <span className="material-symbols-outlined text-[#38bdf8] opacity-70">{s.icon}</span>
                            <div>
                                <div className="text-sm font-black text-white">{s.value.toLocaleString()}</div>
                                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{s.label}</div>
                            </div>
                        </div>
                    ))}

                    {/* Mission Board Toggle */}
                    <button
                        onClick={() => setShowMissions(true)}
                        className="bg-[#101022]/80 backdrop-blur-md border border-[#2d2d3f] hover:border-[#ea580c] px-4 py-2 rounded-xl flex items-center gap-2 transition-colors group pointer-events-auto"
                    >
                        <span className="material-symbols-outlined text-purple-400 group-hover:text-[#ea580c]">assignment</span>
                        <span className="text-xs font-bold text-white uppercase tracking-wider">Missions</span>
                    </button>
                    <Link href="/resources" className="bg-[#ea580c] hover:bg-[#d04e0a] text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-[#ea580c]/20 transition-transform hover:scale-105">
                        <span className="material-symbols-outlined text-sm">add</span>
                        <span className="text-xs font-bold uppercase tracking-wider">Upload</span>
                    </Link>
                </div>
            </header>

            {/* Galaxy Area */}
            <main className="flex-1 relative z-10 w-full h-full p-10 overflow-hidden flex items-center justify-center pointer-events-auto">
                {resources.length === 0 ? (
                    <div className="text-center">
                        <div className="size-24 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center mx-auto mb-6 opacity-50">
                            <span className="material-symbols-outlined text-3xl text-slate-500">public_off</span>
                        </div>
                        <h3 className="text-2xl font-black text-white mb-2">Blank Sector</h3>
                        <p className="text-slate-500 mb-8 max-w-sm">Upload a document to spawn your first planet and begin your journey.</p>
                        <Link href="/resources" className="px-8 py-3 bg-[#ea580c] text-white font-bold rounded-xl transition-transform hover:scale-105 inline-block">
                            Spawn Planet
                        </Link>
                    </div>
                ) : (
                    <div className="w-full h-full relative" style={{ perspective: '1000px' }}>
                        {resources.map((res, i) => {
                            // Lay out planets in a loose scatter
                            const angle = (i / resources.length) * Math.PI * 2;
                            const radius = 25 + Math.random() * 20; // 25-45% from center
                            const left = `calc(50% + ${Math.cos(angle) * radius}% - 40px)`;
                            const top = `calc(50% + ${Math.sin(angle) * radius}% - 40px)`;

                            const isComplete = res.progress_percentage >= 100;
                            const inProgress = res.progress_percentage > 0 && res.progress_percentage < 100;
                            const isHovered = hoveredPlanet === res.id;

                            // Delay for bobbing animation
                            const animDelay = `${(i * 0.7) % 5}s`;

                            return (
                                <div key={res.id}
                                    className="absolute cursor-pointer transition-transform duration-500 group"
                                    style={{ left, top, zIndex: isHovered ? 50 : 10 }}
                                    onMouseEnter={() => setHoveredPlanet(res.id)}
                                    onMouseLeave={() => setHoveredPlanet(null)}
                                    onClick={() => onSelectPlanet(res)}
                                >
                                    {/* Bobbing wrapper */}
                                    <div className="relative flex items-center justify-center animate-[float_4s_ease-in-out_infinite]"
                                        style={{ animationDelay: animDelay }}>

                                        {/* Orbit Ring for in-progress */}
                                        {inProgress && (
                                            <div className="absolute inset-[-20px] rounded-full border border-[#0ea5e9]/30 animate-[spin_10s_linear_infinite]" />
                                        )}
                                        {inProgress && (
                                            <div className="absolute inset-[-30px] rounded-full border border-dashed border-[#ea580c]/20 animate-[spin_15s_linear_infinite_reverse]" />
                                        )}

                                        {/* Golden Aura for complete */}
                                        {isComplete && (
                                            <div className="absolute inset-[-15px] bg-[#f59e0b]/20 rounded-full blur-xl" />
                                        )}

                                        {/* Planet Body */}
                                        <div className={`relative size-20 rounded-full shadow-2xl transition-all duration-300 ${isHovered ? 'scale-125 shadow-[#38bdf8]/40' : ''}`}
                                            style={{
                                                background: getPlanetGradient(res.title),
                                                boxShadow: isComplete ? '0 0 30px rgba(245, 158, 11, 0.4)' : (isHovered ? '0 0 40px rgba(56, 189, 248, 0.6)' : 'inset -10px -10px 20px rgba(0,0,0,0.5)')
                                            }}
                                        >
                                            {/* Atmosphere glow */}
                                            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-white/30 mix-blend-overlay" />

                                            {/* Golden Flag for complete */}
                                            {isComplete && (
                                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xl drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]">
                                                    🚩
                                                </div>
                                            )}
                                        </div>

                                        {/* Hover Tooltip / Label */}
                                        <div className={`absolute top-full mt-6 left-1/2 -translate-x-1/2 bg-[#101022]/90 backdrop-blur-md border border-[#2d2d3f] px-4 py-2 rounded-xl text-center min-w-[140px] pointer-events-none transition-all duration-300 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
                                            <div className="text-white font-bold text-sm truncate max-w-[200px]">{res.title}</div>
                                            <div className="text-[10px] uppercase font-bold tracking-widest mt-1 text-slate-400">
                                                {isComplete ? (
                                                    <span className="text-[#f59e0b]">Conquered</span>
                                                ) : inProgress ? (
                                                    <span className="text-[#38bdf8]">{res.progress_percentage}% Explored</span>
                                                ) : (
                                                    <span>Unexplored</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Mission Board Modal */}
            {showMissions && (
                <MissionBoard
                    profile={profile}
                    onClose={() => setShowMissions(false)}
                />
            )}
        </div>
    );
}

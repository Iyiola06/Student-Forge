'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';

export default function MissionComplete({
    resource,
    stats,
    onReturn
}: {
    resource: any;
    stats: { pages: number, time: number, xp: number };
    onReturn: () => void;
}) {
    useEffect(() => {
        // Fire confetti on mount
        const duration = 5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);
            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        return () => clearInterval(interval);
    }, []);

    const [isVisible, setIsVisible] = useState(false);
    useEffect(() => {
        setTimeout(() => setIsVisible(true), 500);
    }, []);

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center text-white overflow-hidden font-display">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#ea580c10,#000000)]" />

            <div className={`transition-all duration-1000 transform ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95'} flex flex-col items-center max-w-4xl w-full px-6 text-center z-10`}>
                <div className="mb-6">
                    <span className="material-symbols-outlined text-8xl text-[#ea580c] drop-shadow-[0_0_20px_#ea580c]">emoji_events</span>
                </div>

                <h1 className="text-7xl font-black mb-4 tracking-tighter">PLANET CONQUERED</h1>
                <p className="text-xl text-[#38bdf8] font-bold uppercase tracking-[0.4em] mb-12">Sector {resource.title} Fully Explored</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-12">
                    {[
                        { label: 'XP PROFIT', value: `+${stats.xp}`, icon: 'diamond', color: 'text-[#ea580c]' },
                        { label: 'PAGES ANALYZED', value: stats.pages, icon: 'auto_stories', color: 'text-[#38bdf8]' },
                        { label: 'MISSION DURATION', value: `${Math.floor(stats.time / 60)}m ${stats.time % 60}s`, icon: 'timer', color: 'text-white' }
                    ].map((s, i) => (
                        <div key={i} className="bg-[#101022]/80 backdrop-blur border border-[#2d2d3f] p-6 rounded-3xl flex flex-col items-center gap-2 group hover:border-[#ea580c]/50 transition-colors">
                            <span className={`material-symbols-outlined text-3xl ${s.color}`}>{s.icon}</span>
                            <div className="text-3xl font-black">{s.value}</div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">{s.label}</div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col md:flex-row gap-4 w-full justify-center">
                    <button
                        onClick={onReturn}
                        className="px-12 py-4 bg-[#ea580c] rounded-2xl font-black text-lg shadow-[0_0_30px_rgba(234,88,12,0.4)] hover:scale-105 transition-all"
                    >
                        RETURN TO GALAXY
                    </button>
                    <Link
                        href={`/dashboard`}
                        className="px-12 py-4 bg-[#101022] border border-[#2d2d3f] rounded-2xl font-black text-lg hover:bg-[#1b1b2f] hover:border-[#38bdf8] transition-all"
                    >
                        VIEW MISSION REPORT
                    </Link>
                </div>

                <div className="mt-12 flex items-center gap-2 animate-bounce">
                    <span className="material-symbols-outlined text-green-500">check_circle</span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">New Badge Unlocked: Sector Marshal</span>
                </div>
            </div>

            {/* Background Elements */}
            <div className="absolute top-1/4 left-1/4 size-64 bg-[#7c3aed]/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 size-80 bg-[#0e7490]/10 rounded-full blur-[150px] animate-pulse" />
        </div>
    );
}

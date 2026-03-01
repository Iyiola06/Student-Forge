'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatTime, XP_PER_PAGE, XP_MILESTONE_25, XP_MILESTONE_50, XP_MILESTONE_75, XP_COMPLETE } from '@/lib/constants/spaceConstants';

export default function SpaceReader({
    resource,
    profile,
    onAbort,
    onComplete,
    onBossEncounter
}: {
    resource: any;
    profile: any;
    onAbort: () => void;
    onComplete: (stats: any) => void;
    onBossEncounter: (milestone: string) => void;
}) {
    const supabase = createClient();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [pdfDoc, setPdfDoc] = useState<any>(null);
    const [numPages, setNumPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [isRendering, setIsRendering] = useState(false);

    const [sessionSeconds, setSessionSeconds] = useState(0);
    const [xpEarned, setXpEarned] = useState(0);
    const [pagesRead, setPagesRead] = useState(0);
    const [floatingXp, setFloatingXp] = useState<{ id: number, text: string, x: number, y: number }[]>([]);
    const [milestone, setMilestone] = useState<{ text: string, type: '25' | '50' | '75' | '100' } | null>(null);

    // Shield Lives
    const [shields, setShields] = useState(3);

    // Timer
    useEffect(() => {
        const timer = setInterval(() => setSessionSeconds(s => s + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    // Load PDF
    useEffect(() => {
        const loadPdf = async () => {
            try {
                const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
                pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/legacy/build/pdf.worker.min.mjs`;
                const loadingTask = pdfjsLib.getDocument(resource.file_url);
                const pdf = await loadingTask.promise;
                setPdfDoc(pdf);
                setNumPages(pdf.numPages);

                // Fetch previous progress
                if (profile?.id) {
                    const { data: prog } = await supabase
                        .from('reading_progress')
                        .select('last_page')
                        .eq('resource_id', resource.id)
                        .eq('user_id', profile.id)
                        .maybeSingle();

                    if (prog && prog.last_page > 1 && prog.last_page <= pdf.numPages) {
                        const resume = window.confirm(`Commander, resume mission from page ${prog.last_page}?`);
                        if (resume) setCurrentPage(prog.last_page);
                    }
                }
            } catch (err) {
                console.error("PDF Load Error", err);
            }
        };
        if (resource?.file_url) loadPdf();
    }, [resource, profile]);

    // Render Page
    const renderPage = useCallback(async (pageNum: number) => {
        if (!pdfDoc || !canvasRef.current || isRendering) return;
        setIsRendering(true);
        try {
            const page = await pdfDoc.getPage(pageNum);
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            const pixelRatio = window.devicePixelRatio || 1;
            const scale = pixelRatio > 1 ? 2.0 : 1.5;
            const viewport = page.getViewport({ scale });
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            canvas.style.width = `${viewport.width / scale}px`;
            canvas.style.height = `${viewport.height / scale}px`;
            await page.render({ canvasContext: ctx, viewport }).promise;
        } catch (error) {
            console.error('Render error:', error);
        } finally {
            setIsRendering(false);
        }
    }, [pdfDoc]);

    useEffect(() => {
        if (pdfDoc) renderPage(currentPage);
    }, [pdfDoc, currentPage, renderPage]);

    const addFloatingXp = (amount: number, milestoneText?: string) => {
        const id = Date.now();
        const rx = window.innerWidth * 0.4 + (Math.random() * 100 - 50);
        const ry = window.innerHeight * 0.5 + (Math.random() * 100 - 50);
        setFloatingXp(prev => [...prev, { id, text: `+${amount} XP`, x: rx, y: ry }]);
        setTimeout(() => setFloatingXp(prev => prev.filter(x => x.id !== id)), 2000);

        if (milestoneText) {
            let type: '25' | '50' | '75' | '100' = '50';
            if (milestoneText.includes('25')) type = '25';
            else if (milestoneText.includes('75')) type = '75';
            else if (milestoneText.includes('Complete')) type = '100';

            setMilestone({ text: milestoneText, type });
            setTimeout(() => setMilestone(null), 4000);
        }
    };

    const handleTurn = async (dir: 1 | -1) => {
        if (isRendering) return;
        const next = currentPage + dir;
        if (next < 1 || next > numPages) return;
        setCurrentPage(next);

        if (dir === 1) {
            setPagesRead(p => p + 1);
            let earned = XP_PER_PAGE;

            const pct = next / numPages;
            const prevPct = currentPage / numPages;
            let mt = '';

            if (pct >= 0.25 && prevPct < 0.25) { earned += XP_MILESTONE_25; mt = 'Waypoint Reached! 25%'; onBossEncounter('25%'); }
            if (pct >= 0.50 && prevPct < 0.50) { earned += XP_MILESTONE_50; mt = 'Halfway Through The Galaxy! 50%'; onBossEncounter('50%'); }
            if (pct >= 0.75 && prevPct < 0.75) { earned += XP_MILESTONE_75; mt = 'Almost There, Commander! 75%'; onBossEncounter('75%'); }
            if (pct >= 1.0 && prevPct < 1.0) { earned += XP_COMPLETE; mt = 'Mission Complete!'; }

            setXpEarned(x => x + earned);
            addFloatingXp(earned, mt);

            // Save Progress async
            if (profile?.id) {
                const newProgress = Math.round(pct * 100);
                supabase.from('reading_progress').upsert({
                    user_id: profile.id,
                    resource_id: resource.id,
                    last_page: next,
                    completion_percentage: newProgress
                }, { onConflict: 'user_id, resource_id' }).then();

                supabase.rpc('increment_xp', { user_id: profile.id, xp_amount: earned }).then();
            }

            if (pct >= 1.0) {
                // Delay slightly to show final page before complete sequence
                setTimeout(() => {
                    onComplete({ pages: pagesRead + 1, time: sessionSeconds, xp: xpEarned + earned, maxPage: next, numPages });
                }, 1500);
            }
        }
    };

    const progressPct = numPages ? (currentPage / numPages) * 100 : 0;

    // Ship vertical position (0 to 100% up the track)
    const shipBottom = `${progressPct}%`;

    return (
        <div className="flex flex-col h-screen w-full bg-[#050510] text-white font-display overflow-hidden selection:bg-[#ea580c]/30">
            {/* Top Bar */}
            <header className="h-14 border-b border-[#2d2d3f] bg-[#0c0c16]/90 backdrop-blur flex items-center justify-between px-6 shrink-0 z-40 relative shadow-md shadow-black/50">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#38bdf8]">public</span>
                    <h2 className="font-bold text-sm truncate max-w-[300px] text-slate-200">{resource.title}</h2>
                </div>

                {/* Shields & XP */}
                <div className="flex items-center gap-6">
                    <div className="flex gap-1">
                        {[1, 2, 3].map(i => (
                            <span key={i} className={`material-symbols-outlined text-sm ${i <= shields ? 'text-[#38bdf8] drop-shadow-[0_0_5px_#38bdf8]' : 'text-[#2d2d3f]'}`}>
                                verified_user
                            </span>
                        ))}
                    </div>
                    <div className="text-[#ea580c] font-black text-sm drop-shadow-[0_0_5px_#ea580c]">+{xpEarned} XP</div>
                    <button onClick={onAbort} className="text-xs font-bold text-slate-400 hover:text-red-400 uppercase tracking-widest transition-colors px-3 py-1.5 border border-transparent hover:border-red-500/30 rounded-lg">
                        Abort Mission
                    </button>
                </div>

                {/* Global Neon Progress Bar */}
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#1a1a2e]">
                    <div className="h-full bg-gradient-to-r from-blue-600 via-[#38bdf8] to-[#ea580c] transition-all duration-700 ease-out shadow-[0_0_10px_#38bdf8]"
                        style={{ width: `${progressPct}%` }} />
                    <div className="absolute top-1/2 left-[25%] -translate-y-1/2 w-[3px] h-[6px] bg-[#38bdf8]" />
                    <div className="absolute top-1/2 left-[50%] -translate-y-1/2 w-[3px] h-[6px] bg-[#38bdf8]" />
                    <div className="absolute top-1/2 left-[75%] -translate-y-1/2 w-[3px] h-[6px] bg-[#38bdf8]" />
                </div>
            </header>

            {/* Main Content Split */}
            <div className="flex flex-1 overflow-hidden relative">

                {/* Milestone Banner */}
                {milestone && (
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-10 fade-in zoom-in duration-500">
                        <div className="bg-[#101022]/90 backdrop-blur-md border border-[#ea580c] px-10 py-4 rounded-2xl shadow-[0_0_40px_rgba(234,88,12,0.4)] text-center flex flex-col items-center">
                            <span className="material-symbols-outlined text-4xl text-[#ea580c] mb-1">workspace_premium</span>
                            <h2 className="text-2xl font-black text-white">{milestone.text}</h2>
                            <p className="text-sm font-bold text-[#ea580c] uppercase tracking-widest mt-1">Keep Pushing Forward!</p>
                        </div>
                    </div>
                )}

                {/* Floating XP Numbers */}
                {floatingXp.map(fxp => (
                    <div key={fxp.id} className="absolute font-black text-[#ea580c] text-xl animate-[floatUp_2s_ease-out_forwards] pointer-events-none z-50 drop-shadow-[0_0_8px_#ea580c]"
                        style={{ left: fxp.x, top: fxp.y }}>
                        {fxp.text}
                    </div>
                ))}

                {/* Left 68%: PDF Canvas */}
                <main className="w-[68%] h-full bg-[#050510] relative flex items-center justify-center border-r border-[#2d2d3f] p-8">
                    {!pdfDoc && (
                        <div className="flex flex-col items-center text-slate-500">
                            <div className="size-16 rounded-full border border-dashed border-[#ea580c] animate-spin border-t-transparent mx-auto mb-4" />
                            <div className="text-xs uppercase tracking-widest font-bold text-[#ea580c]">Entering Orbit...</div>
                        </div>
                    )}

                    <div className="relative shadow-[0_0_30px_rgba(14,116,144,0.15)] rounded-md">
                        <canvas ref={canvasRef} className="bg-white max-w-full h-auto object-contain rounded-md" />

                        {/* Space Thruster Buttons */}
                        {pdfDoc && (
                            <>
                                <button onClick={() => handleTurn(-1)} disabled={currentPage <= 1} className="absolute top-1/2 -left-20 -translate-y-1/2 size-12 rounded-full border border-[#2d2d3f] bg-[#101022]/80 backdrop-blur hover:bg-[#1b1b2f] hover:border-[#38bdf8] flex items-center justify-center transition-all disabled:opacity-20 group">
                                    <span className="material-symbols-outlined text-slate-400 group-hover:text-[#38bdf8]">chevron_left</span>
                                </button>
                                <button onClick={() => handleTurn(1)} disabled={currentPage >= numPages} className="absolute top-1/2 -right-20 -translate-y-1/2 size-12 rounded-full border border-[#2d2d3f] bg-[#101022]/80 backdrop-blur hover:bg-[#1b1b2f] hover:border-[#ea580c] flex items-center justify-center transition-all disabled:opacity-20 group shadow-[0_0_15px_rgba(234,88,12,0.1)] hover:shadow-[0_0_20px_rgba(234,88,12,0.4)]">
                                    <span className="material-symbols-outlined text-slate-400 group-hover:text-[#ea580c]">chevron_right</span>
                                </button>
                            </>
                        )}

                        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest font-bold text-slate-500">
                            Sector {currentPage} / {numPages || '-'}
                        </div>
                    </div>
                </main>

                {/* Right 32%: Mission Control (Desktop only) */}
                <aside className="hidden lg:flex w-[32%] h-full bg-[radial-gradient(ellipse_at_top,#141423,#050510)] p-8 flex-col relative z-10 overflow-hidden shrink-0">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#38bdf8] mb-8 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px]">display_settings</span>
                        Mission Control
                    </h3>

                    {/* Ship Track Tracker */}
                    <div className="flex-1 relative flex">
                        {/* The Track */}
                        <div className="absolute left-6 top-6 bottom-6 w-1 bg-[#1a1a2e] rounded-full">
                            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-blue-600 via-[#38bdf8] to-[#ea580c] transition-all duration-700 shadow-[0_0_10px_#38bdf8] rounded-full"
                                style={{ height: shipBottom }} />

                            {/* Target Planet Top */}
                            <div className="absolute -top-4 -left-[14px] size-8 rounded-full bg-[#1b1b2f] border-2 border-[#ea580c] shadow-[0_0_15px_rgba(234,88,12,0.5)] flex items-center justify-center text-xs">
                                🪐
                            </div>

                            {/* Waypoints */}
                            {[25, 50, 75].map(pct => (
                                <div key={pct} className="absolute w-[18px] h-[4px] bg-[#38bdf8] -left-[8px] rounded-full shadow-[0_0_5px_#38bdf8]"
                                    style={{ bottom: `${pct}%` }} />
                            ))}

                            {/* The Ship */}
                            <div className="absolute -left-[18px] transition-all duration-700 ease-out z-20"
                                style={{ bottom: shipBottom, transform: 'translateY(50%)' }}>
                                <div className="bg-[#101022] border border-[#38bdf8] rounded-full p-2 shadow-[0_0_15px_rgba(56,189,248,0.5)] relative">
                                    <span className="material-symbols-outlined text-[#38bdf8] text-sm -rotate-90">rocket_launch</span>
                                    {/* Engine Trail */}
                                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-2 h-8 bg-gradient-to-t from-transparent to-[#ea580c] blur-sm opacity-60" />
                                </div>
                            </div>
                        </div>

                        {/* Dashboard Stats (right of track) */}
                        <div className="ml-24 pt-12 flex flex-col gap-8 w-full">
                            <div>
                                <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Session Timer</div>
                                <div className="font-mono text-2xl font-black text-slate-200 tracking-wider">
                                    {formatTime(sessionSeconds)}
                                </div>
                            </div>

                            <div>
                                <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Target Trajectory</div>
                                <div className="text-3xl font-black text-[#38bdf8] drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]">
                                    {Math.round(progressPct)}%
                                </div>
                            </div>

                            <div className="bg-[#101022]/60 border border-[#2d2d3f] rounded-xl p-4 mt-auto mb-10 w-full relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#ea580c]/5 to-[#ea580c]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1 mb-2">
                                    <span className="material-symbols-outlined text-[12px] text-red-500">warning</span>
                                    Next Waypoint
                                </div>
                                <div className="text-sm text-slate-300 font-medium">
                                    Boss Battle detected at <span className="text-white font-bold">{Math.ceil(currentPage / (numPages / 4)) * 25}%</span> scan mark.
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Mobile Bottom HUD (Mobile only) */}
                <div className="lg:hidden absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] bg-[#101022]/90 backdrop-blur-md border border-[#2d2d3f] rounded-2xl p-4 flex items-center justify-between shadow-2xl shadow-black/50 z-40">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[#38bdf8] text-2xl">rocket_launch</span>
                        <div>
                            <div className="text-[10px] uppercase font-bold text-slate-500">Trajectory</div>
                            <div className="text-lg font-black text-white">{Math.round(progressPct)}%</div>
                        </div>
                    </div>
                    <div className="w-px h-8 bg-[#2d2d3f]" />
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#ea580c]">diamond</span>
                        <div className="text-lg font-black text-[#ea580c]">+{xpEarned}</div>
                    </div>
                </div>
            </div >

            <style jsx global>{`
                @keyframes floatUp {
                    0% { transform: translateY(0) scale(0.8); opacity: 0; }
                    20% { transform: translateY(-20px) scale(1.2); opacity: 1; text-shadow: 0 0 20px #ea580c; }
                    80% { transform: translateY(-60px) scale(1); opacity: 1; }
                    100% { transform: translateY(-80px) scale(0.9); opacity: 0; }
                }
            `}</style>
        </div >
    );
}

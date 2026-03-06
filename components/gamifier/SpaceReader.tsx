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
    onBossEncounter: (milestone: string, readContent?: string) => void;
}) {
    const supabase = createClient();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [pdfDoc, setPdfDoc] = useState<any>(null);
    const [numPages, setNumPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [maxPageReached, setMaxPageReached] = useState(1);
    const [isRendering, setIsRendering] = useState(false);
    const [textPages, setTextPages] = useState<string[]>([]);
    const [isPdf, setIsPdf] = useState(false);
    const [isDocx, setIsDocx] = useState(false);
    const [isPptx, setIsPptx] = useState(false);

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

    // Load Resource
    useEffect(() => {
        const loadResource = async () => {
            const fileType = resource.file_type || '';
            const isActuallyPdf = fileType.includes('pdf');
            const isActuallyDocx = fileType.includes('wordprocessingml') || resource.title.endsWith('.docx');
            const isActuallyPptx = fileType.includes('presentationml') || fileType.includes('vnd.ms-powerpoint') || resource.title.endsWith('.pptx') || resource.title.endsWith('.ppt');

            setIsPdf(isActuallyPdf);
            setIsDocx(isActuallyDocx);
            setIsPptx(isActuallyPptx);

            if (isActuallyPdf) {
                try {
                    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
                    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
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
                            setCurrentPage(prog.last_page);
                            setMaxPageReached(prog.last_page);
                        }
                    }
                } catch (err) {
                    console.error("PDF Load Error", err);
                }
            } else {
                // Text/Docx/Pptx mode - split content into pages
                const content = resource.content || 'Sector data corrupted or empty.';
                const charsPerPage = 1500;
                const pages = [];
                for (let i = 0; i < content.length; i += charsPerPage) {
                    pages.push(content.substring(i, i + charsPerPage));
                }
                const finalPages = pages.length > 0 ? pages : ['No readable content found.'];
                setTextPages(finalPages);
                setNumPages(finalPages.length);

                // Fetch previous progress for text
                if (profile?.id) {
                    const { data: prog } = await supabase
                        .from('reading_progress')
                        .select('last_page')
                        .eq('resource_id', resource.id)
                        .eq('user_id', profile.id)
                        .maybeSingle();

                    if (prog && prog.last_page > 1 && prog.last_page <= finalPages.length) {
                        setCurrentPage(prog.last_page);
                        setMaxPageReached(prog.last_page);
                    }
                }
            }
        };
        if (resource) loadResource();
    }, [resource, profile]);

    // Render Page (PDF Only)
    const renderPage = useCallback(async (pageNum: number) => {
        if (!pdfDoc || !canvasRef.current || isRendering || !isPdf) return;
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
    }, [pdfDoc, isPdf]);

    useEffect(() => {
        if (pdfDoc && isPdf) renderPage(currentPage);
    }, [pdfDoc, currentPage, renderPage, isPdf]);

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

        if (dir === 1 && next > maxPageReached) {
            setMaxPageReached(next);
            setPagesRead(p => p + 1);
            let earned = XP_PER_PAGE;

            const pct = next / numPages;
            const prevPct = currentPage / numPages;
            let mt = '';

            const triggerBoss = (milestoneName: string) => {
                let readContent = '';
                if (isPdf) {
                    const proportion = next / numPages;
                    const fullText = resource.content || '';
                    readContent = fullText.substring(0, Math.floor(fullText.length * proportion));
                } else {
                    readContent = textPages.slice(0, next).join('\n');
                }
                if (readContent.length > 15000) readContent = readContent.slice(-15000);
                if (readContent.length < 300) readContent = resource.content || '';
                onBossEncounter(milestoneName, readContent);
            };

            if (pct >= 0.25 && prevPct < 0.25) { earned += XP_MILESTONE_25; mt = 'Waypoint Reached! 25%'; triggerBoss('25%'); }
            if (pct >= 0.50 && prevPct < 0.50) { earned += XP_MILESTONE_50; mt = 'Halfway Through The Galaxy! 50%'; triggerBoss('50%'); }
            if (pct >= 0.75 && prevPct < 0.75) { earned += XP_MILESTONE_75; mt = 'Almost There, Commander! 75%'; triggerBoss('75%'); }
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

                // Award XP directly — no RPC needed
                supabase.from('profiles').select('xp').eq('id', profile.id).single().then(({ data }) => {
                    if (data) {
                        supabase.from('profiles').update({ xp: (data.xp || 0) + earned }).eq('id', profile.id).then();
                    }
                });
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
            <header className="h-14 border-b border-[#2d2d3f] bg-[#0c0c16]/90 backdrop-blur flex items-center justify-between px-3 md:px-6 shrink-0 z-40 relative shadow-md shadow-black/50">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="material-symbols-outlined text-[#38bdf8] text-[20px] shrink-0">public</span>
                    <h2 className="font-bold text-xs md:text-sm truncate text-slate-200">{resource.title}</h2>
                </div>

                {/* Shields & XP */}
                <div className="flex items-center gap-2 md:gap-6 shrink-0">
                    <div className="flex gap-0.5 md:gap-1">
                        {[1, 2, 3].map(i => (
                            <span key={i} className={`material-symbols-outlined text-xs md:text-sm ${i <= shields ? 'text-[#38bdf8] drop-shadow-[0_0_5px_#38bdf8]' : 'text-[#2d2d3f]'}`}>
                                verified_user
                            </span>
                        ))}
                    </div>
                    <div className="text-[#ea580c] font-black text-xs md:text-sm drop-shadow-[0_0_5px_#ea580c]">+{xpEarned}<span className="hidden md:inline"> XP</span></div>
                    <button onClick={onAbort} className="text-[10px] md:text-xs font-bold text-slate-400 hover:text-red-400 uppercase tracking-wider md:tracking-widest transition-colors px-2 md:px-3 py-1.5 border border-transparent hover:border-red-500/30 rounded-lg whitespace-nowrap">
                        <span className="hidden md:inline">Abort Mission</span>
                        <span className="md:hidden">Abort</span>
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
                    <div className="absolute top-6 md:top-10 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-10 fade-in zoom-in duration-500 w-[90%] md:w-auto max-w-md">
                        <div className="bg-[#101022]/90 backdrop-blur-md border border-[#ea580c] px-6 md:px-10 py-3 md:py-4 rounded-2xl shadow-[0_0_40px_rgba(234,88,12,0.4)] text-center flex flex-col items-center">
                            <span className="material-symbols-outlined text-3xl md:text-4xl text-[#ea580c] mb-1">workspace_premium</span>
                            <h2 className="text-lg md:text-2xl font-black text-white">{milestone.text}</h2>
                            <p className="text-xs md:text-sm font-bold text-[#ea580c] uppercase tracking-widest mt-1">Keep Pushing Forward!</p>
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

                {/* Left 68%: PDF Canvas or Text View */}
                <main className="flex-1 lg:w-[68%] h-full bg-[#050510] relative flex flex-col border-r border-[#2d2d3f]">
                    {!isPdf && textPages.length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                            <div className="size-16 rounded-full border border-dashed border-[#ea580c] animate-spin border-t-transparent mx-auto mb-4" />
                            <div className="text-xs uppercase tracking-widest font-bold text-[#ea580c]">Entering Orbit...</div>
                        </div>
                    )}

                    {/* Scrollable Document Content */}
                    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide p-3 md:p-6 flex items-start justify-center">
                        <div className="w-full max-w-4xl">
                            {isPdf ? (
                                <canvas ref={canvasRef} className="bg-white max-w-full h-auto object-contain rounded-md shadow-xl mx-auto" />
                            ) : isPptx ? (() => {
                                const lines = textPages[currentPage - 1]?.split('\n').filter(l => l.trim()) ?? [];
                                const [title, ...bodyLines] = lines;
                                return (
                                    <div className="w-full flex flex-col rounded-2xl overflow-hidden shadow-2xl">
                                        {/* Slide Header */}
                                        <div className="shrink-0 bg-gradient-to-r from-[#1e1b4b] to-[#0c0c16] border-b-4 border-[#7c3aed] px-6 md:px-10 py-4 md:py-6">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="material-symbols-outlined text-[#7c3aed] text-base">slideshow</span>
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-[#7c3aed]">Slide {currentPage} / {numPages}</span>
                                            </div>
                                            <h2 className="text-white font-bold text-lg md:text-2xl leading-snug">
                                                {title || `Slide ${currentPage}`}
                                            </h2>
                                        </div>
                                        {/* Slide Body */}
                                        <div className="bg-[#101022]/90 border border-t-0 border-[#2d2d3f] px-6 md:px-10 py-6">
                                            {bodyLines.length > 0 ? (
                                                <ul className="space-y-3">
                                                    {bodyLines.map((line, i) => (
                                                        <li key={i} className="flex items-start gap-3 text-sm md:text-base text-slate-200 leading-relaxed">
                                                            <span className="mt-1.5 shrink-0 size-1.5 rounded-full bg-[#7c3aed]" />
                                                            <span>{line}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-slate-500 italic text-sm">No additional content on this slide.</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })() : isDocx ? (
                                <div className="bg-white w-full rounded-lg shadow-2xl overflow-hidden">
                                    <div className="bg-slate-100 border-b border-slate-200 px-6 md:px-10 py-2 flex items-center gap-2 text-xs text-slate-400 font-medium">
                                        <span className="material-symbols-outlined text-base text-slate-400">description</span>
                                        Page {currentPage} of {numPages}
                                    </div>
                                    <div className="px-8 md:px-14 py-8 md:py-10 text-slate-800">
                                        {textPages[currentPage - 1]?.split('\n').filter(l => l.trim()).map((line, i) => (
                                            <p key={i} className="text-sm md:text-base leading-7 mb-4 text-slate-700">{line}</p>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-[#101022]/80 backdrop-blur-xl border border-[#2d2d3f] rounded-2xl w-full shadow-2xl overflow-hidden">
                                    <div className="bg-[#0c0c16]/90 border-b border-[#2d2d3f] px-6 py-3 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[#38bdf8] text-base">article</span>
                                        <span className="text-[10px] font-black text-[#38bdf8] uppercase tracking-[0.3em] opacity-70">Sector {currentPage} / {numPages}</span>
                                    </div>
                                    <div className="px-6 md:px-10 py-6">
                                        {textPages[currentPage - 1]?.split('\n').filter(l => l.trim()).map((line, i) => (
                                            <p key={i} className="text-sm md:text-base leading-7 mb-4 text-slate-300">{line}</p>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pinned Navigation Bar — always visible, never scrolls */}
                    {numPages > 0 && (
                        <div className="shrink-0 border-t border-[#2d2d3f] bg-[#0c0c16]/90 backdrop-blur px-4 md:px-8 py-3 flex items-center justify-between gap-4 z-30">
                            <button
                                onClick={() => handleTurn(-1)}
                                disabled={currentPage <= 1}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#2d2d3f] bg-[#101022] hover:bg-[#1b1b2f] hover:border-[#38bdf8] text-slate-400 hover:text-[#38bdf8] transition-all disabled:opacity-20 disabled:cursor-not-allowed group text-sm font-bold"
                            >
                                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                                <span className="hidden sm:inline">Previous</span>
                            </button>

                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                                <span className="text-white font-black">{currentPage}</span>
                                <span>/</span>
                                <span>{numPages}</span>
                            </div>

                            <button
                                onClick={() => handleTurn(1)}
                                disabled={currentPage >= numPages}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#2d2d3f] bg-[#101022] hover:bg-[#1b1b2f] hover:border-[#ea580c] text-slate-400 hover:text-[#ea580c] transition-all disabled:opacity-20 disabled:cursor-not-allowed group text-sm font-bold shadow-[0_0_15px_rgba(234,88,12,0.05)] hover:shadow-[0_0_20px_rgba(234,88,12,0.3)]"
                            >
                                <span className="hidden sm:inline">Next</span>
                                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                            </button>
                        </div>
                    )}
                </main>


                {/* Right 32%: Mission Control (Desktop only) */}
                <aside className="hidden lg:flex w-[32%] h-full bg-[radial-gradient(ellipse_at_top,#141423,#050510)] p-8 flex-col relative z-10 overflow-y-auto shrink-0 [scrollbar-width:thin] [scrollbar-color:#2d2d3f_transparent]">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#38bdf8] mb-8 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px]">display_settings</span>
                        Mission Control
                    </h3>

                    <div className="flex-1 relative flex">
                        <div className="absolute left-6 top-6 bottom-6 w-1 bg-[#1a1a2e] rounded-full">
                            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-blue-600 via-[#38bdf8] to-[#ea580c] transition-all duration-700 shadow-[0_0_10px_#38bdf8] rounded-full"
                                style={{ height: shipBottom }} />
                            <div className="absolute -top-4 -left-[14px] size-8 rounded-full bg-[#1b1b2f] border-2 border-[#ea580c] shadow-[0_0_15px_rgba(234,88,12,0.5)] flex items-center justify-center text-xs">🪐</div>
                            {[25, 50, 75].map(pct => (
                                <div key={pct} className="absolute w-[18px] h-[4px] bg-[#38bdf8] -left-[8px] rounded-full shadow-[0_0_5px_#38bdf8]" style={{ bottom: `${pct}%` }} />
                            ))}
                            <div className="absolute -left-[18px] transition-all duration-700 ease-out z-20" style={{ bottom: shipBottom, transform: 'translateY(50%)' }}>
                                <div className="bg-[#101022] border border-[#38bdf8] rounded-full p-2 shadow-[0_0_15px_rgba(56,189,248,0.5)] relative">
                                    <span className="material-symbols-outlined text-[#38bdf8] text-sm -rotate-90">rocket_launch</span>
                                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-2 h-8 bg-gradient-to-t from-transparent to-[#ea580c] blur-sm opacity-60" />
                                </div>
                            </div>
                        </div>

                        <div className="ml-24 pt-12 flex flex-col gap-8 w-full">
                            <div>
                                <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Session Timer</div>
                                <div className="font-mono text-2xl font-black text-slate-200 tracking-wider">{formatTime(sessionSeconds)}</div>
                            </div>
                            <div>
                                <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Target Trajectory</div>
                                <div className="text-3xl font-black text-[#38bdf8] drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]">{Math.round(progressPct)}%</div>
                            </div>
                            <div className="mt-12 bg-gradient-to-br from-[#1e1b4b] to-[#0c0c16] border border-[#ea580c]/30 p-6 rounded-2xl shadow-xl shadow-[#ea580c]/10 relative group overflow-hidden">
                                <h4 className="text-[#ea580c] font-black text-xs uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[14px]">warning</span>
                                    Sector Anomaly Detected
                                </h4>
                                <p className="text-[10px] text-slate-400 font-bold mb-4 leading-relaxed group-hover:text-slate-300 transition-colors">
                                    A high-density knowledge rift has stabilized. Defeat the Nebula Beast to secure your data and earn bonus XP.
                                </p>
                                {resource.processing_status === 'ready' ? (
                                    <button onClick={() => {
                                        let readContent = '';
                                        if (isPdf) {
                                            const proportion = currentPage / numPages;
                                            const fullText = resource.content || '';
                                            readContent = fullText.substring(0, Math.floor(fullText.length * proportion));
                                        } else {
                                            readContent = textPages.slice(0, currentPage).join('\n');
                                        }
                                        if (readContent.length < 300) readContent = resource.content || '';
                                        onBossEncounter('Final Arena', readContent);
                                    }} className="w-full py-3 bg-[#ea580c] hover:bg-[#f97316] text-[#0c0c16] font-black text-[10px] uppercase tracking-widest rounded-xl transition-all active:scale-95">
                                        <span className="flex items-center justify-center gap-2">Engage Target <span className="material-symbols-outlined text-[16px]">rocket_launch</span></span>
                                    </button>
                                ) : resource.processing_status === 'error' ? (
                                    <div className="space-y-3">
                                        <div className="w-full py-3 bg-red-500/10 text-red-400 font-black text-[10px] uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 border border-red-500/30">
                                            <span className="material-symbols-outlined text-[16px]">error</span>Data Scan Failed
                                        </div>
                                        <p className="text-[9px] text-red-500/70 font-bold text-center leading-tight">The AI could not extract enough data from this sector. Try re-uploading a clearer version.</p>
                                    </div>
                                ) : (
                                    <div className="w-full py-3 bg-slate-800/50 text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 border border-slate-700/50 cursor-not-allowed">
                                        <div className="size-3 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                                        Scanning Sector...
                                    </div>
                                )}
                            </div>
                            <div className="bg-[#101022]/60 border border-[#2d2d3f] rounded-xl p-4 mt-auto mb-10 w-full relative overflow-hidden group">
                                <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1 mb-2">
                                    <span className="material-symbols-outlined text-[12px] text-red-500">warning</span>
                                    Next Waypoint
                                </div>
                                <div className="text-sm text-slate-300 font-medium">
                                    Boss Battle at <span className="text-white font-bold">{Math.ceil(currentPage / (numPages / 4)) * 25}%</span> mark.
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Mobile Bottom HUD */}
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
            </div>

            <style jsx global>{`
                @keyframes floatUp {
                    0% { transform: translateY(0) scale(0.8); opacity: 0; }
                    20% { transform: translateY(-20px) scale(1.2); opacity: 1; text-shadow: 0 0 20px #ea580c; }
                    80% { transform: translateY(-60px) scale(1); opacity: 1; }
                    100% { transform: translateY(-80px) scale(0.9); opacity: 0; }
                }
            `}</style>
        </div>
    );
}

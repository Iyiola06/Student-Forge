'use client';

import Link from 'next/link';
import TopNavigation from '@/components/layout/TopNavigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { jsPDF } from 'jspdf';

interface Resource {
    id: string;
    title: string;
    content: string;
}

interface ExamSnapshot {
    abbreviations: { short: string; full: string }[];
    key_points: { point: string; tag: string; color: string }[];
    hot_list: { question: string; difficulty: string; rationale: string }[];
}

export default function ExamReadyPage() {
    const [resources, setResources] = useState<Resource[]>([]);
    const [selectedResource, setSelectedResource] = useState<string>('');
    const [pastedText, setPastedText] = useState('');

    const [isGenerating, setIsGenerating] = useState(false);
    const [snapshotData, setSnapshotData] = useState<ExamSnapshot | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchResources() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from('resources')
                .select('id, title, content')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (data) setResources(data);
        }
        fetchResources();
    }, []);

    const handleGenerate = async () => {
        let contentToUse = pastedText;

        if (selectedResource) {
            const resource = resources.find(r => r.id === selectedResource);
            if (resource && resource.content) {
                contentToUse = resource.content;
            }
        }

        if (!contentToUse.trim()) {
            setError('Please select a resource or paste some text to generate an exam snapshot.');
            return;
        }

        setIsGenerating(true);
        setError(null);
        setSnapshotData(null);

        try {
            const response = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: contentToUse,
                    type: 'exam_snapshot'
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to generate content');
            }

            setSnapshotData(result.data);
            awardGenerationXP();

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const awardGenerationXP = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
            .from('profiles')
            .select('xp, level')
            .eq('id', user.id)
            .single();

        if (profile) {
            const newXp = profile.xp + 50; // High XP for exam prep
            const newLevel = Math.floor(Math.sqrt(newXp / 100)) + 1;

            await supabase
                .from('profiles')
                .update({ xp: newXp, level: newLevel > profile.level ? newLevel : profile.level })
                .eq('id', user.id);

            if (newLevel > profile.level) {
                alert(`Level Up! You are now level ${newLevel}!`);
            }
        }
    };

    const downloadPDF = () => {
        if (!snapshotData) return;

        const doc = new jsPDF();
        let y = 20;

        doc.setFontSize(18);
        doc.setTextColor(37, 37, 244);
        doc.text(`StudyForge Exam Snapshot`, 20, y);
        y += 15;

        // Abbreviations
        if (snapshotData.abbreviations && snapshotData.abbreviations.length > 0) {
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);
            doc.text("Abbreviations & Acronyms", 20, y);
            y += 8;

            doc.setFontSize(11);
            snapshotData.abbreviations.forEach(abbr => {
                doc.setFont('helvetica', 'bold');
                doc.text(`${abbr.short}:`, 20, y);
                doc.setFont('helvetica', 'normal');
                doc.text(abbr.full, 45, y);
                y += 6;
                if (y > 270) { doc.addPage(); y = 20; }
            });
            y += 10;
        }

        // Key Points
        if (snapshotData.key_points && snapshotData.key_points.length > 0) {
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text("High-Yield Facts", 20, y);
            y += 8;

            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            snapshotData.key_points.forEach(kp => {
                const lines = doc.splitTextToSize(`• [${kp.tag}] ${kp.point}`, 170);
                doc.text(lines, 20, y);
                y += (lines.length * 6) + 2;
                if (y > 270) { doc.addPage(); y = 20; }
            });
            y += 10;
        }

        // Hot List
        if (snapshotData.hot_list && snapshotData.hot_list.length > 0) {
            if (y > 230) { doc.addPage(); y = 20; }
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text("Examiner's Hot List", 20, y);
            y += 8;

            doc.setFontSize(11);
            snapshotData.hot_list.forEach((hl, i) => {
                doc.setFont('helvetica', 'bold');
                const qLines = doc.splitTextToSize(`${i + 1}. ${hl.question} (${hl.difficulty})`, 170);
                doc.text(qLines, 20, y);
                y += (qLines.length * 6);

                doc.setFont('helvetica', 'italic');
                doc.setTextColor(100, 100, 100);
                const rLines = doc.splitTextToSize(`Rationale: ${hl.rationale}`, 160);
                doc.text(rLines, 25, y);
                doc.setTextColor(0, 0, 0);

                y += (rLines.length * 6) + 5;
                if (y > 270) { doc.addPage(); y = 20; }
            });
        }

        doc.save(`exam_snapshot_${Date.now()}.pdf`);
    };

    const getTagColorClass = (colorStr: string) => {
        const colors: Record<string, string> = {
            blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
            orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
        };

        const cleanColor = colorStr.toLowerCase().trim();
        return colors[cleanColor] || 'bg-[#2525f4]/10 text-[#2525f4]';
    };

    const getDifficultyColor = (diff: string) => {
        const t = diff.toLowerCase();
        if (t.includes('easy')) return 'text-green-500';
        if (t.includes('hard') || t.includes('difficult')) return 'text-red-500';
        return 'text-orange-500';
    };

    return (
        <div className="bg-[#13131a] font-display min-h-screen flex flex-col antialiased selection:bg-[#3b3bfa]/30 selection:text-[#3b3bfa] text-white">
            <TopNavigation />

            <div className="flex-1 flex flex-col overflow-hidden w-full max-w-[1440px] mx-auto p-6 md:p-8">
                {isGenerating ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <div className="size-16 border-4 border-[#3b3bfa] border-t-transparent rounded-full animate-spin mb-6"></div>
                        <h3 className="text-xl font-bold text-white mb-2">Building Exam Snapshot</h3>
                        <p className="text-slate-400 max-w-sm">Generating abbreviations, extracting definition graphs, and predicting likely exam questions...</p>
                    </div>
                ) : !snapshotData ? (
                    /* Input State */
                    <div className="max-w-3xl mx-auto w-full mt-10">
                        <div className="bg-[#1a1a24] rounded-2xl border border-[#2d2d3f] p-8 shadow-sm">
                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#5b5bfa]">bolt</span>
                                Generate Exam Readiness Snapshot
                            </h2>

                            {error && (
                                <div className="mb-6 p-4 rounded-xl bg-red-900/10 border border-red-900/30 text-red-400 text-sm font-medium">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-2">Select Exam Syllabus / Notes:</label>
                                    <select
                                        value={selectedResource}
                                        onChange={(e) => {
                                            setSelectedResource(e.target.value);
                                            if (e.target.value) setPastedText('');
                                        }}
                                        className="w-full rounded-xl border border-[#2d2d3f] bg-[#13131a] p-4 text-sm focus:ring-2 focus:ring-[#3b3bfa] focus:outline-none text-white"
                                    >
                                        <option value="">-- Choose from library --</option>
                                        {resources.map(r => (
                                            <option key={r.id} value={r.id}>{r.title}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="relative py-2">
                                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                        <div className="w-full border-t border-[#2d2d3f]"></div>
                                    </div>
                                    <div className="relative flex justify-center">
                                        <span className="bg-[#1a1a24] px-4 text-xs font-bold text-slate-500 uppercase tracking-widest">OR</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-2">Paste chapter text here:</label>
                                    <textarea
                                        value={pastedText}
                                        onChange={(e) => {
                                            setPastedText(e.target.value);
                                            if (e.target.value) setSelectedResource('');
                                        }}
                                        className="w-full h-40 rounded-xl border border-[#2d2d3f] bg-[#13131a] p-4 text-sm focus:ring-2 focus:ring-[#3b3bfa] focus:outline-none text-white"
                                        placeholder="Paste content..."
                                    ></textarea>
                                </div>

                                <button
                                    onClick={handleGenerate}
                                    disabled={isGenerating}
                                    className="w-full bg-[#3b3bfa] hover:bg-[#3b3bfa]/90 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(59,59,250,0.3)] transition-all flex items-center justify-center gap-2 mt-4"
                                >
                                    <span className="material-symbols-outlined">auto_awesome</span>
                                    Generate Snapshot
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Dashboard View matching Screenshot 2 */
                    <div className="flex flex-col gap-6">
                        {/* Top Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Readiness Score Card */}
                            <div className="lg:col-span-8 bg-[#1a1a24] rounded-2xl border border-[#2d2d3f] p-6 lg:p-8 flex items-center gap-8 shadow-sm">
                                <div className="relative size-32 shrink-0 flex items-center justify-center">
                                    {/* Mock Circular Progress */}
                                    <svg className="size-full -rotate-90 transform" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="45" fill="none" stroke="#252535" strokeWidth="10" />
                                        <circle cx="50" cy="50" r="45" fill="none" stroke="#3b3bfa" strokeWidth="10" strokeDasharray="282.7" strokeDashoffset="70.6" className="drop-shadow-[0_0_8px_rgba(59,59,250,0.5)]" />
                                    </svg>
                                    <div className="absolute flex flex-col items-center justify-center">
                                        <span className="text-3xl font-black text-white">75%</span>
                                        <span className="text-[10px] font-bold text-slate-400 tracking-wider">READY</span>
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-2">
                                        <h2 className="text-2xl font-bold text-white">Exam Readiness Score</h2>
                                        <span className="bg-[#1a3826] text-[#4ade80] text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 border border-green-500/20">
                                            +5% <span className="text-[10px] opacity-80">this week</span>
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-400 mb-6 max-w-md leading-relaxed">
                                        You are on track for your Biology Finals. Keep pushing through the genetic variations module!
                                    </p>
                                    <div className="flex gap-4">
                                        <div className="bg-[#13131a] rounded-xl border border-[#2d2d3f] p-4 flex-1 text-center">
                                            <div className="text-xl font-black text-white mb-1">142</div>
                                            <div className="text-[10px] font-bold text-slate-500 tracking-wider">CARDS MASTERED</div>
                                        </div>
                                        <div className="bg-[#13131a] rounded-xl border border-[#2d2d3f] p-4 flex-1 text-center">
                                            <div className="text-xl font-black text-white mb-1">12</div>
                                            <div className="text-[10px] font-bold text-slate-500 tracking-wider">DAYS STREAK</div>
                                        </div>
                                        <div className="bg-[#13131a] rounded-xl border border-[#2d2d3f] p-4 flex-1 text-center">
                                            <div className="text-xl font-black text-white mb-1">4.5h</div>
                                            <div className="text-[10px] font-bold text-slate-500 tracking-wider">STUDY TIME</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions Right Side */}
                            <div className="lg:col-span-4 flex flex-col gap-4">
                                <Link href="/flashcards" className="flex-1 bg-[#3b3bfa] hover:bg-[#3b3bfa]/90 rounded-2xl flex flex-col items-center justify-center text-white transition-all shadow-[0_0_20px_rgba(59,59,250,0.3)] hover:scale-[1.02]">
                                    <span className="material-symbols-outlined text-3xl mb-2">shuffle</span>
                                    <span className="font-bold text-lg">Launch Shuffle Mode</span>
                                    <span className="text-xs text-white/70 mt-1">Review 50 random active cards</span>
                                </Link>
                                <div className="flex gap-4 h-24">
                                    <button onClick={downloadPDF} className="flex-1 bg-[#1a1a24] hover:bg-[#252535] rounded-2xl border border-[#2d2d3f] flex flex-col items-center justify-center text-slate-300 transition-all hover:text-white group">
                                        <span className="material-symbols-outlined text-xl mb-1 text-slate-500 group-hover:text-white transition-colors">download</span>
                                        <span className="text-sm font-bold">Download PDF</span>
                                    </button>
                                    <button onClick={() => setSnapshotData(null)} className="flex-1 bg-[#1a1a24] hover:bg-[#252535] rounded-2xl border border-[#2d2d3f] flex flex-col items-center justify-center text-slate-300 transition-all hover:text-white group">
                                        <span className="material-symbols-outlined text-xl mb-1 text-slate-500 group-hover:text-white transition-colors">add</span>
                                        <span className="text-sm font-bold">New Snapshot</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Section: 3 Columns */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Abbreviations Column */}
                            <div className="bg-[#1a1a24] rounded-2xl border border-[#2d2d3f] shadow-sm flex flex-col">
                                <div className="p-6 border-b border-[#2d2d3f] flex items-center justify-between">
                                    <h3 className="font-bold text-white flex items-center gap-2">
                                        <span className="text-[#3b3bfa] font-black tracking-widest text-sm">&lt;&gt;</span>
                                        Abbreviations Decoder
                                    </h3>
                                    <button className="text-slate-500 hover:text-white"><span className="material-symbols-outlined">more_horiz</span></button>
                                </div>
                                <div className="flex items-center px-6 py-3 border-b border-[#2d2d3f]/50 bg-[#13131a]/50">
                                    <span className="text-[10px] font-bold text-slate-500 tracking-wider flex-1">ABBREV</span>
                                    <span className="text-[10px] font-bold text-slate-500 tracking-wider flex-[2]">FULL MEANING</span>
                                </div>
                                <div className="flex-1 p-2">
                                    {snapshotData.abbreviations && snapshotData.abbreviations.length > 0 ? (
                                        <div className="space-y-1">
                                            {snapshotData.abbreviations.map((abbr, i) => (
                                                <div key={i} className="flex items-center px-4 py-3 hover:bg-[#252535] rounded-xl transition-colors">
                                                    <span className="text-[#3b3bfa] font-black text-sm flex-1">{abbr.short}</span>
                                                    <span className="text-sm text-slate-300 flex-[2] truncate" title={abbr.full}>{abbr.full}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-6 text-center text-sm text-slate-500">No abbreviations found.</div>
                                    )}
                                </div>
                                {snapshotData.abbreviations && snapshotData.abbreviations.length > 6 && (
                                    <button className="p-4 border-t border-[#2d2d3f] text-sm font-bold text-[#5b5bfa] hover:text-[#7b7bff] transition-colors w-full">
                                        View all {snapshotData.abbreviations.length} terms
                                    </button>
                                )}
                            </div>

                            {/* Key Points Column */}
                            <div className="bg-[#1a1a24] rounded-2xl border border-[#2d2d3f] shadow-sm flex flex-col">
                                <div className="p-6 border-b border-[#2d2d3f] flex items-center justify-between">
                                    <h3 className="font-bold text-white flex items-center gap-2">
                                        <span className="material-symbols-outlined text-yellow-500">lightbulb</span>
                                        Key Points Spotlight
                                    </h3>
                                    <button className="text-slate-500 hover:text-white"><span className="material-symbols-outlined">filter_list</span></button>
                                </div>
                                <div className="p-6 space-y-4 overflow-y-auto max-h-[500px]">
                                    {snapshotData.key_points && snapshotData.key_points.length > 0 ? (
                                        snapshotData.key_points.map((kp, i) => {
                                            const typeObj = i % 3 === 0
                                                ? { label: 'DEFINITION', color: 'border-purple-500/50', icon: 'visibility', textColor: 'text-purple-400' }
                                                : i % 3 === 1
                                                    ? { label: 'FORMULA', color: 'border-green-500/50', icon: 'functions', textColor: 'text-green-400' }
                                                    : { label: 'TIMELINE', color: 'border-orange-500/50', icon: 'event', textColor: 'text-orange-400' };

                                            return (
                                                <div key={i} className={`p-5 rounded-xl bg-[#13131a] border-l-2 ${typeObj.color} border-y border-r border-[#2d2d3f] hover:bg-[#1a1a24] transition-colors group cursor-pointer`}>
                                                    <div className="flex justify-between items-center mb-3">
                                                        <span className={`text-[10px] font-black uppercase tracking-wider ${typeObj.textColor}`}>{kp.tag || typeObj.label}</span>
                                                        <span className="material-symbols-outlined text-slate-600 text-[16px] group-hover:text-white transition-colors">{typeObj.icon}</span>
                                                    </div>
                                                    <h4 className="font-bold text-white mb-2 line-clamp-2">{kp.point}</h4>
                                                    <p className="text-sm text-slate-400 leading-relaxed line-clamp-3">
                                                        {kp.point}
                                                    </p>
                                                </div>
                                            )
                                        })
                                    ) : (
                                        <div className="text-center text-sm text-slate-500">No key points extracted.</div>
                                    )}
                                </div>
                            </div>

                            {/* Hot List Column */}
                            <div className="bg-[#1a1a24] rounded-2xl border border-[#2d2d3f] shadow-sm flex flex-col">
                                <div className="p-6 border-b border-[#2d2d3f] flex items-center justify-between">
                                    <h3 className="font-bold text-white flex items-center gap-2">
                                        <span className="material-symbols-outlined text-red-500">local_fire_department</span>
                                        Examiner's Hot List
                                    </h3>
                                    <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded border border-red-500/20 uppercase tracking-wide">High Probability</span>
                                </div>
                                <div className="p-6 space-y-2 overflow-y-auto max-h-[500px]">
                                    {snapshotData.hot_list && snapshotData.hot_list.length > 0 ? (
                                        snapshotData.hot_list.map((hl, i) => {
                                            const isHard = hl.difficulty.toLowerCase().includes('hard');
                                            const isEasy = hl.difficulty.toLowerCase().includes('easy');
                                            const diffColor = isHard ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                                : isEasy ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                                    : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';

                                            return (
                                                <div key={i} className="p-4 rounded-xl hover:bg-[#252535] transition-colors cursor-pointer group flex items-start gap-3">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="size-6 rounded-full bg-[#3b3bfa]/20 text-[#3b3bfa] font-black text-[10px] flex items-center justify-center shrink-0">{i + 1}</span>
                                                            <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${diffColor}`}>
                                                                {hl.difficulty}
                                                            </span>
                                                        </div>
                                                        <h4 className="text-sm font-bold text-white mb-1 leading-snug group-hover:text-[#5b5bfa] transition-colors">{hl.question}</h4>
                                                    </div>
                                                    <span className="material-symbols-outlined text-slate-600 group-hover:text-white transition-colors self-center">chevron_right</span>
                                                </div>
                                            )
                                        })
                                    ) : (
                                        <div className="text-center text-sm text-slate-500">No hot list formulated.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

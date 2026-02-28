'use client';

import React, { useState } from 'react';
import { StudyBreakdown, StudyChapter } from '@/types/ai';
import VoiceButton from './VoiceButton';
import { askFollowUpQuestion } from '@/lib/aiClient';

interface StudyBreakdownViewProps {
    breakdown: StudyBreakdown;
    sourceText: string;
    onStartQuiz: () => void;
    onRestart: () => void;
}

const ChapterChat: React.FC<{ chapter: StudyChapter; sourceText: string }> = ({ chapter, sourceText }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [question, setQuestion] = useState('');
    const [history, setHistory] = useState<{ role: 'user' | 'model'; parts: { text: string }[] }[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!question.trim() || isLoading) return;
        const userMsg = question.trim();
        setQuestion('');
        setHistory(prev => [...prev, { role: 'user', parts: [{ text: userMsg }] }]);
        setIsLoading(true);
        try {
            const content = chapter.keyPoints?.join('\n') || '';
            const res = await askFollowUpQuestion(userMsg, chapter.title, content, sourceText, history);
            setHistory(prev => [...prev, { role: 'model', parts: [{ text: res }] }]);
        } catch (err) {
            console.error(err);
        } finally { setIsLoading(false); }
    };

    if (!isOpen) return (
        <button onClick={() => setIsOpen(true)} className="mt-8 flex items-center gap-3 text-xs font-black uppercase text-orange-600 bg-orange-500/5 px-6 py-3 rounded-2xl border border-orange-500/10 hover:bg-orange-500/10 transition-all group">
            <span className="material-symbols-outlined text-sm group-hover:rotate-12 transition-transform">chat_bubble</span>
            Deep Dive with AI Tutor
        </button>
    );

    return (
        <div className="mt-10 bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div className="p-6 bg-slate-800/50 flex justify-between items-center border-b border-slate-700">
                <div className="flex items-center gap-3 font-black text-xs text-white uppercase tracking-widest">
                    <span className="material-symbols-outlined text-orange-500">school</span>
                    Context Session
                </div>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors p-2">
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>
            <div className="p-8 h-80 overflow-y-auto space-y-6 flex flex-col no-scrollbar">
                {history.map((msg, i) => (
                    <div key={i} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`max-w-[85%] px-5 py-4 rounded-2xl text-sm font-bold leading-relaxed ${msg.role === 'user' ? 'bg-[#ea580c] text-white rounded-br-none shadow-lg shadow-orange-500/20' : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'}`}>
                            {msg.parts[0].text}
                        </div>
                        <VoiceButton text={msg.parts[0].text} size="sm" />
                    </div>
                ))}
                {isLoading && (
                    <div className="flex gap-2 p-4 bg-slate-800/30 rounded-2xl w-fit animate-pulse transition-all">
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce delay-75"></div>
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce delay-150"></div>
                    </div>
                )}
            </div>
            <form onSubmit={handleSend} className="p-6 border-t border-slate-800 flex gap-4 bg-slate-800/20">
                <input
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                    placeholder="Clarify this concept..."
                    className="flex-grow bg-slate-800 text-white text-sm font-bold px-6 py-4 rounded-2xl border border-slate-700 outline-none focus:border-orange-500 transition-colors"
                />
                <button type="submit" disabled={!question.trim()} className="bg-[#ea580c] text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl shadow-orange-500/20 transition-all active:scale-90 hover:bg-orange-600 disabled:grayscale">
                    <span className="material-symbols-outlined font-black">send</span>
                </button>
            </form>
        </div>
    );
};

const StudyBreakdownView: React.FC<StudyBreakdownViewProps> = ({ breakdown, onStartQuiz, onRestart, sourceText }) => {
    return (
        <div className="max-w-5xl mx-auto px-4 pb-32 animate-in fade-in duration-1000">
            <div className="flex justify-between items-center mb-12">
                <button onClick={onRestart} className="px-6 py-3 bg-white dark:bg-[#1b1b27] rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 text-xs font-black text-slate-500 dark:text-slate-400 hover:text-orange-500 transition-all flex items-center gap-3">
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    RECONFIGURE SOURCE
                </button>
                <div className="bg-orange-500 text-white px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 shadow-xl shadow-orange-500/20">
                    <span className="material-symbols-outlined text-xs">verified</span>
                    ANALYSIS SECURED
                </div>
            </div>

            <div className="space-y-20">
                {/* Synthesis Header */}
                <div className="bg-white dark:bg-[#1b1b27] p-10 md:p-16 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50 group-hover:bg-orange-500/10 transition-colors duration-1000"></div>

                    <div className="flex items-center gap-4 text-orange-600 font-black uppercase text-xs tracking-[0.3em] mb-8">
                        <span className="material-symbols-outlined">auto_awesome</span>
                        Synthesis & Summary
                    </div>

                    <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-8 tracking-tight leading-tight max-w-3xl">
                        {breakdown.title}
                    </h2>

                    <p className="text-slate-600 dark:text-slate-400 text-xl font-bold leading-relaxed italic border-l-[12px] border-orange-500/20 pl-10 mb-12 relative">
                        <span className="text-orange-500 text-6xl absolute -left-6 -top-6 opacity-10 font-serif">"</span>
                        {breakdown.overallSummary}
                    </p>

                    <div className="flex flex-wrap gap-4">
                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                            <span className="material-symbols-outlined text-orange-500">schedule</span>
                            <span className="text-slate-900 dark:text-white font-black text-sm">{breakdown.estimatedStudyTimeMinutes} MINS INTENSITY</span>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                            <span className="material-symbols-outlined text-orange-500">list_alt</span>
                            <span className="text-slate-900 dark:text-white font-black text-sm">{breakdown.chapters.length} CHAPTERS EXTRACTED</span>
                        </div>
                    </div>
                </div>

                {/* Chapters Grid */}
                <div className="space-y-16">
                    {breakdown.chapters.map((chapter, idx) => (
                        <div key={idx} className="group/chapter animate-in fade-in slide-in-from-bottom-12 duration-1000" style={{ animationDelay: `${idx * 150}ms` }}>
                            <div className="flex items-center gap-6 mb-10 pl-2">
                                <div className="w-16 h-16 bg-[#ea580c] text-white rounded-3xl flex items-center justify-center text-2xl font-black shadow-2xl shadow-orange-500/30 group-hover/chapter:scale-110 transition-transform cursor-default">
                                    {idx + 1}
                                </div>
                                <h3 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">{chapter.title}</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Chapter Summary Card */}
                                <div className="md:col-span-2 bg-gradient-to-br from-[#1b1b27] to-[#101022] p-10 md:p-14 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group/card border border-white/5">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-20 pointer-events-none"></div>
                                    <div className="flex items-center justify-between mb-8 relative z-10">
                                        <div className="px-4 py-1.5 bg-orange-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[14px]">psychology</span>
                                            Core Concept
                                        </div>
                                        <VoiceButton text={`${chapter.title}. ${chapter.summary}`} size="md" />
                                    </div>
                                    <p className="text-xl md:text-2xl font-bold leading-relaxed text-slate-200 mb-8 relative z-10">{chapter.summary}</p>
                                </div>

                                {/* Key Points */}
                                {chapter.keyPoints.map((point, pIdx) => (
                                    <div key={pIdx} className="bg-white dark:bg-[#1b1b27] p-8 md:p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:border-orange-500/30 transition-all group/point">
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="w-10 h-10 bg-orange-50 dark:bg-orange-500/10 text-orange-600 rounded-xl flex items-center justify-center group-hover/point:scale-110 transition-transform">
                                                <span className="material-symbols-outlined text-sm font-black">bolt</span>
                                            </div>
                                            <VoiceButton text={point} size="sm" />
                                        </div>
                                        <p className="text-slate-800 dark:text-slate-200 font-bold leading-relaxed text-lg">{point}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Chapter Specific AI Tutor */}
                            <ChapterChat chapter={chapter} sourceText={sourceText} />
                        </div>
                    ))}
                </div>

                {/* Global Action */}
                <div className="pt-20 text-center">
                    <button
                        onClick={onStartQuiz}
                        className="px-16 h-20 bg-[#ea580c] text-white font-black text-xl rounded-full hover:bg-orange-600 transition-all shadow-2xl shadow-orange-500/30 active:scale-95 group flex items-center gap-6 mx-auto"
                    >
                        LAUNCH KNOWLEDGE ASSESSMENT
                        <span className="material-symbols-outlined group-hover:rotate-12 transition-transform font-black">auto_fix_high</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudyBreakdownView;

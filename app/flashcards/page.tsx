'use client';

import Link from 'next/link';
import Sidebar from '@/components/layout/Sidebar';
import CreditStatusBanner from '@/components/billing/CreditStatusBanner';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { z } from 'zod';
import { getBillingErrorMessage } from '@/lib/billing/client';

interface Resource {
    id: string;
    title: string;
    content: string;
}

interface Flashcard {
    front: string;
    back: string;
}

export default function FlashcardsPage() {
    const [resources, setResources] = useState<Resource[]>([]);
    const [selectedResource, setSelectedResource] = useState<string>('');
    const [pastedText, setPastedText] = useState('');

    const [isGeneratingDeck, setIsGeneratingDeck] = useState(false);
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [error, setError] = useState<string | null>(null);

    const { object, submit, isLoading: isStreaming, error: aiError } = useObject({
        api: '/api/ai/generate',
        schema: z.array(z.object({
            front: z.string(),
            back: z.string()
        })),
        onFinish: ({ object }) => {
            if (object) {
                setFlashcards(object as Flashcard[]);
            }
        }
    });

    useEffect(() => {
        if (aiError) setError(getBillingErrorMessage({ error: aiError.message }, aiError.message));
    }, [aiError]);

    const isGenerating = isStreaming || isGeneratingDeck;
    const displayCards = (isStreaming ? (object as Flashcard[]) : flashcards) || [];
    const [isSaving, setIsSaving] = useState(false);
    const [savedDeckId, setSavedDeckId] = useState<string | null>(null);
    const [savedDecks, setSavedDecks] = useState<any[]>([]);

    // Drill Mode State
    const [isDrilling, setIsDrilling] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    useEffect(() => {
        async function fetchInitialData() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch resources
            const { data: resData } = await supabase
                .from('resources')
                .select('id, title, content')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (resData) setResources(resData);

            // Fetch saved decks
            const { data: decksData } = await supabase
                .from('flashcards')
                .select('id, title, subject, created_at, flashcard_items(count)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (decksData) setSavedDecks(decksData);
        }
        fetchInitialData();
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
            setError('Please select a resource or paste some text to generate flashcards.');
            return;
        }

        setError(null);
        setFlashcards([]);
        setIsDrilling(false);
        setSavedDeckId(null);

        try {
            submit({
                content: contentToUse,
                type: 'flashcards',
                count: 10,
                stream: true
            });
        } catch (err: any) {
            setError(err.message);
        }
    };

    const startDrill = () => {
        setIsDrilling(true);
        setCurrentIndex(0);
        setIsFlipped(false);
    };

    const nextCard = () => {
        setIsFlipped(false);
        setTimeout(() => {
            if (currentIndex < flashcards.length - 1) {
                setCurrentIndex(currentIndex + 1);
            } else {
                // Finish drill
                setIsDrilling(false);
                alert("Drill completed! Great job.");
                // Can award more XP here
            }
        }, 300); // Wait for flip animation to finish
    };

    const saveDeck = async () => {
        const title = prompt("Enter a title for this deck:");
        if (!title) return;

        setIsSaving(true);
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { data: deck, error: deckError } = await supabase
                .from('flashcards')
                .insert({
                    user_id: user.id,
                    title,
                    resource_id: selectedResource || null,
                    subject: 'General'
                })
                .select().single();

            if (deckError) throw deckError;

            const itemsToInsert = flashcards.map(card => ({
                deck_id: deck.id,
                front_content: card.front,
                back_content: card.back,
                status: 'new',
                next_review_at: new Date().toISOString()
            }));

            const { error: itemsError } = await supabase
                .from('flashcard_items')
                .insert(itemsToInsert);

            if (itemsError) throw itemsError;

            alert("Deck saved successfully!");
            setSavedDeckId(deck.id);
        } catch (err: any) {
            alert("Error saving deck: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const loadSavedDeck = async (deckId: string) => {
        setIsGeneratingDeck(true);
        setError(null);
        setFlashcards([]);
        setIsDrilling(false);
        setSavedDeckId(deckId);

        try {
            const supabase = createClient();
            const { data, error: itemsError } = await supabase
                .from('flashcard_items')
                .select('front_content, back_content')
                .eq('deck_id', deckId);

            if (itemsError) throw itemsError;

            setFlashcards(data.map(d => ({ front: d.front_content, back: d.back_content })));
        } catch (err: any) {
            setError("Failed to load deck: " + err.message);
        } finally {
            setIsGeneratingDeck(false);
        }
    };

    return (
        <div className="bg-[#f5f5f8] dark:bg-[#101022] font-display min-h-screen flex flex-col md:flex-row antialiased selection:bg-[#1a5c2a]/30 selection:text-[#1a5c2a]">
            <Sidebar />
            <div className="flex-1 flex flex-col min-h-screen md:h-screen md:overflow-hidden min-w-0">
                <div className="px-6 pt-10 pb-6 md:px-8 border-b border-slate-200 dark:border-[#2d2d3f] bg-white dark:bg-[#1a1a24] shrink-0">
                    <div className="max-w-[1440px] mx-auto w-full">
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            <span className="material-symbols-outlined text-[#1a5c2a] bg-[#1a5c2a]/10 p-2 rounded-xl">style</span>
                            Smart Flashcards
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-3 font-medium">Generate high-fidelity flashcards from any resource using AI synthesis.</p>
                    </div>
                </div>

                <main className="flex-1 overflow-y-auto px-6 md:px-8 py-8 flex flex-col xl:flex-row gap-8 max-w-[1440px] mx-auto w-full pb-12">

                    {/* Left Panel: Configuration */}
                    {!isDrilling && (
                        <div className="w-full xl:w-[400px] shrink-0">
                            <div className="mb-6">
                                <CreditStatusBanner featureLabel="Flashcard generation" creditCost={40} />
                            </div>
                            <div className="bg-white/60 dark:bg-[#1a1a24]/60 backdrop-blur-2xl rounded-3xl border border-white/50 dark:border-[#1a5c2a]/20 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(26,92,42,0.05)] sticky top-0 transition-all duration-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_0_40px_rgba(26,92,42,0.15)] hover:border-[#1a5c2a]/30 group/panel">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/0 dark:from-white/5 dark:to-white/0 rounded-3xl pointer-events-none"></div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3 relative z-10">
                                    <div className="size-10 rounded-xl bg-gradient-to-br from-[#1a5c2a] to-[#22762f] shadow-lg shadow-[#1a5c2a]/30 flex items-center justify-center text-white">
                                        <span className="material-symbols-outlined text-[20px]">
                                            rocket_launch
                                        </span>
                                    </div>
                                    Deck Architect
                                </h2>

                                {error && (
                                    <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 relative z-10">
                                        <span className="material-symbols-outlined text-[18px]">error</span>
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-6 relative z-10">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 pl-1">
                                                Library Resource
                                            </label>
                                            <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700 animate-pulse"></span>
                                        </div>
                                        <div className="relative group">
                                            <div className="absolute inset-0 bg-gradient-to-r from-[#1a5c2a] to-[#22762f] rounded-xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
                                            <select
                                                value={selectedResource}
                                                onChange={(e) => {
                                                    setSelectedResource(e.target.value);
                                                    if (e.target.value) setPastedText('');
                                                }}
                                                className="w-full relative rounded-xl border-2 border-slate-200/60 dark:border-[#2d2d3f]/60 bg-white/50 dark:bg-[#13131a]/50 p-3.5 text-sm font-bold focus:ring-[#1a5c2a] focus:border-[#1a5c2a] focus:outline-none dark:text-white transition-all backdrop-blur-md appearance-none"
                                            >
                                                <option value="">-- Choose from vault --</option>
                                                {resources.map(r => (
                                                    <option key={r.id} value={r.id}>{r.title}</option>
                                                ))}
                                            </select>
                                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                                                <span className="material-symbols-outlined text-[20px]">expand_more</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative py-4 group/divider">
                                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                            <div className="w-full border-t border-dashed border-slate-300 dark:border-[#2d2d3f] group-hover/divider:border-[#1a5c2a]/30 transition-colors"></div>
                                        </div>
                                        <div className="relative flex justify-center">
                                            <span className="bg-white dark:bg-[#1a1a24] px-4 py-1 rounded-full text-[9px] font-black tracking-[0.3em] text-slate-400 uppercase shadow-sm border border-slate-100 dark:border-[#2d2d3f] group-hover/divider:text-[#1a5c2a] group-hover/divider:border-[#1a5c2a]/30 transition-all">Universal Input</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 pl-1">
                                                Raw Data / Notes
                                            </label>
                                            <span className="h-1 w-1 rounded-full bg-[#1a5c2a] animate-ping opacity-70"></span>
                                        </div>
                                        <div className="relative group">
                                            <div className="absolute inset-0 bg-gradient-to-r from-[#1a5c2a] to-[#22762f] rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
                                            <textarea
                                                value={pastedText}
                                                onChange={(e) => {
                                                    setPastedText(e.target.value);
                                                    if (e.target.value) setSelectedResource('');
                                                }}
                                                className="w-full relative h-[180px] rounded-2xl border-2 border-slate-200/60 dark:border-[#2d2d3f]/60 bg-white/50 dark:bg-[#13131a]/50 p-5 text-sm font-medium focus:ring-[#1a5c2a] focus:border-[#1a5c2a] focus:outline-none dark:text-white transition-all backdrop-blur-md resize-none custom-scrollbar leading-relaxed"
                                                placeholder="Engineered to extract facts from unstructured data..."
                                            ></textarea>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleGenerate}
                                        disabled={isGenerating}
                                        className="w-full mt-8 bg-gradient-to-r from-[#1a5c2a] to-[#22762f] hover:from-[#144823] hover:to-[#1a5c2a] disabled:opacity-70 text-white font-black py-4.5 rounded-2xl shadow-[0_10px_20px_-10px_rgba(26,92,42,0.6)] transition-all duration-300 active:scale-95 flex items-center justify-center gap-3 overflow-hidden group/btn relative"
                                    >
                                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] skew-x-[-20deg] group-hover/btn:animate-[sheen_1.5s_infinite]"></div>
                                        {isGenerating ? (
                                            <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <span className="material-symbols-outlined text-[20px] group-hover/btn:rotate-12 transition-transform drop-shadow-md">Auto_Awesome</span>
                                        )}
                                        <span className="tracking-wide">{isGenerating ? 'Synthesizing...' : 'Build Custom Deck'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Right Panel: Display / Drill Mode */}
                    <div className="flex-1 min-w-0">
                        {isGenerating && (!displayCards || displayCards.length === 0) ? (
                            <div className="h-full flex flex-col items-center justify-center text-center py-20 bg-white dark:bg-[#1a1a24] rounded-3xl border border-slate-200 dark:border-[#2d2d3f] shadow-inner">
                                <div className="relative mb-8">
                                    <div className="size-24 border-b-4 border-l-4 border-[#1a5c2a] rounded-full animate-spin"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-4xl text-[#1a5c2a] animate-pulse">neurology</span>
                                    </div>
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">AI Neural Synthesis</h3>
                                <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm">Distilling your material into the most potent cognitive anchors...</p>
                            </div>
                        ) : displayCards && displayCards.length > 0 ? (
                            isDrilling ? (
                                // Interactive Drill Mode
                                <div className="flex-1 flex flex-col items-center justify-start py-4 w-full h-full max-w-5xl mx-auto relative">
                                    {/* Dynamic Aura Background */}
                                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full aura-glow pointer-events-none z-0 ${isFlipped ? 'aura-highlight' : 'aura-base'}`}></div>

                                    <div className="w-full flex w-full max-w-3xl mx-auto flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-12 bg-white/60 dark:bg-[#1a1a24]/60 backdrop-blur-2xl p-4 md:p-6 rounded-[2rem] border border-white/50 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] relative z-10 gap-4">
                                        <div className="flex items-center gap-4 md:gap-8 w-full sm:w-auto flex-1">
                                            <div className="relative group flex-1">
                                                <div className="h-4 w-full bg-slate-100/50 dark:bg-[#13131a]/50 rounded-full overflow-hidden border border-slate-200/50 dark:border-white/5 shadow-inner backdrop-blur-sm">
                                                    <div className="h-full bg-gradient-to-r from-[#1a5c2a] to-[#22762f] shadow-[0_0_15px_rgba(26,92,42,0.5)] transition-all duration-700 ease-out relative" style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}>
                                                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                                    </div>
                                                </div>
                                                <div className="absolute -top-1.5 -right-1.5 size-4 bg-green-500 rounded-full animate-ping opacity-30"></div>
                                            </div>
                                            <div className="flex flex-col shrink-0 items-end">
                                                <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Sequencing</span>
                                                <span className="text-sm md:text-base font-black text-[#1a5c2a]">{currentIndex + 1} <span className="text-slate-300 dark:text-slate-600 px-1">/</span> {flashcards.length}</span>
                                            </div>
                                        </div>
                                        <div className="w-px h-8 bg-slate-200 dark:bg-white/10 hidden sm:block mx-2"></div>
                                        <button
                                            onClick={() => setIsDrilling(false)}
                                            className="px-5 md:px-6 py-3 cursor-pointer bg-slate-100/50 dark:bg-[#252535]/50 backdrop-blur-md text-slate-600 dark:text-slate-400 text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-red-500 hover:text-white dark:hover:bg-red-500 dark:hover:text-white transition-all duration-300 flex items-center gap-2 group border border-slate-200/50 dark:border-white/5 shadow-sm hover:shadow-red-500/20 w-full sm:w-auto justify-center"
                                        >
                                            <span className="material-symbols-outlined text-[16px] md:text-[18px] group-hover:rotate-90 transition-transform">close</span>
                                            Abort Session
                                        </button>
                                    </div>

                                    {/* 3D Flip Card */}
                                    <div
                                        className="w-full max-w-3xl h-[400px] md:h-[550px] [perspective:2000px] group/card cursor-pointer relative z-10"
                                        onClick={() => setIsFlipped(!isFlipped)}
                                    >
                                        <div className={`relative w-full h-full transition-transform duration-[800ms] [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
                                            {/* Front */}
                                            <div className="absolute top-0 left-0 w-full h-full [backface-visibility:hidden] [-webkit-backface-visibility:hidden] bg-white/90 dark:bg-[#1a1a24]/90 backdrop-blur-3xl border border-slate-200 dark:border-white/5 rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] p-8 md:p-16 flex flex-col items-center justify-center text-center transition-all group-hover/card:border-[#1a5c2a]/30 group-hover/card:shadow-[0_40px_80px_-20px_rgba(26,92,42,0.15)] overflow-hidden">
                                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#1a5c2a]/50 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-700"></div>

                                                <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-[#1a5c2a]/10 text-[#1a5c2a] px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.4em] border border-[#1a5c2a]/20 flex items-center gap-3 backdrop-blur-sm shadow-sm">
                                                    <span className="size-1.5 rounded-full bg-[#1a5c2a] animate-pulse"></span>
                                                    Insight Prompt
                                                    <span className="size-1.5 rounded-full bg-[#1a5c2a] animate-pulse" style={{ animationDelay: '0.5s' }}></span>
                                                </div>

                                                <div className="w-full max-h-full overflow-y-auto custom-scrollbar px-6 flex items-center justify-center h-full">
                                                    <p className="text-3xl md:text-5xl font-black text-slate-800 dark:text-white leading-[1.2] tracking-tight text-balance decoration-slate-200 dark:decoration-[#2d2d3f] underline-offset-8">
                                                        {flashcards[currentIndex].front}
                                                    </p>
                                                </div>

                                                <div className="absolute bottom-10 flex flex-col items-center gap-3 text-slate-400 dark:text-slate-500 hover:text-[#1a5c2a] dark:hover:text-[#1a5c2a] transition-colors text-[9px] font-black uppercase tracking-[0.3em] group/flip indicator">
                                                    <span className="material-symbols-outlined text-[24px] group-hover/flip:translate-y-1 transition-transform duration-300">swipe_down</span>
                                                    Click to Resolve
                                                </div>
                                            </div>

                                            {/* Back */}
                                            <div className="absolute w-full h-full [backface-visibility:hidden] [-webkit-backface-visibility:hidden] bg-[#f8fafc]/90 dark:bg-[#11111a]/95 backdrop-blur-3xl border border-[#1a5c2a]/50 rounded-[3rem] shadow-[0_0_80px_rgba(26,92,42,0.15)] p-8 md:p-16 flex flex-col items-center justify-center text-center [transform:rotateY(180deg)] holographic-sheen overflow-hidden">
                                                <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 blur-[80px] rounded-full pointer-events-none"></div>

                                                <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-green-500/10 text-green-600 dark:text-green-400 px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.4em] border border-green-500/20 flex items-center gap-3 backdrop-blur-sm shadow-sm">
                                                    <span className="size-1.5 rounded-full bg-green-500 animate-[ping_1.5s_infinite]"></span>
                                                    Neural Resolution
                                                    <span className="size-1.5 rounded-full bg-green-500 animate-[ping_1.5s_infinite]" style={{ animationDelay: '0.7s' }}></span>
                                                </div>

                                                <div className="w-full max-h-full overflow-y-auto custom-scrollbar px-6 flex flex-col items-center justify-center h-full pt-10 pb-8 text-left sm:text-center">
                                                    <p className="text-xl md:text-2xl text-slate-700 dark:text-slate-200 leading-relaxed font-bold tracking-tight text-balance">
                                                        {flashcards[currentIndex].back}
                                                    </p>
                                                </div>

                                                <div className="absolute bottom-8 right-10 opacity-20 group-hover/card:opacity-100 transition-opacity duration-700">
                                                    <span className="material-symbols-outlined text-[#1a5c2a] text-[60px] drop-shadow-lg">verified</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Controls (visible when flipped) */}
                                    <div className={`mt-8 md:mt-12 flex flex-col sm:flex-row justify-center gap-4 md:gap-6 transition-all duration-700 transform relative z-10 w-full max-w-2xl ${isFlipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
                                        <button onClick={(e) => { e.stopPropagation(); nextCard(); }} className="flex-1 px-8 py-5 md:py-6 rounded-2xl md:rounded-3xl bg-white/80 dark:bg-[#1a1a24]/80 backdrop-blur-sm text-slate-700 dark:text-white font-black text-[11px] uppercase tracking-[0.2em] hover:bg-slate-50 dark:hover:bg-[#2d2d3f] transition-all duration-300 flex items-center justify-center gap-3 border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-lg hover:-translate-y-1 group">
                                            <div className="size-8 rounded-full bg-slate-100 dark:bg-[#13131a] flex items-center justify-center group-hover:bg-[#1a5c2a]/10 group-hover:text-[#1a5c2a] transition-colors">
                                                <span className="material-symbols-outlined text-[18px]">retry</span>
                                            </div>
                                            Review Again
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); nextCard(); }} className="flex-1 px-8 py-5 md:py-6 rounded-2xl md:rounded-3xl bg-gradient-to-r from-green-500 to-[#1a5c2a] hover:from-green-400 hover:to-[#22762f] text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-[0_20px_40px_-10px_rgba(26,92,42,0.4)] transition-all duration-300 flex items-center justify-center gap-3 hover:-translate-y-1 active:scale-95 group relative overflow-hidden">
                                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] skew-x-[-20deg] group-hover:animate-[sheen_1.5s_infinite]"></div>
                                            <span className="material-symbols-outlined text-[24px] group-hover:rotate-12 transition-transform drop-shadow-md">verified_user</span>
                                            Mark Mastered
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // Deck Overview Mode
                                <div className="bg-white dark:bg-[#1a1a24] rounded-3xl border border-slate-200 dark:border-[#2d2d3f] p-8 shadow-sm flex-1 overflow-y-auto">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-8 border-b border-slate-100 dark:border-[#2d2d3f]">
                                        <div>
                                            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">AI Generated Deck</h2>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="bg-[#1a5c2a] text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">{displayCards.length} Integrated Cards</span>
                                                <span className="text-slate-400 font-medium text-xs">Ready for neural formatting</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            {savedDeckId ? (
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(`${window.location.origin}/shared/flashcard/${savedDeckId}`);
                                                        alert('Link copied to clipboard!');
                                                    }}
                                                    className="bg-[#1a5c2a] text-white hover:bg-[#d04e0a] px-6 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-[#1a5c2a]/20"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">share</span>
                                                    Share Deck
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={saveDeck}
                                                    disabled={isSaving}
                                                    className="bg-slate-100 dark:bg-[#252535] hover:bg-slate-200 dark:hover:bg-[#2d2d3f] text-slate-700 dark:text-slate-300 disabled:opacity-50 px-6 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-2 border border-slate-200 dark:border-[#2d2d3f]"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">save</span>
                                                    {isSaving ? 'Archiving...' : 'Secure to Vault'}
                                                </button>
                                            )}
                                            <button
                                                onClick={startDrill}
                                                className="bg-[#1a5c2a]/10 text-[#1a5c2a] hover:bg-[#1a5c2a] hover:text-white px-8 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-2 border border-[#1a5c2a]/20"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">play_circle</span>
                                                Start Drill Session
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-5">
                                        {displayCards.map((card, i) => (
                                            <div key={i} className="flex flex-col p-6 rounded-2xl border border-slate-100 dark:border-[#2d2d3f] bg-slate-50 dark:bg-[#13131a]/50 hover:border-[#1a5c2a]/30 hover:bg-white dark:hover:bg-[#1a1a24] transition-all group relative overflow-hidden shadow-sm hover:shadow-lg">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-[#1a5c2a]/20 group-hover:bg-[#1a5c2a] transition-all"></div>
                                                <div className="flex justify-between items-start mb-4">
                                                    <span className="text-[10px] font-black text-[#1a5c2a] uppercase tracking-wider bg-[#1a5c2a]/10 px-2 py-0.5 rounded">Prompt</span>
                                                    <span className="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-[#1b1b27] px-2 py-0.5 rounded border border-slate-200 dark:border-[#2d2d3f]">#{i + 1}</span>
                                                </div>
                                                <p className="font-black text-sm text-slate-900 dark:text-white mb-4 leading-snug">
                                                    {card?.front || <span className="animate-pulse bg-slate-200 dark:bg-slate-700 h-4 w-3/4 inline-block rounded"></span>}
                                                </p>
                                                <div className="mt-auto pt-4 border-t border-slate-200/50 dark:border-[#2d2d3f]/50">
                                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed italic block relative">
                                                        {card?.back || <span className="animate-pulse bg-slate-200 dark:bg-slate-700 h-4 w-full inline-block rounded"></span>}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        ) : (
                            // Ultra-Premium Empty State & Saved Decks
                            <div className="flex flex-col gap-10 h-full w-full max-w-6xl mx-auto">
                                <div className="bg-white/40 dark:bg-[#1a1a24]/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/50 dark:border-white/5 p-8 md:p-16 flex flex-col items-center justify-center text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(26,92,42,0.05)] relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#1a5c2a]/10 to-transparent blur-[80px] -mr-64 -mt-64 rounded-full pointer-events-none transition-all duration-1000 group-hover:bg-[#1a5c2a]/20"></div>
                                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-[#3b82f6]/10 to-transparent blur-[80px] -ml-64 -mb-64 rounded-full pointer-events-none transition-all duration-1000 group-hover:bg-[#3b82f6]/20"></div>

                                    <div className="relative z-10 p-1 mb-10 rounded-3xl bg-gradient-to-b from-white to-slate-100 dark:from-[#2d2d3f] dark:to-[#1a1a24] shadow-xl dark:shadow-none border border-white dark:border-[#2d2d3f]">
                                        <div className="bg-[#f8fafc] dark:bg-[#13131a] p-8 rounded-[1.4rem] shadow-inner relative overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-tr from-[#1a5c2a]/10 to-transparent"></div>
                                            <span className="material-symbols-outlined text-[80px] text-[#1a5c2a] drop-shadow-[0_0_20px_rgba(26,92,42,0.4)] relative z-10 animate-[pulse_4s_ease-in-out_infinite]">
                                                biotech
                                            </span>
                                        </div>
                                    </div>

                                    <h3 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight relative z-10 title-glow">Forge Your Flashcards</h3>
                                    <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xl mb-12 leading-relaxed text-base md:text-lg relative z-10">
                                        Our AI architect aggressively synthesizes your study materials into high-potency cognitive blocks engineered for long-term retention.
                                    </p>

                                    <div className="flex flex-wrap items-center justify-center gap-4 relative z-10">
                                        <div className="flex items-center gap-4 bg-white/60 dark:bg-[#13131a]/60 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/50 dark:border-white/5 shadow-sm">
                                            <div className="size-10 rounded-xl bg-[#1a5c2a]/10 border border-[#1a5c2a]/20 flex items-center justify-center text-[#1a5c2a]">
                                                <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                                            </div>
                                            <div className="flex flex-col text-left">
                                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#1a5c2a]">Phase 01</span>
                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Feed Input</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center text-slate-300 dark:text-[#2d2d3f]">
                                            <span className="material-symbols-outlined animate-pulse">arrow_forward</span>
                                        </div>
                                        <div className="flex items-center gap-4 bg-white/60 dark:bg-[#13131a]/60 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/50 dark:border-white/5 shadow-sm">
                                            <div className="size-10 rounded-xl bg-[#3b82f6]/10 border border-[#3b82f6]/20 flex items-center justify-center text-[#3b82f6]">
                                                <span className="material-symbols-outlined text-[20px]">psychology</span>
                                            </div>
                                            <div className="flex flex-col text-left">
                                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#3b82f6]">Phase 02</span>
                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">AI Synthesis</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center text-slate-300 dark:text-[#2d2d3f]">
                                            <span className="material-symbols-outlined animate-pulse" style={{ animationDelay: '0.2s' }}>arrow_forward</span>
                                        </div>
                                        <div className="flex items-center gap-4 bg-gradient-to-r from-orange-500/10 to-orange-500/5 dark:from-orange-500/20 dark:to-transparent backdrop-blur-md px-6 py-4 rounded-2xl border border-orange-500/20 shadow-sm">
                                            <div className="size-10 rounded-xl bg-orange-500 text-white shadow-lg shadow-orange-500/30 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-[20px]">bolt</span>
                                            </div>
                                            <div className="flex flex-col text-left">
                                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-600 dark:text-orange-400">Phase 03</span>
                                                <span className="text-sm font-bold text-slate-900 dark:text-white">Drill Mode</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {savedDecks.length > 0 && (
                                    <div className="bg-white/50 dark:bg-[#1a1a24]/50 backdrop-blur-3xl rounded-[2.5rem] border border-white/50 dark:border-white/5 p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] flex-1 relative z-20">
                                        <div className="flex items-center justify-between mb-8">
                                            <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                                <div className="p-2 rounded-xl bg-[#1a5c2a]/10 text-[#1a5c2a]">
                                                    <span className="material-symbols-outlined">sd_storage</span>
                                                </div>
                                                Vaulted Decks
                                            </h3>
                                            <div className="bg-slate-100 dark:bg-[#13131a] px-4 py-1.5 rounded-full border border-slate-200 dark:border-[#2d2d3f] flex items-center gap-2">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Total Cards</span>
                                                <span className="text-[10px] font-black text-[#1a5c2a] bg-[#1a5c2a]/10 px-2 py-0.5 rounded-md">
                                                    {savedDecks.reduce((sum, deck) => sum + (deck.flashcard_items?.[0]?.count || 0), 0)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                            {savedDecks.map((deck, idx) => (
                                                <div
                                                    key={deck.id}
                                                    onClick={() => loadSavedDeck(deck.id)}
                                                    className="cursor-pointer group relative bg-white dark:bg-[#161621] border-2 border-slate-200/50 dark:border-white/5 rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#1a5c2a]/40 shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(26,92,42,0.15)] overflow-hidden"
                                                    style={{ animationDelay: `${idx * 100}ms` }}
                                                >
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#1a5c2a]/10 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                                                    <div className="w-full relative z-10">
                                                        <div className="flex items-start justify-between mb-4">
                                                            <div className="bg-slate-50 dark:bg-[#13131a] size-12 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-[#2d2d3f] group-hover:bg-[#1a5c2a] group-hover:border-[#1a5c2a] transition-colors">
                                                                <span className="material-symbols-outlined text-slate-400 group-hover:text-white transition-colors">style</span>
                                                            </div>
                                                            <div className="flex flex-col items-end gap-1">
                                                                <span className="bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-[0.2em]">
                                                                    {deck.flashcard_items?.[0]?.count || 0} Cards
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <h4 className="font-bold text-lg text-slate-900 dark:text-white truncate mb-1 group-hover:text-[#1a5c2a] transition-colors">{deck.title}</h4>
                                                        <p className="text-xs font-semibold text-slate-500 dark:text-[#6b6b8a] truncate">{deck.subject}</p>
                                                    </div>

                                                    <div className="flex justify-between items-center w-full mt-6 pt-5 border-t border-slate-100 dark:border-white/5 relative z-10 group-hover:border-[#1a5c2a]/20 transition-colors">
                                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{new Date(deck.created_at).toLocaleDateString()}</span>
                                                        <span className="text-[#1a5c2a] text-[10px] font-black uppercase tracking-widest flex items-center gap-1 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                                                            Drill
                                                            <span className="material-symbols-outlined text-[14px]">play_circle</span>
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            <style jsx global>{`
                .aura-glow {
                    filter: blur(120px);
                    opacity: 0.15;
                    transition: all 1.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .dark .aura-glow {
                    opacity: 0.1;
                }
                .aura-base {
                    background: radial-gradient(circle, #3b82f6, transparent 70%);
                }
                .aura-highlight {
                    background: radial-gradient(circle, #1a5c2a, transparent 70%);
                    opacity: 0.25;
                }
                .dark .aura-highlight {
                    opacity: 0.15;
                }
                .holographic-sheen {
                    position: relative;
                    overflow: hidden;
                }
                .holographic-sheen::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(
                        125deg,
                        transparent 0%,
                        rgba(234, 88, 12, 0.03) 40%,
                        rgba(234, 88, 12, 0.05) 50%,
                        transparent 60%
                    );
                    pointer-events: none;
                }
            `}</style>
        </div>
    );
}

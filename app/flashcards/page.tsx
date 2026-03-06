'use client';

import Link from 'next/link';
import Sidebar from '@/components/layout/Sidebar';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

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

    const [isGenerating, setIsGenerating] = useState(false);
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [error, setError] = useState<string | null>(null);
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

        setIsGenerating(true);
        setError(null);
        setFlashcards([]);
        setIsDrilling(false);
        setSavedDeckId(null);

        try {
            const response = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: contentToUse,
                    type: 'flashcards',
                    count: 10
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to generate content');
            }

            setFlashcards(result.data);
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
            const newXp = (profile.xp || 0) + 30; // 30 XP for flashcards
            const newLevel = Math.floor(Math.sqrt(newXp / 100)) + 1;

            await supabase
                .from('profiles')
                .update({ xp: newXp, level: newLevel > (profile.level || 0) ? newLevel : profile.level })
                .eq('id', user.id);

            if (newLevel > (profile.level || 0)) {
                alert(`Level Up! You are now level ${newLevel}!`);
            }
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
        setIsGenerating(true);
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
            setIsGenerating(false);
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
                            <div className="bg-white dark:bg-[#1a1a24] rounded-2xl border border-slate-200 dark:border-[#2d2d3f] p-6 shadow-xl shadow-slate-200/50 dark:shadow-none sticky top-0 transition-all hover:border-[#1a5c2a]/30">
                                <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#1a5c2a]">
                                        rocket_launch
                                    </span>
                                    Deck Architect
                                </h2>

                                {error && (
                                    <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                                        <span className="material-symbols-outlined text-[18px]">error</span>
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 ml-1">
                                            Library Resource
                                        </label>
                                        <select
                                            value={selectedResource}
                                            onChange={(e) => {
                                                setSelectedResource(e.target.value);
                                                if (e.target.value) setPastedText('');
                                            }}
                                            className="w-full rounded-xl border border-slate-200 dark:border-[#2d2d3f] bg-[#f8fafc] dark:bg-[#13131a] p-3 text-sm font-bold focus:ring-2 focus:ring-[#1a5c2a] focus:outline-none dark:text-white transition-all hover:bg-white dark:hover:bg-[#1b1b27]"
                                        >
                                            <option value="">-- Choose from vault --</option>
                                            {resources.map(r => (
                                                <option key={r.id} value={r.id}>{r.title}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="relative py-2">
                                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                            <div className="w-full border-t border-slate-200 dark:border-[#2d2d3f]"></div>
                                        </div>
                                        <div className="relative flex justify-center">
                                            <span className="bg-white dark:bg-[#1a1a24] px-4 text-[10px] font-black tracking-widest text-slate-400 uppercase">Universal Input</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 ml-1">
                                            Raw Data / Notes
                                        </label>
                                        <textarea
                                            value={pastedText}
                                            onChange={(e) => {
                                                setPastedText(e.target.value);
                                                if (e.target.value) setSelectedResource('');
                                            }}
                                            className="w-full h-40 rounded-xl border border-slate-200 dark:border-[#2d2d3f] bg-[#f8fafc] dark:bg-[#13131a] p-4 text-sm font-medium focus:ring-2 focus:ring-[#1a5c2a] focus:outline-none dark:text-white transition-all hover:bg-white dark:hover:bg-[#1b1b27] resize-none"
                                            placeholder="Engineered to extract facts from unstructured data..."
                                        ></textarea>
                                    </div>

                                    <button
                                        onClick={handleGenerate}
                                        disabled={isGenerating}
                                        className="w-full mt-4 bg-[#1a5c2a] hover:bg-[#d04e0a] disabled:opacity-70 text-white font-black py-4 rounded-xl shadow-xl shadow-[#1a5c2a]/20 transition-all active:scale-95 flex items-center justify-center gap-3 group"
                                    >
                                        {isGenerating ? (
                                            <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">Auto_Awesome</span>
                                        )}
                                        {isGenerating ? 'Synthesizing...' : 'Build Custom Deck'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Right Panel: Display / Drill Mode */}
                    <div className="flex-1 min-w-0">
                        {isGenerating ? (
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
                        ) : flashcards.length > 0 ? (
                            isDrilling ? (
                                // Interactive Drill Mode
                                <div className="flex-1 flex flex-col items-center justify-start py-4 w-full h-full max-w-4xl mx-auto relative">
                                    {/* Dynamic Aura Background */}
                                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full aura-glow pointer-events-none z-0 ${isFlipped ? 'aura-highlight' : 'aura-base'}`}></div>

                                    <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-10 bg-white/80 dark:bg-[#1a1a24]/80 backdrop-blur-xl p-3 md:p-5 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-[#2d2d3f] shadow-2xl relative z-10 gap-3">
                                        <div className="flex items-center gap-3 md:gap-6 w-full sm:w-auto">
                                            <div className="relative group flex-1 sm:flex-none">
                                                <div className="h-3 w-full sm:w-64 bg-slate-100 dark:bg-[#13131a] rounded-full overflow-hidden border border-slate-200 dark:border-[#2d2d3f] shadow-inner">
                                                    <div className="h-full bg-gradient-to-r from-[#1a5c2a] to-[#b8963e] transition-all duration-700 ease-out relative" style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}>
                                                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                                    </div>
                                                </div>
                                                <div className="absolute -top-1 -right-1 size-3 bg-[#1a5c2a] rounded-full animate-ping opacity-50"></div>
                                            </div>
                                            <div className="flex flex-col shrink-0">
                                                <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Progress</span>
                                                <span className="text-xs md:text-sm font-black text-[#1a5c2a]">{currentIndex + 1} <span className="text-slate-400 opacity-50">/</span> {flashcards.length}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setIsDrilling(false)}
                                            className="px-4 md:px-5 py-2 md:py-2.5 bg-slate-100 dark:bg-[#252535] text-slate-600 dark:text-slate-400 text-[10px] md:text-[11px] font-black uppercase tracking-wider rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center gap-1.5 md:gap-2 group border border-slate-200 dark:border-[#2d2d3f] shadow-sm w-full sm:w-auto justify-center"
                                        >
                                            <span className="material-symbols-outlined text-[16px] md:text-[18px] group-hover:rotate-90 transition-transform">close</span>
                                            Abort Session
                                        </button>
                                    </div>

                                    {/* 3D Flip Card */}
                                    <div
                                        className="w-full max-w-2xl h-[350px] md:h-[500px] [perspective:2000px] group cursor-pointer relative z-10"
                                        onClick={() => setIsFlipped(!isFlipped)}
                                    >
                                        <div className={`relative w-full h-full transition-all duration-700 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
                                            {/* Front */}
                                            <div className="absolute top-0 left-0 w-full h-full [backface-visibility:hidden] [-webkit-backface-visibility:hidden] bg-white dark:bg-[#1a1a24] border-2 border-slate-200 dark:border-[#2d2d3f] rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] p-8 md:p-14 flex flex-col items-center justify-center text-center transition-all group-hover:border-[#1a5c2a]/50 ">
                                                <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-[#1a5c2a]/10 text-[#1a5c2a] px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-[#1a5c2a]/20 flex items-center gap-2">
                                                    <span className="size-1.5 rounded-full bg-[#1a5c2a] animate-pulse"></span>
                                                    Insight Prompt
                                                </div>
                                                <div className="w-full max-h-full overflow-y-auto custom-scrollbar px-4">
                                                    <p className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white leading-tight tracking-tight text-balance">
                                                        {flashcards[currentIndex].front}
                                                    </p>
                                                </div>
                                                <div className="absolute bottom-12 flex flex-col items-center gap-2 text-[#1a5c2a]/60 dark:text-[#1a5c2a]/40 text-[10px] font-black uppercase tracking-widest animate-bounce">
                                                    <span className="material-symbols-outlined text-lg">expand_circle_down</span>
                                                    FLIP TO RESOLVE
                                                </div>
                                            </div>

                                            {/* Back */}
                                            <div className="absolute w-full h-full [backface-visibility:hidden] [-webkit-backface-visibility:hidden] bg-white dark:bg-[#11111a] border-2 border-[#1a5c2a] rounded-[2.5rem] shadow-[0_0_80px_rgba(234,88,12,0.15)] p-8 md:p-14 flex flex-col items-center justify-center text-center [transform:rotateY(180deg)] holographic-sheen">
                                                <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-green-500/10 text-green-400 px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-green-500/20 flex items-center gap-2">
                                                    <span className="size-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                                    Neural Resolution
                                                </div>
                                                <div className="w-full max-h-full overflow-y-auto custom-scrollbar px-4">
                                                    <p className="text-xl md:text-2xl text-slate-900 dark:text-white/90 leading-relaxed font-bold tracking-tight text-balance">
                                                        {flashcards[currentIndex].back}
                                                    </p>
                                                </div>
                                                <div className="absolute bottom-10 opacity-20 group-hover:opacity-100 transition-opacity">
                                                    <span className="material-symbols-outlined text-slate-900 dark:text-white text-4xl">verified</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Controls (visible when flipped) */}
                                    <div className={`mt-6 md:mt-12 flex flex-col sm:flex-row gap-3 md:gap-6 transition-all duration-700 transform relative z-10 w-full max-w-2xl ${isFlipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
                                        <button onClick={nextCard} className="flex-1 px-6 md:px-10 py-4 md:py-5 rounded-2xl md:rounded-3xl bg-white dark:bg-[#1a1a24] text-slate-700 dark:text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-50 dark:hover:bg-[#2d2d3f] transition-all flex items-center justify-center gap-2 md:gap-3 border-2 border-slate-200 dark:border-[#2d2d3f] shadow-xl hover:shadow-2xl hover:-translate-y-1">
                                            <span className="material-symbols-outlined text-[#1a5c2a]">retry</span>
                                            Review Again
                                        </button>
                                        <button onClick={nextCard} className="flex-1 px-6 md:px-12 py-4 md:py-5 rounded-2xl md:rounded-3xl bg-green-500 hover:bg-green-400 text-[#0a0a0f] font-black text-xs uppercase tracking-[0.2em] shadow-[0_20px_40px_-10px_rgba(34,197,94,0.4)] transition-all flex items-center justify-center gap-2 md:gap-3 hover:-translate-y-1 active:scale-95 group">
                                            <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">verified_user</span>
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
                                                <span className="bg-[#1a5c2a] text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">{flashcards.length} Integrated Cards</span>
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
                                        {flashcards.map((card, i) => (
                                            <div key={i} className="flex flex-col p-6 rounded-2xl border border-slate-100 dark:border-[#2d2d3f] bg-slate-50 dark:bg-[#13131a]/50 hover:border-[#1a5c2a]/30 hover:bg-white dark:hover:bg-[#1a1a24] transition-all group relative overflow-hidden shadow-sm hover:shadow-lg">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-[#1a5c2a]/20 group-hover:bg-[#1a5c2a] transition-all"></div>
                                                <div className="flex justify-between items-start mb-4">
                                                    <span className="text-[10px] font-black text-[#1a5c2a] uppercase tracking-wider bg-[#1a5c2a]/10 px-2 py-0.5 rounded">Prompt</span>
                                                    <span className="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-[#1b1b27] px-2 py-0.5 rounded border border-slate-200 dark:border-[#2d2d3f]">#{i + 1}</span>
                                                </div>
                                                <p className="font-black text-sm text-slate-900 dark:text-white mb-4 leading-snug">
                                                    {card.front}
                                                </p>
                                                <div className="mt-auto pt-4 border-t border-slate-200/50 dark:border-[#2d2d3f]/50">
                                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed italic">
                                                        {card.back}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        ) : (
                            // Premium Empty State & Saved Decks
                            <div className="flex flex-col gap-8 h-full">
                                <div className="bg-white dark:bg-[#1a1a24] rounded-3xl border border-slate-200 dark:border-[#2d2d3f] p-6 md:p-12 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#1a5c2a]/5 blur-[100px] -mr-32 -mt-32 rounded-full pointer-events-none"></div>
                                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#3b3bfa]/5 blur-[100px] -ml-32 -mb-32 rounded-full pointer-events-none"></div>

                                    <div className="bg-[#f8fafc] dark:bg-[#13131a] p-8 rounded-[2.5rem] mb-8 border border-slate-100 dark:border-[#2d2d3f] shadow-inner relative z-10">
                                        <span className="material-symbols-outlined text-7xl text-[#1a5c2a] drop-shadow-[0_0_15px_rgba(234,88,12,0.3)]">
                                            biotech
                                        </span>
                                    </div>
                                    <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight relative z-10">Forge Your Flashcards</h3>
                                    <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm mb-10 leading-relaxed text-base relative z-10">
                                        Our AI architect synthesizes your study materials into high-potency cognitive blocks engineered for long-term retention.
                                    </p>
                                    <div className="flex gap-4 relative z-10">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="size-12 rounded-2xl bg-slate-50 dark:bg-[#13131a] flex items-center justify-center border border-slate-200 dark:border-[#2d2d3f]">
                                                <span className="material-symbols-outlined text-[#1a5c2a]">inventory_2</span>
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Step 1: Feed Input</span>
                                        </div>
                                        <div className="flex items-center text-slate-300 dark:text-slate-700">
                                            <span className="material-symbols-outlined">arrow_forward_ios</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="size-12 rounded-2xl bg-slate-50 dark:bg-[#13131a] flex items-center justify-center border border-slate-200 dark:border-[#2d2d3f]">
                                                <span className="material-symbols-outlined text-[#1a5c2a]">psychology</span>
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Step 2: AI Synthesis</span>
                                        </div>
                                        <div className="flex items-center text-slate-300 dark:text-slate-700">
                                            <span className="material-symbols-outlined">arrow_forward_ios</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="size-12 rounded-2xl bg-slate-50 dark:bg-[#13131a] flex items-center justify-center border border-slate-200 dark:border-[#2d2d3f]">
                                                <span className="material-symbols-outlined text-[#1a5c2a]">bolt</span>
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Step 3: Drill Mode</span>
                                        </div>
                                    </div>
                                </div>

                                {savedDecks.length > 0 && (
                                    <div className="bg-white dark:bg-[#1a1a24] rounded-3xl border border-slate-200 dark:border-[#2d2d3f] p-6 shadow-sm flex-1">
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[#1a5c2a]">folder_special</span>
                                            Saved Decks
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {savedDecks.map(deck => (
                                                <div key={deck.id} onClick={() => loadSavedDeck(deck.id)} className="cursor-pointer group bg-slate-50 dark:bg-[#13131a] border border-slate-200 dark:border-[#2d2d3f] rounded-2xl p-5 hover:border-[#1a5c2a]/50 hover:bg-white dark:hover:bg-[#1a1a24] transition-all flex flex-col justify-between items-start h-[140px] shadow-sm hover:shadow-md">
                                                    <div className="w-full">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h4 className="font-bold text-slate-900 dark:text-white truncate pr-2 group-hover:text-[#1a5c2a] transition-colors">{deck.title}</h4>
                                                            <span className="bg-[#1a5c2a]/10 text-[#1a5c2a] text-[10px] font-black px-2 py-0.5 rounded uppercase">{deck.flashcard_items?.[0]?.count || 0} Cards</span>
                                                        </div>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{deck.subject}</p>
                                                    </div>
                                                    <div className="flex justify-between items-center w-full mt-4 pt-4 border-t border-slate-200 dark:border-[#2d2d3f]">
                                                        <span className="text-[10px] font-medium text-slate-400">{new Date(deck.created_at).toLocaleDateString()}</span>
                                                        <span className="text-[#1a5c2a] text-xs font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all">Launch Drill <span className="material-symbols-outlined text-[14px]">arrow_forward</span></span>
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

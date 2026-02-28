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

    // Drill Mode State
    const [isDrilling, setIsDrilling] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

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
            setError('Please select a resource or paste some text to generate flashcards.');
            return;
        }

        setIsGenerating(true);
        setError(null);
        setFlashcards([]);
        setIsDrilling(false);

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
            const newXp = profile.xp + 30; // 30 XP for flashcards
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

    return (
        <div className="bg-[#f5f5f8] dark:bg-[#101022] font-display min-h-screen flex flex-col antialiased selection:bg-[#ea580c]/30 selection:text-[#ea580c]">
            <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
                
      </div>

            <div className="flex-1 flex flex-col overflow-hidden w-full max-w-[1440px] mx-auto">
                <div className="px-6 pt-6 pb-2 md:px-8">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#ea580c]">style</span>
                        Smart Flashcards
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Generate concise flashcards from your study materials in seconds.</p>
                </div>

                <main className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col lg:flex-row gap-8">

                    {/* Left Panel: Configuration */}
                    {!isDrilling && (
                        <div className="w-full lg:w-[400px] shrink-0 space-y-6">
                            <div className="bg-white dark:bg-[#1b1b27] rounded-xl border border-slate-200 dark:border-[#2d2d3f] p-6 shadow-sm">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#ea580c]">
                                        upload_file
                                    </span>
                                    Source Material
                                </h2>

                                {error && (
                                    <div className="mb-4 p-3 rounded bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Select Library Resource:
                                    </label>
                                    <select
                                        value={selectedResource}
                                        onChange={(e) => {
                                            setSelectedResource(e.target.value);
                                            if (e.target.value) setPastedText('');
                                        }}
                                        className="w-full rounded-lg border border-slate-300 dark:border-[#2d2d3f] bg-slate-50 dark:bg-[#111118] p-2.5 text-sm focus:ring-2 focus:ring-[#ea580c] focus:outline-none dark:text-white"
                                    >
                                        <option value="">-- Or paste text below --</option>
                                        {resources.map(r => (
                                            <option key={r.id} value={r.id}>{r.title}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mt-4 relative">
                                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                        <div className="w-full border-t border-slate-300 dark:border-[#2d2d3f]"></div>
                                    </div>
                                    <div className="relative flex justify-center">
                                        <span className="bg-white dark:bg-[#1b1b27] px-2 text-sm text-slate-500">OR</span>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Paste Note Excerpt:
                                    </label>
                                    <textarea
                                        value={pastedText}
                                        onChange={(e) => {
                                            setPastedText(e.target.value);
                                            if (e.target.value) setSelectedResource('');
                                        }}
                                        className="w-full h-32 rounded-lg border border-slate-300 dark:border-[#2d2d3f] bg-slate-50 dark:bg-[#111118] p-3 text-sm focus:ring-2 focus:ring-[#ea580c] focus:outline-none dark:text-white"
                                        placeholder="Paste text here to extract key concepts..."
                                    ></textarea>
                                </div>

                                <button
                                    onClick={handleGenerate}
                                    disabled={isGenerating}
                                    className="w-full mt-6 bg-[#ea580c] hover:bg-[#ea580c]/90 disabled:opacity-70 text-white font-bold py-3 rounded-xl shadow-lg shadow-[#ea580c]/25 transition-all flex items-center justify-center gap-2"
                                >
                                    {isGenerating ? (
                                        <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <span className="material-symbols-outlined">auto_awesome</span>
                                    )}
                                    {isGenerating ? 'Building Deck...' : 'Generate Deck'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Right Panel: Display / Drill Mode */}
                    <div className="flex-1 flex flex-col">
                        {isGenerating ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center">
                                <div className="size-16 border-4 border-[#ea580c] border-t-transparent rounded-full animate-spin mb-6"></div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Analyzing Concepts</h3>
                                <p className="text-slate-500 dark:text-[#9c9cba]">Extracting the most critical terminology and definitions...</p>
                            </div>
                        ) : flashcards.length > 0 ? (
                            isDrilling ? (
                                // Interactive Drill Mode
                                <div className="flex-1 flex flex-col items-center justify-center py-10 w-full max-w-3xl mx-auto">
                                    <div className="w-full flex justify-between items-center mb-8 px-4">
                                        <span className="text-sm font-bold text-slate-500">Card {currentIndex + 1} of {flashcards.length}</span>
                                        <button
                                            onClick={() => setIsDrilling(false)}
                                            className="text-sm text-[#ea580c] font-bold hover:underline"
                                        >
                                            Exit Drill
                                        </button>
                                    </div>

                                    {/* 3D Flip Card */}
                                    <div
                                        className="w-full max-w-2xl h-[400px] perspective-1000 group cursor-pointer"
                                        onClick={() => setIsFlipped(!isFlipped)}
                                    >
                                        <div className={`relative w-full h-full transition-transform duration-700 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                                            {/* Front */}
                                            <div className="absolute w-full h-full backface-hidden bg-white dark:bg-[#1b1b27] border-2 border-slate-200 dark:border-[#2d2d3f] rounded-2xl shadow-xl p-10 flex flex-col items-center justify-center text-center hover:border-[#ea580c] transition-colors">
                                                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                                    {flashcards[currentIndex].front}
                                                </p>
                                                <div className="absolute bottom-6 flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                                                    <span className="material-symbols-outlined text-[18px]">ads_click</span>
                                                    Click to reveal
                                                </div>
                                            </div>

                                            {/* Back */}
                                            <div className="absolute w-full h-full backface-hidden bg-slate-900 border-2 border-[#ea580c] rounded-2xl shadow-xl p-10 flex flex-col items-center justify-center text-center rotate-y-180">
                                                <p className="text-xl text-slate-900 dark:text-white leading-relaxed">
                                                    {flashcards[currentIndex].back}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Controls (visible when flipped) */}
                                    <div className={`mt-10 flex gap-4 transition-opacity duration-300 ${isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                                        <button onClick={nextCard} className="px-6 py-3 rounded-lg bg-slate-200 dark:bg-[#252535] text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-300 dark:hover:bg-[#3b3b54] transition-colors">
                                            Review Again
                                        </button>
                                        <button onClick={nextCard} className="px-6 py-3 rounded-lg bg-green-500 hover:bg-green-600 text-slate-900 dark:text-white font-bold shadow-lg shadow-green-500/20 transition-all">
                                            Got It
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // Deck Overview Mode
                                <div className="bg-white dark:bg-[#1b1b27] rounded-xl border border-slate-200 dark:border-[#2d2d3f] p-6 shadow-sm flex-1 overflow-y-auto">
                                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-[#2d2d3f]">
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Generated Deck</h2>
                                            <p className="text-slate-500 text-sm mt-1">{flashcards.length} cards extracted</p>
                                        </div>
                                        <button
                                            onClick={startDrill}
                                            className="bg-[#ea580c] hover:bg-[#ea580c]/90 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-[#ea580c]/20 transition-all flex items-center gap-2"
                                        >
                                            <span className="material-symbols-outlined">play_arrow</span>
                                            Shuffle & Drill
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {flashcards.map((card, i) => (
                                            <div key={i} className="p-4 rounded-xl border border-slate-200 dark:border-[#3b3b54] bg-slate-50 dark:bg-[#252535] group">
                                                <p className="font-bold text-sm text-[#ea580c] mb-2 border-b border-slate-200 dark:border-[#3b3b54] pb-2">
                                                    {card.front}
                                                </p>
                                                <p className="text-sm text-slate-700 dark:text-slate-300">
                                                    {card.back}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        ) : (
                            // Empty State
                            <div className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-[#252535] dark:to-[#1b1b27] rounded-xl border border-dashed border-slate-300 dark:border-[#2d2d3f] p-10 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
                                <div className="bg-white dark:bg-[#1b1b27] p-5 rounded-full mb-4 shadow-sm">
                                    <span className="material-symbols-outlined text-5xl text-[#ea580c]">
                                        style
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Ready to Memorize?</h3>
                                <p className="text-slate-500 dark:text-[#9c9cba] max-w-sm mb-6">
                                    Select a resource or paste in your notes. Our AI will extract the most important facts and terminology into interactive flashcards.
                                </p>
                            </div>
                        )}
                    </div>

                </main>
            </div>
        </div>
    );
}

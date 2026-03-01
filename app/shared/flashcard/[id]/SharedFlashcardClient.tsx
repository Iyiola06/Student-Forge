'use client';

import { useState } from 'react';
import Link from 'next/link';

interface SharedFlashcardClientProps {
    deck: { title: string; subject: string };
    flashcards: any[];
}

export default function SharedFlashcardClient({ deck, flashcards }: SharedFlashcardClientProps) {
    const [isDrilling, setIsDrilling] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

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
                setIsDrilling(false);
            }
        }, 300);
    };

    return (
        <div className="bg-[#f5f5f8] dark:bg-[#101022] font-display min-h-screen flex flex-col antialiased selection:bg-[#ea580c]/30 selection:text-[#ea580c]">
            <div className="flex-1 flex flex-col overflow-hidden w-full max-w-[1440px] mx-auto">
                {/* Header */}
                <div className="px-6 pt-10 pb-6 md:px-8 flex items-center justify-between border-b border-slate-200 dark:border-[#2d2d3f]">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="size-10 bg-[#ea580c]/10 text-[#ea580c] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-2xl">school</span>
                        </div>
                        <h2 className="text-slate-900 dark:text-white text-xl font-bold tracking-tight">
                            StudyForge Shared Deck
                        </h2>
                    </Link>
                </div>

                <main className="flex-1 overflow-y-auto p-6 md:p-8 flex items-center justify-center">
                    {!isDrilling ? (
                        <div className="bg-white dark:bg-[#1b1b27] rounded-2xl border border-slate-200 dark:border-[#2d2d3f] p-10 text-center shadow-lg w-full max-w-2xl">
                            <div className="inline-flex size-24 bg-orange-500/10 rounded-full items-center justify-center mb-6">
                                <span className="material-symbols-outlined text-5xl text-[#ea580c]">style</span>
                            </div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{deck.title}</h1>
                            <p className="text-slate-500 dark:text-[#9c9cba] mb-8 text-lg">
                                {deck.subject || 'General'} • {flashcards.length} Cards
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button
                                    onClick={startDrill}
                                    className="bg-[#ea580c] hover:bg-[#ea580c]/90 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-[#ea580c]/25 transition-all w-full sm:w-auto flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined">play_arrow</span>
                                    Start Flashcards Drill
                                </button>
                                <Link
                                    href="/signup"
                                    className="bg-slate-100 dark:bg-[#252535] hover:bg-slate-200 dark:hover:bg-[#2d2d3f] text-slate-700 dark:text-slate-300 px-8 py-4 rounded-xl font-bold text-lg transition-all w-full sm:w-auto"
                                >
                                    Create Free Account
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full flex flex-col items-center animate-in fade-in zoom-in duration-500">
                            {/* Header */}
                            <div className="w-full max-w-2xl mb-8 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="bg-[#ea580c] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm shadow-[#ea580c]/30">
                                        Card {currentIndex + 1} of {flashcards.length}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setIsDrilling(false)}
                                    className="text-slate-400 hover:text-red-500 transition-colors bg-white dark:bg-[#1b1b27] hover:bg-red-50 dark:hover:bg-red-500/10 p-2 rounded-full border border-slate-200 dark:border-[#2d2d3f]"
                                    title="Exit Drill"
                                >
                                    <span className="material-symbols-outlined">close</span>
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
                                <button onClick={nextCard} className="px-8 py-4 rounded-xl bg-slate-200 dark:bg-[#252535] text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-300 dark:hover:bg-[#3b3b54] transition-colors">
                                    Next Card
                                </button>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

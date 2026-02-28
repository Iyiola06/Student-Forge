'use client';

import React, { useState } from 'react';

interface VoiceButtonProps {
    text: string;
    size?: 'sm' | 'md' | 'lg';
}

const VoiceButton: React.FC<VoiceButtonProps> = ({ text, size = 'md' }) => {
    const [isPlaying, setIsPlaying] = useState(false);

    const speak = () => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            if (isPlaying) {
                window.speechSynthesis.cancel();
                setIsPlaying(false);
                return;
            }

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.onend = () => setIsPlaying(false);
            utterance.onerror = () => setIsPlaying(false);

            setIsPlaying(true);
            window.speechSynthesis.speak(utterance);
        }
    };

    const dims = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-14 h-14' : 'w-10 h-10';
    const iconSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-2xl' : 'text-lg';

    return (
        <button
            onClick={(e) => { e.stopPropagation(); speak(); }}
            className={`${dims} rounded-xl flex items-center justify-center transition-all ${isPlaying
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 scale-110 active:scale-95'
                    : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 border border-slate-100 dark:border-slate-800 active:scale-95'
                }`}
            title={isPlaying ? "Stop Text-to-Speech" : "Read Aloud"}
        >
            <span className={`material-symbols-outlined ${iconSize} ${isPlaying ? 'font-black scale-110' : ''}`}>
                {isPlaying ? 'graphic_eq' : 'volume_up'}
            </span>
        </button>
    );
};

export default VoiceButton;

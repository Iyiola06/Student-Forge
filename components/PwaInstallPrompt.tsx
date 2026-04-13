'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

export default function PwaInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // 1. Check if the app is already installed or running as standalone
        const checkStandalone = () => {
            if (typeof window !== 'undefined') {
                const isAppMode = window.matchMedia('(display-mode: standalone)').matches
                    || (window.navigator as any).standalone
                    || document.referrer.includes('android-app://');

                setIsStandalone(isAppMode);

                // If they're already in the app, do nothing
                if (isAppMode) return;

                // If they previously dismissed the prompt, don't show it again for 7 days
                const lastDismissed = localStorage.getItem('pwa_prompt_dismissed');
                if (lastDismissed) {
                    const daysSinceDismissed = (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24);
                    if (daysSinceDismissed < 7) {
                        return;
                    }
                }
            }
        };

        checkStandalone();

        // 2. Listen for the native install prompt event
        const handleBeforeInstallPrompt = (e: Event) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();

            // If they already installed it, don't show
            if (isStandalone) return;

            // If they dismissed it recently, don't show
            const lastDismissed = localStorage.getItem('pwa_prompt_dismissed');
            if (lastDismissed) {
                const daysSinceDismissed = (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24);
                if (daysSinceDismissed < 7) return;
            }

            // Stash the event so it can be triggered later.
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            // Show our custom UI
            setShowPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // 3. Listen for successful installation
        window.addEventListener('appinstalled', () => {
            setDeferredPrompt(null);
            setShowPrompt(false);
            setIsStandalone(true);
            console.log('[PWA] App was officially installed');
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, [isStandalone]);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the native install prompt
        await deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setShowPrompt(false);

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
            // If they explicitly reject the OS prompt, mark as dismissed
            localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        // Don't ask again for 7 days
        localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
    };

    if (!showPrompt) return null;

    return (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center items-center p-4 sm:p-0 pointer-events-none">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto sm:hidden" onClick={handleDismiss} />

            <div className="relative w-full max-w-sm bg-white dark:bg-[#161621] border border-slate-200 dark:border-[#2d2d3f] rounded-3xl p-6 shadow-2xl pointer-events-auto transform transition-all animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-4">

                {/* Close Button */}
                <button
                    onClick={handleDismiss}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                </button>

                {/* Content */}
                <div className="flex flex-col items-center text-center">
                    <div className="relative size-20 rounded-2xl shadow-lg border-4 border-white dark:border-[#101022] overflow-hidden bg-white mb-4">
                        <Image
                            src="/apple-touch-icon.png"
                            alt="VUI Studify App Icon"
                            fill
                            className="object-contain p-1"
                        />
                    </div>

                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                        Install VUI Studify
                    </h3>

                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-6">
                        Add our app to your home screen for faster access, offline mode, and a full-screen study experience.
                    </p>

                    <div className="flex flex-col w-full gap-3">
                        <button
                            onClick={handleInstallClick}
                            className="w-full flex items-center justify-center gap-2 bg-[#1a5c2a] hover:bg-[#144823] text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-[#1a5c2a]/30 active:scale-95"
                        >
                            <span className="material-symbols-outlined text-[20px]">download</span>
                            Install App
                        </button>
                        <button
                            onClick={handleDismiss}
                            className="w-full py-3 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                        >
                            Maybe Later
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

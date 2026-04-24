'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { applyTheme, getStoredTheme, readThemeFromDom, THEME_CHANGE_EVENT } from '@/lib/theme';

export default function ThemeToggle() {
    const [isDark, setIsDark] = useState(() => readThemeFromDom() === 'dark');

    useEffect(() => {
        const syncTheme = () => {
            setIsDark(readThemeFromDom() === 'dark');
        };

        syncTheme();

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleSystemThemeChange = () => {
            if (!getStoredTheme()) {
                syncTheme();
            }
        };
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === 'theme') {
                syncTheme();
            }
        };

        mediaQuery.addEventListener('change', handleSystemThemeChange);
        window.addEventListener(THEME_CHANGE_EVENT, syncTheme as EventListener);
        window.addEventListener('storage', handleStorageChange);

        return () => {
            mediaQuery.removeEventListener('change', handleSystemThemeChange);
            window.removeEventListener(THEME_CHANGE_EVENT, syncTheme as EventListener);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const toggleTheme = () => {
        const nextTheme = isDark ? 'light' : 'dark';
        applyTheme(nextTheme);
        setIsDark(nextTheme === 'dark');
    };

    return (
        <button
            onClick={toggleTheme}
            className="inline-flex size-10 items-center justify-center rounded-2xl border border-black/8 bg-white/70 text-slate-600 transition-all duration-300 hover:border-[#163f73]/20 hover:bg-white hover:text-[#163f73] active:scale-95 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-[#f39a2b]/20 dark:hover:bg-white/8 dark:hover:text-[#f6b252]"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            {isDark ? (
                <Sun className="w-5 h-5 animate-in zoom-in spin-in-90 duration-500" />
            ) : (
                <Moon className="w-5 h-5 animate-in zoom-in spin-in-90 duration-500" />
            )}
        </button>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { applyTheme, getStoredTheme, readThemeFromDom, THEME_CHANGE_EVENT } from '@/lib/theme';

export default function ThemeToggle() {
    const [isDark, setIsDark] = useState(false);

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
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--card-glass)] text-[var(--text-body)] shadow-[var(--shadow-sm)] backdrop-blur-md transition-all duration-300 hover:text-[var(--text-strong)] active:scale-95"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            {isDark ? (
                <Sun className="w-[18px] h-[18px] animate-in zoom-in spin-in-90 duration-500" />
            ) : (
                <Moon className="w-[18px] h-[18px] animate-in zoom-in spin-in-90 duration-500" />
            )}
        </button>
    );
}

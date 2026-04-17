'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        setIsDark(document.documentElement.classList.contains('dark'));
    }, []);

    const toggleTheme = () => {
        const newDark = !isDark;
        setIsDark(newDark);
        if (newDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    return (
        <button
            onClick={toggleTheme}
            className="inline-flex size-10 items-center justify-center rounded-2xl border border-black/8 bg-white/70 text-slate-600 transition-all duration-300 hover:border-[#163f73]/20 hover:text-[#163f73] active:scale-95 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-[#f39a2b]/20 dark:hover:text-[#f6b252]"
            aria-label="Toggle Theme"
        >
            {isDark ? (
                <Sun className="w-5 h-5 animate-in zoom-in spin-in-90 duration-500" />
            ) : (
                <Moon className="w-5 h-5 animate-in zoom-in spin-in-90 duration-500" />
            )}
        </button>
    );
}

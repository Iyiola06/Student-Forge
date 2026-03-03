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
            className="p-2 rounded-xl bg-slate-100 dark:bg-[#1b1b27] text-slate-600 dark:text-[#9c9cba] hover:text-[#ea580c] dark:hover:text-[#ea580c] transition-all duration-300 border border-transparent hover:border-slate-200 dark:hover:border-[#2d2d3f] shadow-sm active:scale-95"
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

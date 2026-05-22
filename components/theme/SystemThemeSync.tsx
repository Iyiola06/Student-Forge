'use client';

import { useEffect } from 'react';
import { getStoredTheme, THEME_CHANGE_EVENT, type ThemeMode } from '@/lib/theme';

export default function SystemThemeSync() {
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const setDomTheme = (theme: ThemeMode) => {
      document.documentElement.classList.toggle('dark', theme === 'dark');
      document.documentElement.style.colorScheme = theme;
    };

    const applyResolvedTheme = () => {
      const storedTheme = getStoredTheme();
      setDomTheme(storedTheme ?? (mediaQuery.matches ? 'dark' : 'light'));
    };

    const applySystemThemeIfUnset = () => {
      if (!getStoredTheme()) {
        setDomTheme(mediaQuery.matches ? 'dark' : 'light');
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'theme') {
        applyResolvedTheme();
      }
    };

    applyResolvedTheme();
    mediaQuery.addEventListener('change', applySystemThemeIfUnset);
    window.addEventListener(THEME_CHANGE_EVENT, applyResolvedTheme as EventListener);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      mediaQuery.removeEventListener('change', applySystemThemeIfUnset);
      window.removeEventListener(THEME_CHANGE_EVENT, applyResolvedTheme as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return null;
}

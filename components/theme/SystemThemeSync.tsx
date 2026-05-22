'use client';

import { useEffect } from 'react';

export default function SystemThemeSync() {
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applySystemTheme = () => {
      document.documentElement.classList.toggle('dark', mediaQuery.matches);
      document.documentElement.style.colorScheme = mediaQuery.matches ? 'dark' : 'light';
    };

    applySystemTheme();
    mediaQuery.addEventListener('change', applySystemTheme);

    return () => {
      mediaQuery.removeEventListener('change', applySystemTheme);
    };
  }, []);

  return null;
}

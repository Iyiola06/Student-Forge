export type ThemeMode = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'theme';
export const THEME_CHANGE_EVENT = 'studify-theme-change';

function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

export function getStoredTheme(): ThemeMode | null {
  if (!isBrowser()) return null;
  const value = window.localStorage.getItem(THEME_STORAGE_KEY);
  return value === 'dark' || value === 'light' ? value : null;
}

export function getResolvedTheme(): ThemeMode {
  if (!isBrowser()) return 'light';
  const storedTheme = getStoredTheme();
  if (storedTheme) return storedTheme;

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme: ThemeMode) {
  if (!isBrowser()) return;

  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  window.dispatchEvent(new CustomEvent<ThemeMode>(THEME_CHANGE_EVENT, { detail: theme }));
}

export function readThemeFromDom(): ThemeMode {
  if (!isBrowser()) return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

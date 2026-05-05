import { useCallback, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import {
  ThemeContext,
  type ThemeContextValue,
  type ThemeName,
  type ThemePreference,
} from './ThemeContext';

const STORAGE_KEY = 'lexipal-theme';

function readStoredPreference(): ThemePreference {
  if (typeof window === 'undefined') {
    return 'system';
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }

  return 'system';
}

function resolveTheme(preference: ThemePreference, systemIsDark: boolean): ThemeName {
  if (preference === 'system') {
    return systemIsDark ? 'dark' : 'light';
  }

  return preference;
}

function subscribeToSystemTheme(onStoreChange: () => void) {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const media = window.matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener('change', onStoreChange);
  return () => media.removeEventListener('change', onStoreChange);
}

function getSystemThemeSnapshot() {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function getServerSystemThemeSnapshot() {
  return false;
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => readStoredPreference());
  const systemIsDark = useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemThemeSnapshot,
    getServerSystemThemeSnapshot,
  );

  const theme = resolveTheme(preference, systemIsDark);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);

    let favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }

    favicon.type = theme === 'light' ? 'image/png' : 'image/svg+xml';
    favicon.href = theme === 'light' ? '/moth_icon_light.png' : '/moth_icon.svg';
  }, [theme]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
  }, []);

  const toggle = useCallback(() => {
    setPreferenceState((current) => {
      const activeTheme = resolveTheme(current, systemIsDark);
      const next: ThemePreference = activeTheme === 'dark' ? 'light' : 'dark';
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, next);
      }
      return next;
    });
  }, [systemIsDark]);

  const value = useMemo<ThemeContextValue>(
    () => ({ preference, theme, setPreference, toggle }),
    [preference, theme, setPreference, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

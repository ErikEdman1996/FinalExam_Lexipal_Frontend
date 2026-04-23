import { createContext } from 'react';

export type ThemeName = 'light' | 'dark';
export type ThemePreference = ThemeName | 'system';

export interface ThemeContextValue {
  preference: ThemePreference;
  theme: ThemeName;
  setPreference: (next: ThemePreference) => void;
  toggle: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

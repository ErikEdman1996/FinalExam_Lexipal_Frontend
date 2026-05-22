import { createContext } from 'react';
import type { SupportedThemeCode } from './themePalettes';

export type ThemeName = 'light' | 'dark';
export type ThemePreference = ThemeName | 'system';

export interface ThemeContextValue {
  preference: ThemePreference;
  theme: ThemeName;
  themeCode: SupportedThemeCode;
  setPreference: (next: ThemePreference) => void;
  toggle: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export const SUPPORTED_THEME_CODES = [
  'default_light',
  'default_dark',
  'vellum_dawn',
  'sage_margin',
  'harbor_folio',
  'rose_bookmark',
  'midnight_archive',
  'mothlight_nocturne',
  'forest_codex',
  'plum_afterword',
] as const;

export type SupportedThemeCode = (typeof SUPPORTED_THEME_CODES)[number];

export type LexipalThemeTone = 'light' | 'dark';

export interface LexipalThemeTokens {
  background: string;
  surface: string;
  surfaceMuted: string;
  surfaceAlt: string;
  sidebar: string;
  sidebarBorder: string;
  sidebarHover: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  textOnBrand: string;
  sidebarText: string;
  sidebarMuted: string;
  brand: string;
  brandHover: string;
  brandSoft: string;
  brandStrong: string;
  accent: string;
  accentSoft: string;
  accentStrong: string;
  gold: string;
  danger: string;
  dangerSoft: string;
  gradientFrom: string;
  gradientVia: string;
  gradientTo: string;
  pageGlow1: string;
  pageGlow2: string;
  pageGlow3: string;
}

export interface LexipalThemePalette {
  code: SupportedThemeCode;
  tone: LexipalThemeTone;
  tokens: LexipalThemeTokens;
}

interface ThemeSeed {
  background: string;
  surface: string;
  surfaceMuted: string;
  surfaceAlt: string;
  sidebar: string;
  brand: string;
  brandHover: string;
  brandSoft: string;
  accent: string;
  gold: string;
}

export const THEME_TOKEN_CSS_VARIABLES = [
  ['background', '--t-bg'],
  ['surface', '--t-surface'],
  ['surfaceMuted', '--t-surface-muted'],
  ['surfaceAlt', '--t-surface-alt'],
  ['sidebar', '--t-sidebar'],
  ['sidebarBorder', '--t-sidebar-border'],
  ['sidebarHover', '--t-sidebar-hover'],
  ['border', '--t-border'],
  ['borderStrong', '--t-border-strong'],
  ['text', '--t-text'],
  ['textMuted', '--t-text-muted'],
  ['textSubtle', '--t-text-subtle'],
  ['textOnBrand', '--t-text-on-brand'],
  ['sidebarText', '--t-sidebar-text'],
  ['sidebarMuted', '--t-sidebar-muted'],
  ['brand', '--t-brand'],
  ['brandHover', '--t-brand-hover'],
  ['brandSoft', '--t-brand-soft'],
  ['brandStrong', '--t-brand-strong'],
  ['accent', '--t-accent'],
  ['accentSoft', '--t-accent-soft'],
  ['accentStrong', '--t-accent-strong'],
  ['gold', '--t-gold'],
  ['danger', '--t-danger'],
  ['dangerSoft', '--t-danger-soft'],
  ['gradientFrom', '--t-gradient-from'],
  ['gradientVia', '--t-gradient-via'],
  ['gradientTo', '--t-gradient-to'],
  ['pageGlow1', '--t-page-glow-1'],
  ['pageGlow2', '--t-page-glow-2'],
  ['pageGlow3', '--t-page-glow-3'],
] as const satisfies readonly (readonly [keyof LexipalThemeTokens, `--t-${string}`])[];

const addAlpha = (hex: string, alpha: string) => `${hex}${alpha}`;

const makeLightTokens = (seed: ThemeSeed): LexipalThemeTokens => ({
  ...seed,
  sidebarBorder: '#2A26221A',
  sidebarHover: '#2A26220F',
  border: '#2A26221A',
  borderStrong: '#2A26222E',
  text: '#2A2622',
  textMuted: '#6B6259',
  textSubtle: '#9C9388',
  textOnBrand: '#FFFFFF',
  sidebarText: '#2A2622',
  sidebarMuted: '#6B6259',
  brandStrong: seed.brand,
  accentSoft: addAlpha(seed.accent, '24'),
  accentStrong: seed.accent,
  danger: seed.brand,
  dangerSoft: seed.brandSoft,
  gradientFrom: seed.surface,
  gradientVia: seed.background,
  gradientTo: seed.surfaceMuted,
  pageGlow1: addAlpha(seed.brand, '29'),
  pageGlow2: addAlpha(seed.gold, '1F'),
  pageGlow3: addAlpha(seed.accent, '1A'),
});

const makeDarkTokens = (seed: ThemeSeed): LexipalThemeTokens => ({
  ...seed,
  sidebarBorder: '#E8E2D714',
  sidebarHover: '#E8E2D712',
  border: '#E8E2D714',
  borderStrong: '#E8E2D729',
  text: '#EAE4D6',
  textMuted: '#9A9082',
  textSubtle: '#65604F',
  textOnBrand: '#18110D',
  sidebarText: '#EAE4D6',
  sidebarMuted: '#9A9082',
  brandStrong: seed.brand,
  accentSoft: addAlpha(seed.accent, '29'),
  accentStrong: seed.accent,
  danger: seed.brand,
  dangerSoft: seed.brandSoft,
  gradientFrom: seed.background,
  gradientVia: seed.surfaceAlt,
  gradientTo: seed.background,
  pageGlow1: addAlpha(seed.brand, '1A'),
  pageGlow2: addAlpha(seed.gold, '12'),
  pageGlow3: addAlpha(seed.accent, '0F'),
});

export const THEME_PALETTES: Record<SupportedThemeCode, LexipalThemePalette> = {
  default_light: {
    code: 'default_light',
    tone: 'light',
    tokens: {
      background: '#F1EDE6',
      surface: '#F8F5EE',
      surfaceMuted: '#ECE7DC',
      surfaceAlt: '#ECE7DC',
      sidebar: '#E5DFD2',
      sidebarBorder: '#2A26221A',
      sidebarHover: '#2A26220F',
      border: '#2A26221A',
      borderStrong: '#2A26222E',
      text: '#2A2622',
      textMuted: '#6B6259',
      textSubtle: '#9C9388',
      textOnBrand: '#FFFFFF',
      sidebarText: '#2A2622',
      sidebarMuted: '#6B6259',
      brand: '#B85A3E',
      brandHover: '#A64B32',
      brandSoft: '#ECD3C8',
      brandStrong: '#AE5137',
      accent: '#6B6259',
      accentSoft: '#6B625924',
      accentStrong: '#6B6259',
      gold: '#A88433',
      danger: '#B85A3E',
      dangerSoft: '#ECD3C8',
      gradientFrom: '#F8F5EE',
      gradientVia: '#F1EDE6',
      gradientTo: '#ECE7DC',
      pageGlow1: '#B85A3E29',
      pageGlow2: '#A884331F',
      pageGlow3: '#6B62591A',
    },
  },
  default_dark: {
    code: 'default_dark',
    tone: 'dark',
    tokens: {
      background: '#0F0D0B',
      surface: '#1D1814',
      surfaceMuted: '#16120F',
      surfaceAlt: '#120F0D',
      sidebar: '#0B0908',
      sidebarBorder: '#E8E2D714',
      sidebarHover: '#E8E2D712',
      border: '#E8E2D714',
      borderStrong: '#E8E2D729',
      text: '#EAE4D6',
      textMuted: '#9A9082',
      textSubtle: '#65604F',
      textOnBrand: '#18110D',
      sidebarText: '#EAE4D6',
      sidebarMuted: '#9A9082',
      brand: '#D87A5A',
      brandHover: '#E08A6C',
      brandSoft: '#D87A5A2E',
      brandStrong: '#D87A5A',
      accent: '#9A9082',
      accentSoft: '#9A908229',
      accentStrong: '#9A9082',
      gold: '#D4A55A',
      danger: '#D87A5A',
      dangerSoft: '#D87A5A2E',
      gradientFrom: '#0F0D0B',
      gradientVia: '#100E0C',
      gradientTo: '#0F0D0B',
      pageGlow1: '#D87A5A1A',
      pageGlow2: '#D4A55A12',
      pageGlow3: '#9A90820F',
    },
  },
  vellum_dawn: {
    code: 'vellum_dawn',
    tone: 'light',
    tokens: makeLightTokens({
      background: '#F3E7CF',
      surface: '#FFF7E7',
      surfaceMuted: '#E8D6B5',
      surfaceAlt: '#E8D6B5',
      sidebar: '#E1CCAA',
      brand: '#B9673D',
      brandHover: '#A6532E',
      brandSoft: '#EDD2BF',
      accent: '#567A63',
      gold: '#A27A27',
    }),
  },
  sage_margin: {
    code: 'sage_margin',
    tone: 'light',
    tokens: makeLightTokens({
      background: '#EAF0E4',
      surface: '#F6FAF0',
      surfaceMuted: '#DDE7D2',
      surfaceAlt: '#DDE7D2',
      sidebar: '#D1DEC6',
      brand: '#7A6040',
      brandHover: '#664E31',
      brandSoft: '#E1D4BC',
      accent: '#52745B',
      gold: '#A48A3E',
    }),
  },
  harbor_folio: {
    code: 'harbor_folio',
    tone: 'light',
    tokens: makeLightTokens({
      background: '#E6EEF0',
      surface: '#F4FAFB',
      surfaceMuted: '#D7E4E8',
      surfaceAlt: '#D7E4E8',
      sidebar: '#C9DADF',
      brand: '#327B86',
      brandHover: '#286873',
      brandSoft: '#C7E3E6',
      accent: '#5D657D',
      gold: '#B08A35',
    }),
  },
  rose_bookmark: {
    code: 'rose_bookmark',
    tone: 'light',
    tokens: makeLightTokens({
      background: '#F3E7E9',
      surface: '#FCF4F4',
      surfaceMuted: '#E7D7DC',
      surfaceAlt: '#E7D7DC',
      sidebar: '#DDCAD0',
      brand: '#B24E6A',
      brandHover: '#993F59',
      brandSoft: '#EBCBD5',
      accent: '#6B647F',
      gold: '#A98142',
    }),
  },
  midnight_archive: {
    code: 'midnight_archive',
    tone: 'dark',
    tokens: makeDarkTokens({
      background: '#0C1220',
      surface: '#151D31',
      surfaceMuted: '#10182A',
      surfaceAlt: '#0E1424',
      sidebar: '#080E19',
      brand: '#6D95D8',
      brandHover: '#82A6E3',
      brandSoft: '#6D95D82E',
      accent: '#A1B7D6',
      gold: '#D7A65D',
    }),
  },
  mothlight_nocturne: {
    code: 'mothlight_nocturne',
    tone: 'dark',
    tokens: makeDarkTokens({
      background: '#120F0A',
      surface: '#211A11',
      surfaceMuted: '#19130D',
      surfaceAlt: '#150F0A',
      sidebar: '#0D0906',
      brand: '#D99245',
      brandHover: '#E2A45C',
      brandSoft: '#D992452E',
      accent: '#A89A7C',
      gold: '#E0B65D',
    }),
  },
  forest_codex: {
    code: 'forest_codex',
    tone: 'dark',
    tokens: makeDarkTokens({
      background: '#09130F',
      surface: '#10231B',
      surfaceMuted: '#0D1A14',
      surfaceAlt: '#0A1610',
      sidebar: '#07100C',
      brand: '#55A676',
      brandHover: '#69B88A',
      brandSoft: '#55A6762E',
      accent: '#8FB3A0',
      gold: '#C6A458',
    }),
  },
  plum_afterword: {
    code: 'plum_afterword',
    tone: 'dark',
    tokens: makeDarkTokens({
      background: '#150D1C',
      surface: '#24162D',
      surfaceMuted: '#1B1122',
      surfaceAlt: '#160C1D',
      sidebar: '#100913',
      brand: '#AE72D6',
      brandHover: '#BF86E3',
      brandSoft: '#AE72D62E',
      accent: '#A58BB8',
      gold: '#D6A85E',
    }),
  },
};

export const DEFAULT_THEME_CODE_BY_TONE: Record<LexipalThemeTone, SupportedThemeCode> = {
  light: 'default_light',
  dark: 'default_dark',
};

export const isSupportedThemeCode = (value: unknown): value is SupportedThemeCode => {
  return typeof value === 'string' && value in THEME_PALETTES;
};

export const getThemePalette = (code: string | null | undefined) => {
  return isSupportedThemeCode(code) ? THEME_PALETTES[code] : null;
};

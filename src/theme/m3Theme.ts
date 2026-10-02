import { applyGlassThemeToDocument, migrateColorScheme } from './glassThemes';

/**
 * Material 3 Expressive & Universal Theme Engine
 * Complete unified visual language driven by the user's selected primary theme color.
 */

export type M3ThemeMode = 'dark' | 'light';
export type M3ThemeColor = 'blue' | 'red' | 'green' | 'purple' | 'terracotta' | 'amber' | 'indigo';

// Backwards compatibility aliases
export type M3ColorSchemeName = M3ThemeColor | 'sand' | 'emerald' | 'slate' | 'gold' | 'golden' | 'black' | 'white' | 'expressive' | 'sage' | 'mono';

export interface M3PaletteDefinition {
  id: M3ThemeColor;
  name: string;
  description: string;
  hex: string;
  bgHex: string;
  cardHex: string;
  preview: string;
}

export const M3_THEME_COLORS: M3PaletteDefinition[] = [
  {
    id: 'blue',
    name: 'Cobalt & Royal Blue',
    description: 'Clean, modern high-contrast blue theme',
    hex: '#2563EB',
    bgHex: '#F8FAFC',
    cardHex: '#F1F5F9',
    preview: 'bg-[#2563EB]',
  },
  {
    id: 'red',
    name: 'Crimson & Rose Red',
    description: 'Vibrant, bold red expressive theme',
    hex: '#DC2626',
    bgHex: '#FFF5F5',
    cardHex: '#FEE2E2',
    preview: 'bg-[#DC2626]',
  },
  {
    id: 'green',
    name: 'Emerald & Sage Green',
    description: 'Clean financial, trading & cashbook theme',
    hex: '#059669',
    bgHex: '#F4F7F5',
    cardHex: '#E9F0EC',
    preview: 'bg-[#059669]',
  },
  {
    id: 'purple',
    name: 'Royal & Orchid Purple',
    description: 'Sleek, elegant purple expressive theme',
    hex: '#7C3AED',
    bgHex: '#FAF5FF',
    cardHex: '#F3E8FF',
    preview: 'bg-[#7C3AED]',
  },
  {
    id: 'terracotta',
    name: 'Warm Sand & Terracotta',
    description: 'Soft, warm, premium terracotta theme',
    hex: '#DF7C52',
    bgHex: '#FAF8F5',
    cardHex: '#F2EEE9',
    preview: 'bg-[#DF7C52]',
  },
  {
    id: 'amber',
    name: 'Warm Ivory & Amber Gold',
    description: 'Ivory canvas with warm golden metrics',
    hex: '#D97706',
    bgHex: '#FAFAF7',
    cardHex: '#F3F3EC',
    preview: 'bg-[#D97706]',
  },
  {
    id: 'indigo',
    name: 'Soft Slate & Indigo',
    description: 'Crisp, high-tech corporate indigo theme',
    hex: '#4F46E5',
    bgHex: '#F8F9FF',
    cardHex: '#EEF2FF',
    preview: 'bg-[#4F46E5]',
  },
];

export const M3_PALETTES: Record<M3ThemeColor, M3PaletteDefinition> = M3_THEME_COLORS.reduce(
  (acc, item) => ({ ...acc, [item.id]: item }),
  {} as Record<M3ThemeColor, M3PaletteDefinition>
);

export interface M3UnifiedThemeTokens {
  primary: string;
  primaryHover: string;
  primaryActive: string;
  primaryForeground: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  heroBannerBg: string;
  heroBannerText: string;
  heroBannerMuted: string;
  heroBannerAccent: string;
  tonalBg: string;
  tonalBorder: string;
  tonalText: string;
  cardHoverBorder: string;
  focusRing: string;
  badgeBg: string;
  badgeText: string;
  appBarBg: string;
  navIndicatorBg: string;
  navIndicatorText: string;
  surfaceBg: string;
  surfaceCard: string;
  surfaceInput: string;
  surfaceBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  shadowSoft: string;
}

export const M3_LIGHT_THEMES: Record<M3ThemeColor, M3UnifiedThemeTokens> = {
  blue: {
    primary: '#2563EB',
    primaryHover: '#1D4ED8',
    primaryActive: '#1E40AF',
    primaryForeground: '#FFFFFF',
    primaryContainer: '#DBEAFE',
    onPrimaryContainer: '#1E40AF',
    heroBannerBg: '#0F172A',
    heroBannerText: '#FFFFFF',
    heroBannerMuted: '#CBD5E1',
    heroBannerAccent: '#3B82F6',
    tonalBg: '#EFF6FF',
    tonalBorder: '#BFDBFE',
    tonalText: '#1D4ED8',
    cardHoverBorder: '#2563EB',
    focusRing: 'rgba(37, 99, 235, 0.35)',
    badgeBg: '#2563EB',
    badgeText: '#FFFFFF',
    appBarBg: 'rgba(248, 250, 252, 0.95)',
    navIndicatorBg: '#DBEAFE',
    navIndicatorText: '#1D4ED8',
    surfaceBg: '#F8FAFC',
    surfaceCard: '#F1F5F9',
    surfaceInput: '#FFFFFF',
    surfaceBorder: '#CBD5E1',
    textPrimary: '#020617', // Pure dark charcoal/black for maximum contrast
    textSecondary: '#0F172A', // Deep slate for secondary
    textMuted: '#334155', // Clear medium dark slate
    shadowSoft: '0px 4px 24px rgba(37, 99, 235, 0.05)',
  },
  red: {
    primary: '#DC2626',
    primaryHover: '#B91C1C',
    primaryActive: '#991B1B',
    primaryForeground: '#FFFFFF',
    primaryContainer: '#FEE2E2',
    onPrimaryContainer: '#991B1B',
    heroBannerBg: '#450A0A',
    heroBannerText: '#FFFFFF',
    heroBannerMuted: '#FECDD3',
    heroBannerAccent: '#EF4444',
    tonalBg: '#FEF2F2',
    tonalBorder: '#FECACA',
    tonalText: '#B91C1C',
    cardHoverBorder: '#DC2626',
    focusRing: 'rgba(220, 38, 38, 0.35)',
    badgeBg: '#DC2626',
    badgeText: '#FFFFFF',
    appBarBg: 'rgba(255, 245, 245, 0.95)',
    navIndicatorBg: '#FEE2E2',
    navIndicatorText: '#B91C1C',
    surfaceBg: '#FFF5F5',
    surfaceCard: '#FEE2E2',
    surfaceInput: '#FFFFFF',
    surfaceBorder: '#FCA5A5',
    textPrimary: '#180205',
    textSecondary: '#4A0D15',
    textMuted: '#7F1D1D',
    shadowSoft: '0px 4px 24px rgba(220, 38, 38, 0.06)',
  },
  green: {
    primary: '#059669',
    primaryHover: '#047857',
    primaryActive: '#065F46',
    primaryForeground: '#FFFFFF',
    primaryContainer: '#D1FAE5',
    onPrimaryContainer: '#065F46',
    heroBannerBg: '#064E3B',
    heroBannerText: '#FFFFFF',
    heroBannerMuted: '#A7F3D0',
    heroBannerAccent: '#34D399',
    tonalBg: '#ECFDF5',
    tonalBorder: '#A7F3D0',
    tonalText: '#047857',
    cardHoverBorder: '#059669',
    focusRing: 'rgba(5, 150, 105, 0.35)',
    badgeBg: '#059669',
    badgeText: '#FFFFFF',
    appBarBg: 'rgba(244, 247, 245, 0.95)',
    navIndicatorBg: '#D1FAE5',
    navIndicatorText: '#047857',
    surfaceBg: '#F4F7F5',
    surfaceCard: '#E9F0EC',
    surfaceInput: '#FFFFFF',
    surfaceBorder: '#B2D8CD',
    textPrimary: '#021A11',
    textSecondary: '#064E3B',
    textMuted: '#115E59',
    shadowSoft: '0px 4px 24px rgba(5, 150, 105, 0.05)',
  },
  purple: {
    primary: '#7C3AED',
    primaryHover: '#6D28D9',
    primaryActive: '#5B21B6',
    primaryForeground: '#FFFFFF',
    primaryContainer: '#EDE9FE',
    onPrimaryContainer: '#5B21B6',
    heroBannerBg: '#3B0764',
    heroBannerText: '#FFFFFF',
    heroBannerMuted: '#DDD6FE',
    heroBannerAccent: '#A78BFA',
    tonalBg: '#F5F3FF',
    tonalBorder: '#DDD6FE',
    tonalText: '#6D28D9',
    cardHoverBorder: '#7C3AED',
    focusRing: 'rgba(124, 58, 237, 0.35)',
    badgeBg: '#7C3AED',
    badgeText: '#FFFFFF',
    appBarBg: 'rgba(250, 245, 255, 0.95)',
    navIndicatorBg: '#EDE9FE',
    navIndicatorText: '#6D28D9',
    surfaceBg: '#FAF5FF',
    surfaceCard: '#F3E8FF',
    surfaceInput: '#FFFFFF',
    surfaceBorder: '#DDD6FE',
    textPrimary: '#0F0520',
    textSecondary: '#3B0764',
    textMuted: '#5B21B6',
    shadowSoft: '0px 4px 24px rgba(124, 58, 237, 0.06)',
  },
  terracotta: {
    primary: '#DF7C52',
    primaryHover: '#C86840',
    primaryActive: '#B05530',
    primaryForeground: '#FFFFFF',
    primaryContainer: '#FCEAE2',
    onPrimaryContainer: '#7A3215',
    heroBannerBg: '#1C1917',
    heroBannerText: '#FFFFFF',
    heroBannerMuted: '#D6D3D1',
    heroBannerAccent: '#DF7C52',
    tonalBg: '#F2EEE9',
    tonalBorder: '#E0D8CE',
    tonalText: '#A04A27',
    cardHoverBorder: '#DF7C52',
    focusRing: 'rgba(223, 124, 82, 0.35)',
    badgeBg: '#DF7C52',
    badgeText: '#FFFFFF',
    appBarBg: 'rgba(250, 248, 255, 0.95)',
    navIndicatorBg: '#E6D8CE',
    navIndicatorText: '#A04A27',
    surfaceBg: '#FAF8F5',
    surfaceCard: '#F2EEE9',
    surfaceInput: '#FFFFFF',
    surfaceBorder: '#D6CEB8',
    textPrimary: '#1C1917',
    textSecondary: '#292524',
    textMuted: '#44403C',
    shadowSoft: '0px 4px 24px rgba(223, 124, 82, 0.05)',
  },
  amber: {
    primary: '#D97706',
    primaryHover: '#B45309',
    primaryActive: '#92400E',
    primaryForeground: '#FFFFFF',
    primaryContainer: '#FEF3C7',
    onPrimaryContainer: '#92400E',
    heroBannerBg: '#1F2937',
    heroBannerText: '#FFFFFF',
    heroBannerMuted: '#E5E7EB',
    heroBannerAccent: '#FBBF24',
    tonalBg: '#FFFBEB',
    tonalBorder: '#FDE68A',
    tonalText: '#B45309',
    cardHoverBorder: '#D97706',
    focusRing: 'rgba(217, 119, 6, 0.35)',
    badgeBg: '#D97706',
    badgeText: '#FFFFFF',
    appBarBg: 'rgba(250, 250, 247, 0.95)',
    navIndicatorBg: '#FEF3C7',
    navIndicatorText: '#B45309',
    surfaceBg: '#FAFAF7',
    surfaceCard: '#F3F3EC',
    surfaceInput: '#FFFFFF',
    surfaceBorder: '#DCDCC8',
    textPrimary: '#1C1917',
    textSecondary: '#292524',
    textMuted: '#44403C',
    shadowSoft: '0px 4px 24px rgba(217, 119, 6, 0.05)',
  },
  indigo: {
    primary: '#4F46E5',
    primaryHover: '#4338CA',
    primaryActive: '#3730A3',
    primaryForeground: '#FFFFFF',
    primaryContainer: '#E0E7FF',
    onPrimaryContainer: '#3730A3',
    heroBannerBg: '#1E1B4B',
    heroBannerText: '#FFFFFF',
    heroBannerMuted: '#C7D2FE',
    heroBannerAccent: '#818CF8',
    tonalBg: '#EEF2FF',
    tonalBorder: '#C7D2FE',
    tonalText: '#4338CA',
    cardHoverBorder: '#4F46E5',
    focusRing: 'rgba(79, 70, 229, 0.35)',
    badgeBg: '#4F46E5',
    badgeText: '#FFFFFF',
    appBarBg: 'rgba(248, 249, 255, 0.95)',
    navIndicatorBg: '#E0E7FF',
    navIndicatorText: '#4338CA',
    surfaceBg: '#F8F9FF',
    surfaceCard: '#EEF2FF',
    surfaceInput: '#FFFFFF',
    surfaceBorder: '#C7D2FE',
    textPrimary: '#0F172A',
    textSecondary: '#1E293B',
    textMuted: '#334155',
    shadowSoft: '0px 4px 24px rgba(79, 70, 229, 0.05)',
  },
};

export const M3_DARK_THEMES: Record<M3ThemeColor, M3UnifiedThemeTokens> = {
  blue: {
    primary: '#60A5FA',
    primaryHover: '#93C5FD',
    primaryActive: '#3B82F6',
    primaryForeground: '#0F172A',
    primaryContainer: '#1E3A8A',
    onPrimaryContainer: '#DBEAFE',
    heroBannerBg: '#090D16',
    heroBannerText: '#FFFFFF',
    heroBannerMuted: '#CBD5E1',
    heroBannerAccent: '#60A5FA',
    tonalBg: 'rgba(59, 130, 246, 0.2)',
    tonalBorder: 'rgba(59, 130, 246, 0.45)',
    tonalText: '#93C5FD',
    cardHoverBorder: 'rgba(59, 130, 246, 0.6)',
    focusRing: 'rgba(59, 130, 246, 0.4)',
    badgeBg: '#3B82F6',
    badgeText: '#FFFFFF',
    appBarBg: 'rgba(15, 23, 42, 0.95)',
    navIndicatorBg: 'rgba(59, 130, 246, 0.3)',
    navIndicatorText: '#60A5FA',
    surfaceBg: '#090D16',
    surfaceCard: '#0F172A',
    surfaceInput: '#0B1120',
    surfaceBorder: 'rgba(71, 85, 105, 0.8)',
    textPrimary: '#FFFFFF',
    textSecondary: '#F1F5F9',
    textMuted: '#CBD5E1',
    shadowSoft: '0px 4px 24px rgba(0,0,0,0.5)',
  },
  red: {
    primary: '#F87171',
    primaryHover: '#FCA5A5',
    primaryActive: '#EF4444',
    primaryForeground: '#450A0A',
    primaryContainer: '#7F1D1D',
    onPrimaryContainer: '#FEE2E2',
    heroBannerBg: '#180A0F',
    heroBannerText: '#FFFFFF',
    heroBannerMuted: '#FECDD3',
    heroBannerAccent: '#F87171',
    tonalBg: 'rgba(239, 68, 68, 0.2)',
    tonalBorder: 'rgba(239, 68, 68, 0.45)',
    tonalText: '#FCA5A5',
    cardHoverBorder: 'rgba(239, 68, 68, 0.6)',
    focusRing: 'rgba(239, 68, 68, 0.4)',
    badgeBg: '#EF4444',
    badgeText: '#FFFFFF',
    appBarBg: 'rgba(28, 12, 17, 0.95)',
    navIndicatorBg: 'rgba(239, 68, 68, 0.3)',
    navIndicatorText: '#F87171',
    surfaceBg: '#12090C',
    surfaceCard: '#1C0F14',
    surfaceInput: '#140A0E',
    surfaceBorder: 'rgba(159, 18, 57, 0.7)',
    textPrimary: '#FFFFFF',
    textSecondary: '#FFF1F2',
    textMuted: '#FECDD3',
    shadowSoft: '0px 4px 24px rgba(0,0,0,0.5)',
  },
  green: {
    primary: '#34D399',
    primaryHover: '#6EE7B7',
    primaryActive: '#10B981',
    primaryForeground: '#022C22',
    primaryContainer: '#064E3B',
    onPrimaryContainer: '#D1FAE5',
    heroBannerBg: '#041812',
    heroBannerText: '#FFFFFF',
    heroBannerMuted: '#A7F3D0',
    heroBannerAccent: '#34D399',
    tonalBg: 'rgba(16, 185, 129, 0.2)',
    tonalBorder: 'rgba(16, 185, 129, 0.45)',
    tonalText: '#6EE7B7',
    cardHoverBorder: 'rgba(16, 185, 129, 0.6)',
    focusRing: 'rgba(16, 185, 129, 0.4)',
    badgeBg: '#10B981',
    badgeText: '#022C22',
    appBarBg: 'rgba(6, 20, 16, 0.95)',
    navIndicatorBg: 'rgba(16, 185, 129, 0.3)',
    navIndicatorText: '#34D399',
    surfaceBg: '#041812',
    surfaceCard: '#0C201A',
    surfaceInput: '#081713',
    surfaceBorder: 'rgba(20, 83, 65, 0.8)',
    textPrimary: '#FFFFFF',
    textSecondary: '#ECFDF5',
    textMuted: '#A7F3D0',
    shadowSoft: '0px 4px 24px rgba(0,0,0,0.5)',
  },
  purple: {
    primary: '#A78BFA',
    primaryHover: '#C4B5FD',
    primaryActive: '#8B5CF6',
    primaryForeground: '#1E1B4B',
    primaryContainer: '#4C1D95',
    onPrimaryContainer: '#EDE9FE',
    heroBannerBg: '#0E0919',
    heroBannerText: '#FFFFFF',
    heroBannerMuted: '#DDD6FE',
    heroBannerAccent: '#A78BFA',
    tonalBg: 'rgba(139, 92, 246, 0.2)',
    tonalBorder: 'rgba(139, 92, 246, 0.45)',
    tonalText: '#C4B5FD',
    cardHoverBorder: 'rgba(139, 92, 246, 0.6)',
    focusRing: 'rgba(139, 92, 246, 0.4)',
    badgeBg: '#8B5CF6',
    badgeText: '#FFFFFF',
    appBarBg: 'rgba(23, 15, 38, 0.95)',
    navIndicatorBg: 'rgba(139, 92, 246, 0.3)',
    navIndicatorText: '#A78BFA',
    surfaceBg: '#0E0919',
    surfaceCard: '#171026',
    surfaceInput: '#110C1D',
    surfaceBorder: 'rgba(109, 40, 217, 0.7)',
    textPrimary: '#FFFFFF',
    textSecondary: '#F5F3FF',
    textMuted: '#DDD6FE',
    shadowSoft: '0px 4px 24px rgba(0,0,0,0.5)',
  },
  terracotta: {
    primary: '#E8906B',
    primaryHover: '#F0A884',
    primaryActive: '#DF7C52',
    primaryForeground: '#1C1917',
    primaryContainer: '#451D10',
    onPrimaryContainer: '#FCEAE2',
    heroBannerBg: '#141211',
    heroBannerText: '#FFFFFF',
    heroBannerMuted: '#E7E5E4',
    heroBannerAccent: '#E8906B',
    tonalBg: 'rgba(223, 124, 82, 0.2)',
    tonalBorder: 'rgba(223, 124, 82, 0.45)',
    tonalText: '#E8906B',
    cardHoverBorder: 'rgba(223, 124, 82, 0.6)',
    focusRing: 'rgba(223, 124, 82, 0.4)',
    badgeBg: '#DF7C52',
    badgeText: '#FFFFFF',
    appBarBg: 'rgba(28, 25, 23, 0.95)',
    navIndicatorBg: 'rgba(223, 124, 82, 0.3)',
    navIndicatorText: '#E8906B',
    surfaceBg: '#100E0D',
    surfaceCard: '#1C1917',
    surfaceInput: '#171412',
    surfaceBorder: 'rgba(120, 113, 108, 0.7)',
    textPrimary: '#FFFFFF',
    textSecondary: '#FAF8F5',
    textMuted: '#E7E5E4',
    shadowSoft: '0px 4px 24px rgba(0,0,0,0.5)',
  },
  amber: {
    primary: '#FBBF24',
    primaryHover: '#FCD34D',
    primaryActive: '#F59E0B',
    primaryForeground: '#1F2937',
    primaryContainer: '#78350F',
    onPrimaryContainer: '#FEF3C7',
    heroBannerBg: '#14120E',
    heroBannerText: '#FFFFFF',
    heroBannerMuted: '#E5E7EB',
    heroBannerAccent: '#FBBF24',
    tonalBg: 'rgba(245, 158, 11, 0.2)',
    tonalBorder: 'rgba(245, 158, 11, 0.45)',
    tonalText: '#FCD34D',
    cardHoverBorder: 'rgba(245, 158, 11, 0.6)',
    focusRing: 'rgba(245, 158, 11, 0.4)',
    badgeBg: '#F59E0B',
    badgeText: '#1F2937',
    appBarBg: 'rgba(31, 41, 55, 0.95)',
    navIndicatorBg: 'rgba(245, 158, 11, 0.3)',
    navIndicatorText: '#FBBF24',
    surfaceBg: '#0E0C09',
    surfaceCard: '#1F2937',
    surfaceInput: '#171E28',
    surfaceBorder: 'rgba(107, 114, 128, 0.7)',
    textPrimary: '#FFFFFF',
    textSecondary: '#FFFBEB',
    textMuted: '#FDE68A',
    shadowSoft: '0px 4px 24px rgba(0,0,0,0.5)',
  },
  indigo: {
    primary: '#818CF8',
    primaryHover: '#A5B4FC',
    primaryActive: '#6366F1',
    primaryForeground: '#0F172A',
    primaryContainer: '#312E81',
    onPrimaryContainer: '#E0E7FF',
    heroBannerBg: '#0B0A1A',
    heroBannerText: '#FFFFFF',
    heroBannerMuted: '#C7D2FE',
    heroBannerAccent: '#818CF8',
    tonalBg: 'rgba(99, 102, 241, 0.2)',
    tonalBorder: 'rgba(99, 102, 241, 0.45)',
    tonalText: '#A5B4FC',
    cardHoverBorder: 'rgba(99, 102, 241, 0.6)',
    focusRing: 'rgba(99, 102, 241, 0.4)',
    badgeBg: '#6366F1',
    badgeText: '#FFFFFF',
    appBarBg: 'rgba(30, 27, 75, 0.95)',
    navIndicatorBg: 'rgba(99, 102, 241, 0.3)',
    navIndicatorText: '#818CF8',
    surfaceBg: '#0B0A1A',
    surfaceCard: '#1E1B4B',
    surfaceInput: '#151336',
    surfaceBorder: 'rgba(79, 70, 229, 0.7)',
    textPrimary: '#FFFFFF',
    textSecondary: '#EEF2FF',
    textMuted: '#C7D2FE',
    shadowSoft: '0px 4px 24px rgba(0,0,0,0.5)',
  },
};

/**
 * Resolves a raw color name (including legacy names) to a valid M3ThemeColor.
 */
export function normalizeThemeColor(rawName?: string): M3ThemeColor {
  if (!rawName) return 'blue';
  const clean = rawName.toLowerCase().trim();
  if (clean === 'red') return 'red';
  if (clean === 'green' || clean === 'emerald' || clean === 'sage') return 'green';
  if (clean === 'purple') return 'purple';
  if (clean === 'sand' || clean === 'terracotta') return 'terracotta';
  if (clean === 'amber' || clean === 'gold' || clean === 'golden') return 'amber';
  if (clean === 'indigo' || clean === 'slate') return 'indigo';
  if (clean === 'blue' || clean === 'royal' || clean === 'expressive') return 'blue';
  return 'blue';
}

/**
 * Returns the unified active theme tokens based on theme color and mode.
 */
export function getActiveThemeTokens(color: string, mode: M3ThemeMode): M3UnifiedThemeTokens {
  const normColor = normalizeThemeColor(color);
  if (mode === 'light') {
    return M3_LIGHT_THEMES[normColor] || M3_LIGHT_THEMES.blue;
  }
  return M3_DARK_THEMES[normColor] || M3_DARK_THEMES.blue;
}

/**
 * Applies all semantic variables and M3 tokens to document.documentElement (html element)
 */
export function applyThemeToDocument(
  color: string,
  mode: M3ThemeMode,
  options?: { liteMode?: boolean; animatedBackground?: boolean }
) {
  applyGlassThemeToDocument(color, mode, options);
}

export const M3_DARK_SCHEMES: Record<string, M3UnifiedThemeTokens> = {
  ...M3_DARK_THEMES,
  sand: M3_DARK_THEMES.terracotta,
  emerald: M3_DARK_THEMES.green,
  slate: M3_DARK_THEMES.indigo,
  gold: M3_DARK_THEMES.amber,
  golden: M3_DARK_THEMES.amber,
  expressive: M3_DARK_THEMES.blue,
  black: M3_DARK_THEMES.blue,
  white: M3_DARK_THEMES.blue,
  mono: M3_DARK_THEMES.blue,
  sage: M3_DARK_THEMES.green,
  teal: M3_DARK_THEMES.green,
};

export const M3_LIGHT_SCHEMES: Record<string, M3UnifiedThemeTokens> = {
  ...M3_LIGHT_THEMES,
  sand: M3_LIGHT_THEMES.terracotta,
  emerald: M3_LIGHT_THEMES.green,
  slate: M3_LIGHT_THEMES.indigo,
  gold: M3_LIGHT_THEMES.amber,
  golden: M3_LIGHT_THEMES.amber,
  expressive: M3_LIGHT_THEMES.blue,
  black: M3_LIGHT_THEMES.blue,
  white: M3_LIGHT_THEMES.blue,
  mono: M3_LIGHT_THEMES.blue,
  sage: M3_LIGHT_THEMES.green,
  teal: M3_LIGHT_THEMES.green,
};

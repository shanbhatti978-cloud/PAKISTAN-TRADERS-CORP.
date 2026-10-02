/**
 * Pakistan Traders Corp. - Glass Themes System
 * 8 Premium Materials with Light & Dark Variants, Ambient Blurred Blobs, and High Contrast.
 */

export type GlassThemeId =
  | 'aurora'
  | 'ocean'
  | 'rose'
  | 'emerald'
  | 'sapphire'
  | 'sunset'
  | 'graphite'
  | 'obsidian';

export interface DrawerThemeTokens {
  drawerTint: string;
  drawerSheen: string;
  drawerGlow: string;
  drawerEdge: string;
  drawerGroup: string;
  drawerDivider: string;
  drawerRowPress: string;
  drawerIcon1: string;
  drawerIcon2: string;
  drawerIcon3: string;
  drawerIcon4: string;
  drawerIcon5: string;
  drawerIcon6: string;
  drawerIconNeutral: string;
  drawerToggleOn: string;
  drawerSegmentedThumb: string;
  drawerText: string;
  drawerTextMuted: string;
  drawerScrim: string;
  drawerLiteBg: string;
}

export interface GlassThemeVariant {
  bgGradient: string;
  blobA: string;
  blobB: string;
  blobC: string;
  glassFill: string;
  glassFillStrong: string;
  glassBorder: string;
  glassHighlight: string;
  glassShadow: string;
  blur: number;
  saturate: number;
  primary: string;
  primaryHover: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  chartA: string;
  chartB: string;
  chartC: string;
  chartD: string;
  dockFill: string;
  dockActive: string;
  surfaceBg: string;
  surfaceCard: string;
  surfaceInput: string;
  surfaceBorder: string;
  drawerTokens?: DrawerThemeTokens;
}

export interface GlassThemeDefinition {
  id: GlassThemeId;
  name: string;
  subtitle: string;
  description: string;
  accent: string;
  preview: {
    gradient: string;
    blobs: [string, string, string];
    primary: string;
    accent: string;
  };
  light: GlassThemeVariant;
  dark: GlassThemeVariant;
}

export const GLASS_THEMES: Record<GlassThemeId, GlassThemeDefinition> = {
  aurora: {
    id: 'aurora',
    name: 'Aurora Lavender',
    subtitle: 'Default Corporate Lavender',
    description: 'Soft lavender mist with coral & mint ambient orbs, royal violet accent.',
    accent: '#F4A3A0',
    preview: {
      gradient: 'linear-gradient(160deg, #ECE8FB 0%, #F7F4EF 50%, #FDF1EE 100%)',
      blobs: ['#BDB4F2', '#F4A3A0', '#C9F0E4'],
      primary: '#5B4BC4',
      accent: '#F4A3A0',
    },
    light: {
      bgGradient: 'linear-gradient(160deg, #ECE8FB 0%, #F7F4EF 50%, #FDF1EE 100%)',
      blobA: '#BDB4F2',
      blobB: '#F4A3A0',
      blobC: '#C9F0E4',
      glassFill: 'rgba(255, 255, 255, 0.65)',
      glassFillStrong: 'rgba(255, 255, 255, 0.82)',
      glassBorder: 'rgba(255, 255, 255, 0.70)',
      glassHighlight: 'rgba(255, 255, 255, 0.95)',
      glassShadow: '0 8px 32px 0 rgba(91, 75, 196, 0.10)',
      blur: 20,
      saturate: 140,
      primary: '#5B4BC4',
      primaryHover: '#4A3BA8',
      onPrimary: '#FFFFFF',
      primaryContainer: '#E4DFFF',
      onPrimaryContainer: '#2B1F84',
      accent: '#F4A3A0',
      success: '#16A34A',
      warning: '#D97706',
      danger: '#DC2626',
      text: '#181432',
      textMuted: '#423D61',
      textSubtle: '#6A638C',
      chartA: '#5B4BC4',
      chartB: '#F4A3A0',
      chartC: '#2DBF9A',
      chartD: '#FFB366',
      dockFill: 'rgba(226, 224, 232, 0.85)',
      dockActive: '#FFFFFF',
      surfaceBg: '#F3F0FA',
      surfaceCard: '#FFFFFF',
      surfaceInput: '#FFFFFF',
      surfaceBorder: '#DDD8EC',
    },
    dark: {
      bgGradient: 'linear-gradient(160deg, #14121F 0%, #1C1933 50%, #261E3D 100%)',
      blobA: '#5B4BC4',
      blobB: '#7A3D52',
      blobC: '#236155',
      glassFill: 'rgba(255, 255, 255, 0.07)',
      glassFillStrong: 'rgba(255, 255, 255, 0.13)',
      glassBorder: 'rgba(255, 255, 255, 0.12)',
      glassHighlight: 'rgba(255, 255, 255, 0.18)',
      glassShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.40)',
      blur: 20,
      saturate: 140,
      primary: '#B8ADFF',
      primaryHover: '#C9C2FF',
      onPrimary: '#1E174E',
      primaryContainer: '#3C3382',
      onPrimaryContainer: '#EDE9FF',
      accent: '#F4A3A0',
      success: '#22C55E',
      warning: '#F59E0B',
      danger: '#EF4444',
      text: '#F5F3FC',
      textMuted: '#C5C1DE',
      textSubtle: '#9791B7',
      chartA: '#B8ADFF',
      chartB: '#F4A3A0',
      chartC: '#6FD3EC',
      chartD: '#FFB366',
      dockFill: 'rgba(255, 255, 255, 0.10)',
      dockActive: 'rgba(255, 255, 255, 0.92)',
      surfaceBg: '#12101C',
      surfaceCard: '#1C192E',
      surfaceInput: '#131122',
      surfaceBorder: '#2E2A47',
    },
  },

  ocean: {
    id: 'ocean',
    name: 'Ocean Crystal',
    subtitle: 'Crisp Cyan & Deep Lagoon',
    description: 'Refreshing coastal palette with aquamarine orbs and turquoise depth.',
    accent: '#2DBF9A',
    preview: {
      gradient: 'linear-gradient(160deg, #E3F4FB 0%, #F0FAFA 50%, #EAF7F3 100%)',
      blobs: ['#7FD6EA', '#8FE3D0', '#B7C8FF'],
      primary: '#0B7A9B',
      accent: '#2DBF9A',
    },
    light: {
      bgGradient: 'linear-gradient(160deg, #E3F4FB 0%, #F0FAFA 50%, #EAF7F3 100%)',
      blobA: '#7FD6EA',
      blobB: '#8FE3D0',
      blobC: '#B7C8FF',
      glassFill: 'rgba(255, 255, 255, 0.65)',
      glassFillStrong: 'rgba(255, 255, 255, 0.84)',
      glassBorder: 'rgba(255, 255, 255, 0.70)',
      glassHighlight: 'rgba(255, 255, 255, 0.95)',
      glassShadow: '0 8px 32px 0 rgba(11, 122, 155, 0.10)',
      blur: 20,
      saturate: 140,
      primary: '#0B7A9B',
      primaryHover: '#08637E',
      onPrimary: '#FFFFFF',
      primaryContainer: '#CEF1F9',
      onPrimaryContainer: '#043A4A',
      accent: '#2DBF9A',
      success: '#16A34A',
      warning: '#D97706',
      danger: '#DC2626',
      text: '#09232D',
      textMuted: '#244551',
      textSubtle: '#4D717E',
      chartA: '#0B7A9B',
      chartB: '#2DBF9A',
      chartC: '#60A5FA',
      chartD: '#F59E0B',
      dockFill: 'rgba(220, 237, 245, 0.85)',
      dockActive: '#FFFFFF',
      surfaceBg: '#E8F5F9',
      surfaceCard: '#FFFFFF',
      surfaceInput: '#FFFFFF',
      surfaceBorder: '#CCE4EC',
    },
    dark: {
      bgGradient: 'linear-gradient(160deg, #07161D 0%, #0B2530 50%, #0E2F36 100%)',
      blobA: '#1A677B',
      blobB: '#1C6D5F',
      blobC: '#243F75',
      glassFill: 'rgba(255, 255, 255, 0.07)',
      glassFillStrong: 'rgba(255, 255, 255, 0.13)',
      glassBorder: 'rgba(255, 255, 255, 0.12)',
      glassHighlight: 'rgba(255, 255, 255, 0.18)',
      glassShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.40)',
      blur: 20,
      saturate: 140,
      primary: '#6FD3EC',
      primaryHover: '#8CE0F5',
      onPrimary: '#04222B',
      primaryContainer: '#0F4756',
      onPrimaryContainer: '#DDF6FC',
      accent: '#2DBF9A',
      success: '#22C55E',
      warning: '#F59E0B',
      danger: '#EF4444',
      text: '#EFF9FC',
      textMuted: '#B7DDE6',
      textSubtle: '#7BAEBA',
      chartA: '#6FD3EC',
      chartB: '#2DBF9A',
      chartC: '#93C5FD',
      chartD: '#FCD34D',
      dockFill: 'rgba(255, 255, 255, 0.10)',
      dockActive: 'rgba(255, 255, 255, 0.92)',
      surfaceBg: '#05131A',
      surfaceCard: '#0D242E',
      surfaceInput: '#071820',
      surfaceBorder: '#1A3944',
    },
  },

  rose: {
    id: 'rose',
    name: 'Rose Quartz',
    subtitle: 'Blush & Peach Elegance',
    description: 'Subtle blush glass with peach warmth and raspberry primary jewel tones.',
    accent: '#E8845B',
    preview: {
      gradient: 'linear-gradient(160deg, #FCE9EF 0%, #FFF4EE 50%, #F6EAFB 100%)',
      blobs: ['#F6A9C0', '#FFC9A8', '#D7B6F2'],
      primary: '#C0285F',
      accent: '#E8845B',
    },
    light: {
      bgGradient: 'linear-gradient(160deg, #FCE9EF 0%, #FFF4EE 50%, #F6EAFB 100%)',
      blobA: '#F6A9C0',
      blobB: '#FFC9A8',
      blobC: '#D7B6F2',
      glassFill: 'rgba(255, 255, 255, 0.65)',
      glassFillStrong: 'rgba(255, 255, 255, 0.84)',
      glassBorder: 'rgba(255, 255, 255, 0.70)',
      glassHighlight: 'rgba(255, 255, 255, 0.95)',
      glassShadow: '0 8px 32px 0 rgba(192, 40, 95, 0.10)',
      blur: 20,
      saturate: 140,
      primary: '#C0285F',
      primaryHover: '#A31C4D',
      onPrimary: '#FFFFFF',
      primaryContainer: '#FCE0EA',
      onPrimaryContainer: '#5C0827',
      accent: '#E8845B',
      success: '#16A34A',
      warning: '#D97706',
      danger: '#DC2626',
      text: '#2D0E1A',
      textMuted: '#5C273A',
      textSubtle: '#8C5468',
      chartA: '#C0285F',
      chartB: '#E8845B',
      chartC: '#8B5CF6',
      chartD: '#F59E0B',
      dockFill: 'rgba(245, 226, 233, 0.85)',
      dockActive: '#FFFFFF',
      surfaceBg: '#FAF0F4',
      surfaceCard: '#FFFFFF',
      surfaceInput: '#FFFFFF',
      surfaceBorder: '#ECD1DC',
    },
    dark: {
      bgGradient: 'linear-gradient(160deg, #1C0F16 0%, #2A1522 50%, #32182D 100%)',
      blobA: '#8B1E45',
      blobB: '#823D20',
      blobC: '#6A2A78',
      glassFill: 'rgba(255, 255, 255, 0.07)',
      glassFillStrong: 'rgba(255, 255, 255, 0.13)',
      glassBorder: 'rgba(255, 255, 255, 0.12)',
      glassHighlight: 'rgba(255, 255, 255, 0.18)',
      glassShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.40)',
      blur: 20,
      saturate: 140,
      primary: '#FF9DBF',
      primaryHover: '#FFB8CF',
      onPrimary: '#2D0412',
      primaryContainer: '#661534',
      onPrimaryContainer: '#FFE3EE',
      accent: '#E8845B',
      success: '#22C55E',
      warning: '#F59E0B',
      danger: '#EF4444',
      text: '#FDF2F6',
      textMuted: '#E2B6C7',
      textSubtle: '#B18095',
      chartA: '#FF9DBF',
      chartB: '#E8845B',
      chartC: '#C084FC',
      chartD: '#FCD34D',
      dockFill: 'rgba(255, 255, 255, 0.10)',
      dockActive: 'rgba(255, 255, 255, 0.92)',
      surfaceBg: '#180B12',
      surfaceCard: '#27121F',
      surfaceInput: '#1D0D17',
      surfaceBorder: '#3F1F33',
    },
  },

  emerald: {
    id: 'emerald',
    name: 'Emerald Mist',
    subtitle: 'Botanic Green & Cashbook Mint',
    description: 'Crisp sage & jade crystals optimized for commercial ledger clarity.',
    accent: '#C9A227',
    preview: {
      gradient: 'linear-gradient(160deg, #E4F6EC 0%, #F2FAF1 50%, #E8F4F4 100%)',
      blobs: ['#8EDDB0', '#C8F0A8', '#8FD8D0'],
      primary: '#0F7B4F',
      accent: '#C9A227',
    },
    light: {
      bgGradient: 'linear-gradient(160deg, #E4F6EC 0%, #F2FAF1 50%, #E8F4F4 100%)',
      blobA: '#8EDDB0',
      blobB: '#C8F0A8',
      blobC: '#8FD8D0',
      glassFill: 'rgba(255, 255, 255, 0.65)',
      glassFillStrong: 'rgba(255, 255, 255, 0.84)',
      glassBorder: 'rgba(255, 255, 255, 0.70)',
      glassHighlight: 'rgba(255, 255, 255, 0.95)',
      glassShadow: '0 8px 32px 0 rgba(15, 123, 79, 0.10)',
      blur: 20,
      saturate: 140,
      primary: '#0F7B4F',
      primaryHover: '#0A633F',
      onPrimary: '#FFFFFF',
      primaryContainer: '#D1F5E1',
      onPrimaryContainer: '#043822',
      accent: '#C9A227',
      success: '#16A34A',
      warning: '#D97706',
      danger: '#DC2626',
      text: '#0C281B',
      textMuted: '#244D39',
      textSubtle: '#4B7761',
      chartA: '#0F7B4F',
      chartB: '#C9A227',
      chartC: '#06B6D4',
      chartD: '#F59E0B',
      dockFill: 'rgba(223, 240, 230, 0.85)',
      dockActive: '#FFFFFF',
      surfaceBg: '#E9F5EF',
      surfaceCard: '#FFFFFF',
      surfaceInput: '#FFFFFF',
      surfaceBorder: '#CCE7D9',
    },
    dark: {
      bgGradient: 'linear-gradient(160deg, #08160F 0%, #0E2519 50%, #12302A 100%)',
      blobA: '#146842',
      blobB: '#496F20',
      blobC: '#1A675C',
      glassFill: 'rgba(255, 255, 255, 0.07)',
      glassFillStrong: 'rgba(255, 255, 255, 0.13)',
      glassBorder: 'rgba(255, 255, 255, 0.12)',
      glassHighlight: 'rgba(255, 255, 255, 0.18)',
      glassShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.40)',
      blur: 20,
      saturate: 140,
      primary: '#6FE0A6',
      primaryHover: '#8CEAB8',
      onPrimary: '#022113',
      primaryContainer: '#0F4E32',
      onPrimaryContainer: '#D5FDE7',
      accent: '#E6BF38',
      success: '#22C55E',
      warning: '#F59E0B',
      danger: '#EF4444',
      text: '#F0FCF6',
      textMuted: '#B7E4CD',
      textSubtle: '#78B296',
      chartA: '#6FE0A6',
      chartB: '#E6BF38',
      chartC: '#22D3EE',
      chartD: '#FCD34D',
      dockFill: 'rgba(255, 255, 255, 0.10)',
      dockActive: 'rgba(255, 255, 255, 0.92)',
      surfaceBg: '#05130D',
      surfaceCard: '#0C2318',
      surfaceInput: '#071810',
      surfaceBorder: '#1A392B',
    },
  },

  sapphire: {
    id: 'sapphire',
    name: 'Sapphire Ice',
    subtitle: 'High-Tech Cobalt & Ice Blue',
    description: 'Corporate royal blue glass with sky highlights and deep cobalt contrast.',
    accent: '#19B5E8',
    preview: {
      gradient: 'linear-gradient(160deg, #E6EEFF 0%, #F2F6FF 50%, #EAF4FF 100%)',
      blobs: ['#8FB0FF', '#A9D3FF', '#C3B8FF'],
      primary: '#2754D6',
      accent: '#19B5E8',
    },
    light: {
      bgGradient: 'linear-gradient(160deg, #E6EEFF 0%, #F2F6FF 50%, #EAF4FF 100%)',
      blobA: '#8FB0FF',
      blobB: '#A9D3FF',
      blobC: '#C3B8FF',
      glassFill: 'rgba(255, 255, 255, 0.65)',
      glassFillStrong: 'rgba(255, 255, 255, 0.84)',
      glassBorder: 'rgba(255, 255, 255, 0.70)',
      glassHighlight: 'rgba(255, 255, 255, 0.95)',
      glassShadow: '0 8px 32px 0 rgba(39, 84, 214, 0.10)',
      blur: 20,
      saturate: 140,
      primary: '#2754D6',
      primaryHover: '#1B42B8',
      onPrimary: '#FFFFFF',
      primaryContainer: '#DCE6FF',
      onPrimaryContainer: '#0D226A',
      accent: '#19B5E8',
      success: '#16A34A',
      warning: '#D97706',
      danger: '#DC2626',
      text: '#0C1733',
      textMuted: '#293C68',
      textSubtle: '#52699B',
      chartA: '#2754D6',
      chartB: '#19B5E8',
      chartC: '#10B981',
      chartD: '#F59E0B',
      dockFill: 'rgba(224, 233, 248, 0.85)',
      dockActive: '#FFFFFF',
      surfaceBg: '#ECF1FA',
      surfaceCard: '#FFFFFF',
      surfaceInput: '#FFFFFF',
      surfaceBorder: '#CFDAEC',
    },
    dark: {
      bgGradient: 'linear-gradient(160deg, #080F24 0%, #0D1A3D 50%, #11204A 100%)',
      blobA: '#1F47BF',
      blobB: '#1E659A',
      blobC: '#442F99',
      glassFill: 'rgba(255, 255, 255, 0.07)',
      glassFillStrong: 'rgba(255, 255, 255, 0.13)',
      glassBorder: 'rgba(255, 255, 255, 0.12)',
      glassHighlight: 'rgba(255, 255, 255, 0.18)',
      glassShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.40)',
      blur: 20,
      saturate: 140,
      primary: '#8FB0FF',
      primaryHover: '#ADC5FF',
      onPrimary: '#061338',
      primaryContainer: '#17368C',
      onPrimaryContainer: '#E5EDFF',
      accent: '#38C8F7',
      success: '#22C55E',
      warning: '#F59E0B',
      danger: '#EF4444',
      text: '#F1F5FE',
      textMuted: '#BDCEFB',
      textSubtle: '#7E98D6',
      chartA: '#8FB0FF',
      chartB: '#38C8F7',
      chartC: '#34D399',
      chartD: '#FCD34D',
      dockFill: 'rgba(255, 255, 255, 0.10)',
      dockActive: 'rgba(255, 255, 255, 0.92)',
      surfaceBg: '#060B1C',
      surfaceCard: '#0F1D3E',
      surfaceInput: '#081229',
      surfaceBorder: '#1A2F5E',
    },
  },

  sunset: {
    id: 'sunset',
    name: 'Sunset Amber',
    subtitle: 'Warm Terracotta & Honey Gold',
    description: 'Warm golden dunes with peach sunset gradients and crimson accent pop.',
    accent: '#D9455F',
    preview: {
      gradient: 'linear-gradient(160deg, #FFF0DC 0%, #FFF7EA 50%, #FDE9E3 100%)',
      blobs: ['#FFC47A', '#FF9E80', '#F6D77F'],
      primary: '#B85C00',
      accent: '#D9455F',
    },
    light: {
      bgGradient: 'linear-gradient(160deg, #FFF0DC 0%, #FFF7EA 50%, #FDE9E3 100%)',
      blobA: '#FFC47A',
      blobB: '#FF9E80',
      blobC: '#F6D77F',
      glassFill: 'rgba(255, 255, 255, 0.65)',
      glassFillStrong: 'rgba(255, 255, 255, 0.84)',
      glassBorder: 'rgba(255, 255, 255, 0.70)',
      glassHighlight: 'rgba(255, 255, 255, 0.95)',
      glassShadow: '0 8px 32px 0 rgba(184, 92, 0, 0.10)',
      blur: 20,
      saturate: 140,
      primary: '#B85C00',
      primaryHover: '#994B00',
      onPrimary: '#FFFFFF',
      primaryContainer: '#FFE5C7',
      onPrimaryContainer: '#542600',
      accent: '#D9455F',
      success: '#16A34A',
      warning: '#D97706',
      danger: '#DC2626',
      text: '#2C1604',
      textMuted: '#5F3915',
      textSubtle: '#8E633B',
      chartA: '#B85C00',
      chartB: '#D9455F',
      chartC: '#10B981',
      chartD: '#F59E0B',
      dockFill: 'rgba(247, 233, 222, 0.85)',
      dockActive: '#FFFFFF',
      surfaceBg: '#FAF2E8',
      surfaceCard: '#FFFFFF',
      surfaceInput: '#FFFFFF',
      surfaceBorder: '#EBD8C4',
    },
    dark: {
      bgGradient: 'linear-gradient(160deg, #1F1208 0%, #2C190B 50%, #331A18 100%)',
      blobA: '#873F02',
      blobB: '#822F1E',
      blobC: '#755813',
      glassFill: 'rgba(255, 255, 255, 0.07)',
      glassFillStrong: 'rgba(255, 255, 255, 0.13)',
      glassBorder: 'rgba(255, 255, 255, 0.12)',
      glassHighlight: 'rgba(255, 255, 255, 0.18)',
      glassShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.40)',
      blur: 20,
      saturate: 140,
      primary: '#FFB366',
      primaryHover: '#FFC88F',
      onPrimary: '#301300',
      primaryContainer: '#5C2B02',
      onPrimaryContainer: '#FFE7D1',
      accent: '#F45D77',
      success: '#22C55E',
      warning: '#F59E0B',
      danger: '#EF4444',
      text: '#FDF5EC',
      textMuted: '#E4C7A8',
      textSubtle: '#AE8B68',
      chartA: '#FFB366',
      chartB: '#F45D77',
      chartC: '#34D399',
      chartD: '#FBBF24',
      dockFill: 'rgba(255, 255, 255, 0.10)',
      dockActive: 'rgba(255, 255, 255, 0.92)',
      surfaceBg: '#1A0E06',
      surfaceCard: '#2B170A',
      surfaceInput: '#1F1007',
      surfaceBorder: '#452613',
    },
  },

  graphite: {
    id: 'graphite',
    name: 'Graphite Titanium',
    subtitle: 'Neutral Slate & Executive Steel',
    description: 'Precision monochrome titanium surfaces with subtle indigo electricity.',
    accent: '#6C8CFF',
    preview: {
      gradient: 'linear-gradient(160deg, #ECEEF2 0%, #F6F7F9 50%, #E9ECF1 100%)',
      blobs: ['#AEB6C7', '#C7CDD9', '#B5C0D6'],
      primary: '#2B3445',
      accent: '#6C8CFF',
    },
    light: {
      bgGradient: 'linear-gradient(160deg, #ECEEF2 0%, #F6F7F9 50%, #E9ECF1 100%)',
      blobA: '#AEB6C7',
      blobB: '#C7CDD9',
      blobC: '#B5C0D6',
      glassFill: 'rgba(255, 255, 255, 0.65)',
      glassFillStrong: 'rgba(255, 255, 255, 0.84)',
      glassBorder: 'rgba(255, 255, 255, 0.70)',
      glassHighlight: 'rgba(255, 255, 255, 0.95)',
      glassShadow: '0 8px 32px 0 rgba(43, 52, 69, 0.10)',
      blur: 20,
      saturate: 140,
      primary: '#2B3445',
      primaryHover: '#1F2633',
      onPrimary: '#FFFFFF',
      primaryContainer: '#DFE3EB',
      onPrimaryContainer: '#121721',
      accent: '#6C8CFF',
      success: '#16A34A',
      warning: '#D97706',
      danger: '#DC2626',
      text: '#111622',
      textMuted: '#384357',
      textSubtle: '#606E87',
      chartA: '#2B3445',
      chartB: '#6C8CFF',
      chartC: '#10B981',
      chartD: '#F59E0B',
      dockFill: 'rgba(228, 231, 237, 0.85)',
      dockActive: '#FFFFFF',
      surfaceBg: '#ECEFF4',
      surfaceCard: '#FFFFFF',
      surfaceInput: '#FFFFFF',
      surfaceBorder: '#D2D7E0',
    },
    dark: {
      bgGradient: 'linear-gradient(160deg, #0C0E12 0%, #14171D 50%, #1A1E26 100%)',
      blobA: '#2F3644',
      blobB: '#3F4756',
      blobC: '#323E56',
      glassFill: 'rgba(255, 255, 255, 0.07)',
      glassFillStrong: 'rgba(255, 255, 255, 0.13)',
      glassBorder: 'rgba(255, 255, 255, 0.12)',
      glassHighlight: 'rgba(255, 255, 255, 0.18)',
      glassShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.40)',
      blur: 20,
      saturate: 140,
      primary: '#D6DBE6',
      primaryHover: '#E6E9F0',
      onPrimary: '#0E1117',
      primaryContainer: '#282F3E',
      onPrimaryContainer: '#EFF2F7',
      accent: '#7E9BFF',
      success: '#22C55E',
      warning: '#F59E0B',
      danger: '#EF4444',
      text: '#F6F7FA',
      textMuted: '#CBD1DF',
      textSubtle: '#949EB2',
      chartA: '#D6DBE6',
      chartB: '#7E9BFF',
      chartC: '#34D399',
      chartD: '#FBBF24',
      dockFill: 'rgba(255, 255, 255, 0.10)',
      dockActive: 'rgba(255, 255, 255, 0.92)',
      surfaceBg: '#090B0E',
      surfaceCard: '#15181F',
      surfaceInput: '#0E1015',
      surfaceBorder: '#232936',
    },
  },

  obsidian: {
    id: 'obsidian',
    name: 'Midnight Obsidian',
    subtitle: 'OLED Black & Neon Horizon',
    description: 'Pitch-black glass with ethereal ultraviolet and turquoise ambient glows.',
    accent: '#5EEAD4',
    preview: {
      gradient: 'linear-gradient(160deg, #05060A 0%, #0A0C14 50%, #0F1322 100%)',
      blobs: ['#3B4CCA', '#7A3FD1', '#0E8FA8'],
      primary: '#9AA8FF',
      accent: '#5EEAD4',
    },
    light: {
      // Light variant = Pearl
      bgGradient: 'linear-gradient(160deg, #F3F4FA 0%, #FFFFFF 50%, #EFEFF8 100%)',
      blobA: '#C5CBF7',
      blobB: '#E0CCF8',
      blobC: '#B4ECE3',
      glassFill: 'rgba(255, 255, 255, 0.70)',
      glassFillStrong: 'rgba(255, 255, 255, 0.86)',
      glassBorder: 'rgba(255, 255, 255, 0.75)',
      glassHighlight: 'rgba(255, 255, 255, 0.95)',
      glassShadow: '0 8px 32px 0 rgba(63, 75, 200, 0.10)',
      blur: 20,
      saturate: 140,
      primary: '#3F4BC8',
      primaryHover: '#2E39B0',
      onPrimary: '#FFFFFF',
      primaryContainer: '#DFE3FD',
      onPrimaryContainer: '#161D6E',
      accent: '#0D9488',
      success: '#16A34A',
      warning: '#D97706',
      danger: '#DC2626',
      text: '#0E122B',
      textMuted: '#383E66',
      textSubtle: '#626A96',
      chartA: '#3F4BC8',
      chartB: '#0D9488',
      chartC: '#8B5CF6',
      chartD: '#F59E0B',
      dockFill: 'rgba(230, 232, 245, 0.85)',
      dockActive: '#FFFFFF',
      surfaceBg: '#F1F2F9',
      surfaceCard: '#FFFFFF',
      surfaceInput: '#FFFFFF',
      surfaceBorder: '#D7DAEC',
    },
    dark: {
      bgGradient: 'linear-gradient(160deg, #05060A 0%, #0A0C14 50%, #0F1322 100%)',
      blobA: '#2F3CA8',
      blobB: '#5D2BA6',
      blobC: '#096E82',
      glassFill: 'rgba(255, 255, 255, 0.05)',
      glassFillStrong: 'rgba(255, 255, 255, 0.10)',
      glassBorder: 'rgba(255, 255, 255, 0.10)',
      glassHighlight: 'rgba(255, 255, 255, 0.15)',
      glassShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.55)',
      blur: 22,
      saturate: 140,
      primary: '#9AA8FF',
      primaryHover: '#B8C3FF',
      onPrimary: '#050718',
      primaryContainer: '#232A66',
      onPrimaryContainer: '#E8ECFF',
      accent: '#5EEAD4',
      success: '#22C55E',
      warning: '#F59E0B',
      danger: '#EF4444',
      text: '#F8FAFC',
      textMuted: '#C5CBD8',
      textSubtle: '#8C94A8',
      chartA: '#9AA8FF',
      chartB: '#5EEAD4',
      chartC: '#C084FC',
      chartD: '#FCD34D',
      dockFill: 'rgba(255, 255, 255, 0.08)',
      dockActive: 'rgba(255, 255, 255, 0.92)',
      surfaceBg: '#040508',
      surfaceCard: '#0C0E17',
      surfaceInput: '#070910',
      surfaceBorder: '#181C2B',
    },
  },
};

/**
 * Migration table mapping legacy color scheme names to modern GlassThemeId.
 * Never loses a user's choice.
 */
export const THEME_MIGRATION_MAP: Record<string, GlassThemeId> = {
  // Direct names
  aurora: 'aurora',
  ocean: 'ocean',
  rose: 'rose',
  emerald: 'emerald',
  sapphire: 'sapphire',
  sunset: 'sunset',
  graphite: 'graphite',
  obsidian: 'obsidian',

  // Legacy mappings requested by spec
  blue: 'sapphire',
  royal: 'sapphire',
  red: 'rose',
  green: 'emerald',
  sage: 'emerald',
  purple: 'aurora',
  terracotta: 'sunset',
  sand: 'sunset',
  amber: 'sunset',
  gold: 'sunset',
  golden: 'sunset',
  indigo: 'obsidian',
  slate: 'graphite',
  expressive: 'aurora',
  black: 'obsidian',
  white: 'graphite',
  mono: 'graphite',
  teal: 'ocean',
};

/**
 * Migrates any raw color string (legacy or modern) to a valid GlassThemeId.
 */
export function migrateColorScheme(rawName?: string): GlassThemeId {
  if (!rawName) return 'aurora';
  const clean = rawName.toLowerCase().trim();
  return THEME_MIGRATION_MAP[clean] || 'aurora';
}

/**
 * Returns the GlassThemeDefinition by id (falls back to aurora).
 */
export function getGlassTheme(id?: string): GlassThemeDefinition {
  const validId = migrateColorScheme(id);
  return GLASS_THEMES[validId] || GLASS_THEMES.aurora;
}

/**
 * Returns the theme variant (tokens) for a given theme id and mode.
 */
export function getGlassThemeTokens(
  id?: string,
  mode: 'light' | 'dark' = 'dark'
): GlassThemeVariant {
  const theme = getGlassTheme(id);
  return mode === 'light' ? theme.light : theme.dark;
}

/**
 * Computes all dynamic liquid glass drawer system tokens using color-mix()
 * derived formulas for any given theme variant and light/dark mode.
 */
export function computeDrawerTokens(
  tokens: GlassThemeVariant,
  mode: 'light' | 'dark' = 'dark'
): DrawerThemeTokens {
  return {
    drawerTint:
      mode === 'light'
        ? `color-mix(in srgb, ${tokens.blobA} 18%, rgba(255, 255, 255, 0.20))`
        : `color-mix(in srgb, ${tokens.blobA} 22%, rgba(255, 255, 255, 0.06))`,
    drawerSheen: `linear-gradient(135deg, color-mix(in srgb, ${tokens.blobB} 28%, white) 0%, transparent 45%, color-mix(in srgb, ${tokens.blobC} 22%, white) 100%)`,
    drawerGlow: `0 24px 60px color-mix(in srgb, ${tokens.primary} 28%, transparent)`,
    drawerEdge: `color-mix(in srgb, ${tokens.primary} 40%, white)`,
    drawerGroup: `color-mix(in srgb, ${tokens.surfaceCard} 55%, transparent)`,
    drawerDivider: `color-mix(in srgb, ${tokens.text} 10%, transparent)`,
    drawerRowPress: `color-mix(in srgb, ${tokens.primary} 14%, transparent)`,
    drawerIcon1: tokens.primary,
    drawerIcon2: tokens.accent,
    drawerIcon3: tokens.chartA,
    drawerIcon4: tokens.chartB,
    drawerIcon5: tokens.chartC,
    drawerIcon6: tokens.chartD,
    drawerIconNeutral: `color-mix(in srgb, ${tokens.text} 55%, ${tokens.surfaceCard})`,
    drawerToggleOn: tokens.primary,
    drawerSegmentedThumb: `color-mix(in srgb, ${tokens.surfaceCard} 88%, ${tokens.primary} 12%)`,
    drawerText: tokens.text,
    drawerTextMuted: tokens.textMuted,
    drawerScrim: `color-mix(in srgb, ${tokens.surfaceBg} 40%, rgba(0, 0, 0, 0.60))`,
    drawerLiteBg: `color-mix(in srgb, ${tokens.surfaceCard} 94%, ${tokens.primary} 6%)`,
  };
}

/**
 * Applies all CSS variables and root attributes for the glass theme.
 */
export function applyGlassThemeToDocument(
  themeId: string,
  mode: 'light' | 'dark',
  options?: {
    liteMode?: boolean;
    animatedBackground?: boolean;
    fontSize?: 'normal' | 'large' | 'extra_large';
  }
) {
  const validId = migrateColorScheme(themeId);
  const theme = GLASS_THEMES[validId] || GLASS_THEMES.aurora;
  const tokens = mode === 'light' ? theme.light : theme.dark;
  const root = document.documentElement;

  // Set mode classes and data-theme
  root.classList.remove('light', 'dark');
  root.classList.add(mode);
  root.setAttribute('data-theme', mode);
  root.setAttribute('data-glass-theme', validId);
  root.style.colorScheme = mode;

  // Font Size Scale
  const fontSize = options?.fontSize || 'normal';
  root.setAttribute('data-font-size', fontSize);
  root.classList.remove('text-size-normal', 'text-size-large', 'text-size-extra_large');
  root.classList.add(`text-size-${fontSize}`);

  // Lite mode class
  if (options?.liteMode) {
    root.classList.add('lite-mode');
  } else {
    root.classList.remove('lite-mode');
  }

  // Animation flag
  if (options?.animatedBackground === false) {
    root.classList.add('animation-paused');
  } else {
    root.classList.remove('animation-paused');
  }

  if (document.body) {
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(mode);
  }

  // Material & Background Tokens
  root.style.setProperty('--bg-gradient', tokens.bgGradient);
  root.style.setProperty('--blob-a', tokens.blobA);
  root.style.setProperty('--blob-b', tokens.blobB);
  root.style.setProperty('--blob-c', tokens.blobC);
  root.style.setProperty('--glass-fill', tokens.glassFill);
  root.style.setProperty('--glass-fill-strong', tokens.glassFillStrong);
  root.style.setProperty('--glass-border', tokens.glassBorder);
  root.style.setProperty('--glass-highlight', tokens.glassHighlight);
  root.style.setProperty('--glass-shadow', tokens.glassShadow);
  root.style.setProperty('--glass-blur', `${tokens.blur}px`);
  root.style.setProperty('--glass-saturate', `${tokens.saturate}%`);

  // Brand & Palette Tokens
  root.style.setProperty('--primary', tokens.primary);
  root.style.setProperty('--primary-hover', tokens.primaryHover);
  root.style.setProperty('--on-primary', tokens.onPrimary);
  root.style.setProperty('--primary-container', tokens.primaryContainer);
  root.style.setProperty('--on-primary-container', tokens.onPrimaryContainer);
  root.style.setProperty('--accent', tokens.accent);
  root.style.setProperty('--success', tokens.success);
  root.style.setProperty('--warning', tokens.warning);
  root.style.setProperty('--danger', tokens.danger);
  root.style.setProperty('--text', tokens.text);
  root.style.setProperty('--text-muted', tokens.textMuted);
  root.style.setProperty('--text-subtle', tokens.textSubtle);

  // Dock Tokens
  root.style.setProperty('--dock-fill', tokens.dockFill);
  root.style.setProperty('--dock-active', tokens.dockActive);

  // Liquid Glass Drawer System Tokens (Dynamic theme derivation with color-mix)
  const drawerTokens = computeDrawerTokens(tokens, mode);
  root.style.setProperty('--drawer-tint', drawerTokens.drawerTint);
  root.style.setProperty('--drawer-sheen', drawerTokens.drawerSheen);
  root.style.setProperty('--drawer-glow', drawerTokens.drawerGlow);
  root.style.setProperty('--drawer-edge', drawerTokens.drawerEdge);
  root.style.setProperty('--drawer-group', drawerTokens.drawerGroup);
  root.style.setProperty('--drawer-divider', drawerTokens.drawerDivider);
  root.style.setProperty('--drawer-row-press', drawerTokens.drawerRowPress);
  root.style.setProperty('--drawer-scrim', drawerTokens.drawerScrim);
  root.style.setProperty('--drawer-lite-bg', drawerTokens.drawerLiteBg);

  // Icon tiles 1..6 and neutral (ordered for destinations)
  root.style.setProperty('--drawer-icon-1', drawerTokens.drawerIcon1);
  root.style.setProperty('--drawer-icon-2', drawerTokens.drawerIcon2);
  root.style.setProperty('--drawer-icon-3', drawerTokens.drawerIcon3);
  root.style.setProperty('--drawer-icon-4', drawerTokens.drawerIcon4);
  root.style.setProperty('--drawer-icon-5', drawerTokens.drawerIcon5);
  root.style.setProperty('--drawer-icon-6', drawerTokens.drawerIcon6);
  root.style.setProperty('--drawer-icon-neutral', drawerTokens.drawerIconNeutral);

  root.style.setProperty('--drawer-toggle-on', drawerTokens.drawerToggleOn);
  root.style.setProperty('--drawer-segmented-thumb', drawerTokens.drawerSegmentedThumb);
  root.style.setProperty('--drawer-text', drawerTokens.drawerText);
  root.style.setProperty('--drawer-text-muted', drawerTokens.drawerTextMuted);

  // Charts
  root.style.setProperty('--chart-a', tokens.chartA);
  root.style.setProperty('--chart-b', tokens.chartB);
  root.style.setProperty('--chart-c', tokens.chartC);
  root.style.setProperty('--chart-d', tokens.chartD);

  // Existing Semantic Surfaces & Input Tokens (preserves all existing views)
  root.style.setProperty('--bg', tokens.surfaceBg);
  root.style.setProperty('--surface', tokens.surfaceCard);
  root.style.setProperty('--surface-2', tokens.surfaceCard);
  root.style.setProperty('--surface-input', tokens.surfaceInput);
  root.style.setProperty('--border', tokens.surfaceBorder);
  root.style.setProperty('--border-strong', tokens.surfaceBorder);
  root.style.setProperty('--focus-ring', `${tokens.primary}55`);

  // Legacy M3 Aliases for 100% backward compatibility
  root.style.setProperty('--theme-primary', tokens.primary);
  root.style.setProperty('--theme-primary-hover', tokens.primaryHover);
  root.style.setProperty('--theme-primary-active', tokens.primaryHover);
  root.style.setProperty('--theme-primary-foreground', tokens.onPrimary);
  root.style.setProperty('--theme-primary-container', tokens.primaryContainer);
  root.style.setProperty('--theme-on-primary-container', tokens.onPrimaryContainer);
  root.style.setProperty('--theme-tonal-bg', tokens.primaryContainer);
  root.style.setProperty('--theme-tonal-border', tokens.surfaceBorder);
  root.style.setProperty('--theme-tonal-text', tokens.onPrimaryContainer);
  root.style.setProperty('--theme-surface-bg', tokens.surfaceBg);
  root.style.setProperty('--theme-surface-card', tokens.surfaceCard);
  root.style.setProperty('--theme-surface-input', tokens.surfaceInput);
  root.style.setProperty('--theme-surface-border', tokens.surfaceBorder);
  root.style.setProperty('--theme-text-primary', tokens.text);
  root.style.setProperty('--theme-text-secondary', tokens.textMuted);
  root.style.setProperty('--theme-text-muted', tokens.textMuted);
  root.style.setProperty('--theme-appbar-bg', tokens.glassFillStrong);
  root.style.setProperty('--theme-nav-indicator-bg', tokens.primaryContainer);
  root.style.setProperty('--theme-nav-indicator-text', tokens.onPrimaryContainer);
  root.style.setProperty('--theme-hero-banner-bg', tokens.primary);
  root.style.setProperty('--theme-hero-banner-text', tokens.onPrimary);
  root.style.setProperty('--theme-hero-banner-muted', `${tokens.onPrimary}CC`);
  root.style.setProperty('--theme-hero-banner-accent', tokens.accent);

  // Meta theme-color tag
  const metaTheme = document.getElementById('meta-theme-color');
  if (metaTheme) {
    metaTheme.setAttribute('content', tokens.surfaceBg);
  }
}

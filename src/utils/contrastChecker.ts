import { GLASS_THEMES, GlassThemeId } from '../theme/glassThemes';

/**
 * Calculates relative luminance of a hex or rgb color string according to WCAG 2.1 specs.
 */
function getLuminance(colorStr: string): number {
  let r = 0, g = 0, b = 0;

  if (colorStr.startsWith('#')) {
    const hex = colorStr.replace('#', '');
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length >= 6) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }
  } else if (colorStr.startsWith('rgb')) {
    const parts = colorStr.match(/\d+/g);
    if (parts && parts.length >= 3) {
      r = parseInt(parts[0], 10);
      g = parseInt(parts[1], 10);
      b = parseInt(parts[2], 10);
    }
  }

  const [sR, sG, sB] = [r, g, b].map((val) => {
    const c = val / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * sR + 0.7152 * sG + 0.0722 * sB;
}

/**
 * Calculates WCAG 2.1 Contrast Ratio between foreground and background.
 */
export function getContrastRatio(fgColor: string, bgColor: string): number {
  const l1 = getLuminance(fgColor);
  const l2 = getLuminance(bgColor);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export interface ContrastResult {
  themeId: GlassThemeId;
  themeName: string;
  mode: 'light' | 'dark';
  pairName: string;
  fg: string;
  bg: string;
  ratio: number;
  passAA: boolean; // >= 4.5:1 (or >= 3:1 for large/disabled)
  passAAA: boolean; // >= 7:1
}

/**
 * Dev-only contrast verification runner for all 8 glass themes in light & dark mode.
 */
export function verifyAllThemeContrasts(): {
  results: ContrastResult[];
  totalChecked: number;
  allPassed: boolean;
} {
  const results: ContrastResult[] = [];

  const themeKeys = Object.keys(GLASS_THEMES) as GlassThemeId[];

  themeKeys.forEach((themeId) => {
    const theme = GLASS_THEMES[themeId];
    (['light', 'dark'] as const).forEach((mode) => {
      const variant = mode === 'light' ? theme.light : theme.dark;

      // 1. Primary text on surfaceCard
      const rTextCard = getContrastRatio(variant.text, variant.surfaceCard);
      results.push({
        themeId,
        themeName: theme.name,
        mode,
        pairName: 'Text on Surface Card',
        fg: variant.text,
        bg: variant.surfaceCard,
        ratio: Number(rTextCard.toFixed(2)),
        passAA: rTextCard >= 4.5,
        passAAA: rTextCard >= 7.0,
      });

      // 2. Text Muted on surfaceCard
      const rMutedCard = getContrastRatio(variant.textMuted, variant.surfaceCard);
      results.push({
        themeId,
        themeName: theme.name,
        mode,
        pairName: 'Text Muted on Surface Card',
        fg: variant.textMuted,
        bg: variant.surfaceCard,
        ratio: Number(rMutedCard.toFixed(2)),
        passAA: rMutedCard >= 4.5,
        passAAA: rMutedCard >= 7.0,
      });

      // 3. Text Subtle (Placeholders) on surfaceCard (Target >= 4.5:1)
      const rSubtleCard = getContrastRatio(variant.textSubtle, variant.surfaceCard);
      results.push({
        themeId,
        themeName: theme.name,
        mode,
        pairName: 'Text Subtle on Surface Card',
        fg: variant.textSubtle,
        bg: variant.surfaceCard,
        ratio: Number(rSubtleCard.toFixed(2)),
        passAA: rSubtleCard >= 4.5,
        passAAA: rSubtleCard >= 7.0,
      });

      // 4. On Primary on Primary Button
      const rOnPrimary = getContrastRatio(variant.onPrimary, variant.primary);
      results.push({
        themeId,
        themeName: theme.name,
        mode,
        pairName: 'onPrimary on Primary',
        fg: variant.onPrimary,
        bg: variant.primary,
        ratio: Number(rOnPrimary.toFixed(2)),
        passAA: rOnPrimary >= 4.5,
        passAAA: rOnPrimary >= 7.0,
      });

      // 5. On Primary Container on Primary Container
      const rOnContainer = getContrastRatio(
        variant.onPrimaryContainer,
        variant.primaryContainer
      );
      results.push({
        themeId,
        themeName: theme.name,
        mode,
        pairName: 'onPrimaryContainer on Container',
        fg: variant.onPrimaryContainer,
        bg: variant.primaryContainer,
        ratio: Number(rOnContainer.toFixed(2)),
        passAA: rOnContainer >= 4.5,
        passAAA: rOnContainer >= 7.0,
      });
    });
  });

  const allPassed = results.every((r) => r.passAA);
  return { results, totalChecked: results.length, allPassed };
}

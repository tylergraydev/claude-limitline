export interface ThemeColors {
  // Block segment
  blockBg: string;
  blockFg: string;

  // Weekly segment
  weeklyBg: string;
  weeklyFg: string;

  // Warning colors (when near limit)
  warningBg: string;
  warningFg: string;

  // Critical colors (at/over limit)
  criticalBg: string;
  criticalFg: string;

  // Progress bar colors
  progressFull: string;
  progressEmpty: string;

  // Separator
  separatorFg: string;
}

// ANSI 256 color codes
const color = (n: number) => `\x1b[38;5;${n}m`;
const bgColor = (n: number) => `\x1b[48;5;${n}m`;

export const themes: Record<string, ThemeColors> = {
  dark: {
    blockBg: bgColor(236),
    blockFg: color(252),
    weeklyBg: bgColor(236),
    weeklyFg: color(252),
    warningBg: bgColor(172),
    warningFg: color(232),
    criticalBg: bgColor(160),
    criticalFg: color(255),
    progressFull: color(76),
    progressEmpty: color(240),
    separatorFg: color(244),
  },

  light: {
    blockBg: bgColor(254),
    blockFg: color(236),
    weeklyBg: bgColor(254),
    weeklyFg: color(236),
    warningBg: bgColor(214),
    warningFg: color(232),
    criticalBg: bgColor(196),
    criticalFg: color(255),
    progressFull: color(34),
    progressEmpty: color(250),
    separatorFg: color(244),
  },

  nord: {
    blockBg: bgColor(236),
    blockFg: color(110),
    weeklyBg: bgColor(236),
    weeklyFg: color(110),
    warningBg: bgColor(179),
    warningFg: color(232),
    criticalBg: bgColor(131),
    criticalFg: color(255),
    progressFull: color(108),
    progressEmpty: color(239),
    separatorFg: color(60),
  },

  gruvbox: {
    blockBg: bgColor(237),
    blockFg: color(223),
    weeklyBg: bgColor(237),
    weeklyFg: color(223),
    warningBg: bgColor(214),
    warningFg: color(235),
    criticalBg: bgColor(167),
    criticalFg: color(235),
    progressFull: color(142),
    progressEmpty: color(239),
    separatorFg: color(246),
  },
};

export function getTheme(name: string): ThemeColors {
  return themes[name] || themes.dark;
}

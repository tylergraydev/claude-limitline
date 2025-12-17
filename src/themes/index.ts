// Segment color definition
export interface SegmentColor {
  bg: string;
  fg: string;
}

// Theme structure matching claude-powerline
export interface ColorTheme {
  directory: SegmentColor;  // Repo/directory name
  git: SegmentColor;        // Git branch
  model: SegmentColor;      // Claude model
  block: SegmentColor;      // 5-hour block usage
  weekly: SegmentColor;     // 7-day weekly usage
  opus: SegmentColor;       // Opus-specific weekly usage
  sonnet: SegmentColor;     // Sonnet-specific weekly usage
  warning: SegmentColor;    // Warning state (near limit)
  critical: SegmentColor;   // Critical state (at/over limit)
}

// Convert hex color to ANSI 256 color code
function hexToAnsi256(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Check for grayscale
  if (r === g && g === b) {
    if (r < 8) return 16;
    if (r > 248) return 231;
    return Math.round((r - 8) / 247 * 24) + 232;
  }

  // Convert to 6x6x6 color cube
  const ri = Math.round(r / 255 * 5);
  const gi = Math.round(g / 255 * 5);
  const bi = Math.round(b / 255 * 5);

  return 16 + 36 * ri + 6 * gi + bi;
}

// ANSI escape code generators
export const ansi = {
  fg: (hex: string) => `\x1b[38;5;${hexToAnsi256(hex)}m`,
  bg: (hex: string) => `\x1b[48;5;${hexToAnsi256(hex)}m`,
  fgRaw: (n: number) => `\x1b[38;5;${n}m`,
  bgRaw: (n: number) => `\x1b[48;5;${n}m`,
  reset: '\x1b[0m',
};

// Get raw ANSI color number from hex
export function hexToRaw(hex: string): number {
  return hexToAnsi256(hex);
}

// Dark theme (default) - matches claude-powerline
export const darkTheme: ColorTheme = {
  directory: { bg: "#8b4513", fg: "#ffffff" },
  git: { bg: "#404040", fg: "#ffffff" },
  model: { bg: "#2d2d2d", fg: "#ffffff" },
  block: { bg: "#2a2a2a", fg: "#87ceeb" },
  weekly: { bg: "#1a1a1a", fg: "#98fb98" },
  opus: { bg: "#1a1a1a", fg: "#c792ea" },      // Purple for Opus
  sonnet: { bg: "#1a1a1a", fg: "#89ddff" },    // Light blue for Sonnet
  warning: { bg: "#d75f00", fg: "#ffffff" },
  critical: { bg: "#af0000", fg: "#ffffff" },
};

// Light theme
export const lightTheme: ColorTheme = {
  directory: { bg: "#ff6b47", fg: "#ffffff" },
  git: { bg: "#4fb3d9", fg: "#ffffff" },
  model: { bg: "#87ceeb", fg: "#000000" },
  block: { bg: "#6366f1", fg: "#ffffff" },
  weekly: { bg: "#10b981", fg: "#ffffff" },
  opus: { bg: "#8b5cf6", fg: "#ffffff" },      // Purple for Opus
  sonnet: { bg: "#0ea5e9", fg: "#ffffff" },    // Sky blue for Sonnet
  warning: { bg: "#f59e0b", fg: "#000000" },
  critical: { bg: "#ef4444", fg: "#ffffff" },
};

// Nord theme
export const nordTheme: ColorTheme = {
  directory: { bg: "#434c5e", fg: "#d8dee9" },
  git: { bg: "#3b4252", fg: "#a3be8c" },
  model: { bg: "#4c566a", fg: "#81a1c1" },
  block: { bg: "#3b4252", fg: "#81a1c1" },
  weekly: { bg: "#2e3440", fg: "#8fbcbb" },
  opus: { bg: "#2e3440", fg: "#b48ead" },      // Nord purple for Opus
  sonnet: { bg: "#2e3440", fg: "#88c0d0" },    // Nord frost for Sonnet
  warning: { bg: "#d08770", fg: "#2e3440" },
  critical: { bg: "#bf616a", fg: "#eceff4" },
};

// Gruvbox theme
export const gruvboxTheme: ColorTheme = {
  directory: { bg: "#504945", fg: "#ebdbb2" },
  git: { bg: "#3c3836", fg: "#b8bb26" },
  model: { bg: "#665c54", fg: "#83a598" },
  block: { bg: "#3c3836", fg: "#83a598" },
  weekly: { bg: "#282828", fg: "#fabd2f" },
  opus: { bg: "#282828", fg: "#d3869b" },      // Gruvbox purple for Opus
  sonnet: { bg: "#282828", fg: "#8ec07c" },    // Gruvbox aqua for Sonnet
  warning: { bg: "#d79921", fg: "#282828" },
  critical: { bg: "#cc241d", fg: "#ebdbb2" },
};

// Tokyo Night theme
export const tokyoNightTheme: ColorTheme = {
  directory: { bg: "#2f334d", fg: "#82aaff" },
  git: { bg: "#1e2030", fg: "#c3e88d" },
  model: { bg: "#191b29", fg: "#fca7ea" },
  block: { bg: "#2d3748", fg: "#7aa2f7" },
  weekly: { bg: "#1a202c", fg: "#4fd6be" },
  opus: { bg: "#1a202c", fg: "#bb9af7" },      // Tokyo purple for Opus
  sonnet: { bg: "#1a202c", fg: "#7dcfff" },    // Tokyo cyan for Sonnet
  warning: { bg: "#e0af68", fg: "#1a1b26" },
  critical: { bg: "#f7768e", fg: "#1a1b26" },
};

// Rose Pine theme
export const rosePineTheme: ColorTheme = {
  directory: { bg: "#26233a", fg: "#c4a7e7" },
  git: { bg: "#1f1d2e", fg: "#9ccfd8" },
  model: { bg: "#191724", fg: "#ebbcba" },
  block: { bg: "#2a273f", fg: "#eb6f92" },
  weekly: { bg: "#232136", fg: "#9ccfd8" },
  opus: { bg: "#232136", fg: "#c4a7e7" },      // Rose Pine iris for Opus
  sonnet: { bg: "#232136", fg: "#31748f" },    // Rose Pine pine for Sonnet
  warning: { bg: "#f6c177", fg: "#191724" },
  critical: { bg: "#eb6f92", fg: "#191724" },
};

// All themes
export const themes: Record<string, ColorTheme> = {
  dark: darkTheme,
  light: lightTheme,
  nord: nordTheme,
  gruvbox: gruvboxTheme,
  "tokyo-night": tokyoNightTheme,
  "rose-pine": rosePineTheme,
};

// Get theme by name
export function getTheme(name: string): ColorTheme {
  return themes[name] || themes.dark;
}

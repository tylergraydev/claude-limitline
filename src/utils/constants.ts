// Powerline symbols
export const SYMBOLS = {
  right: "\ue0b0",
  left: "\ue0b2",
  branch: "\ue0a0",
  separator: "\ue0b1",
  model: "\u2731",           // Heavy asterisk ✱
  block_cost: "\u25eb",      // White square with vertical bisecting line ◫
  weekly_cost: "\u25cb",     // Circle ○
  opus_cost: "\u25c8",       // Diamond with dot ◈
  sonnet_cost: "\u25c7",     // White diamond ◇
  bottleneck: "\u25b2",      // Black up-pointing triangle ▲
  progress_full: "\u2588",   // Full block
  progress_empty: "\u2591",  // Light shade
};

export const TEXT_SYMBOLS = {
  right: ">",
  left: "<",
  branch: "",
  separator: "|",
  model: "*",
  block_cost: "BLK",
  weekly_cost: "WK",
  opus_cost: "Op",
  sonnet_cost: "So",
  bottleneck: "*",
  progress_full: "#",
  progress_empty: "-",
};

// ANSI color codes
export const RESET_CODE = "\x1b[0m";

export const COLORS = {
  // Foreground
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",

  // Background
  bgBlack: "\x1b[40m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
  bgWhite: "\x1b[47m",

  // Bright foreground
  brightBlack: "\x1b[90m",
  brightRed: "\x1b[91m",
  brightGreen: "\x1b[92m",
  brightYellow: "\x1b[93m",
  brightBlue: "\x1b[94m",
  brightMagenta: "\x1b[95m",
  brightCyan: "\x1b[96m",
  brightWhite: "\x1b[97m",
};

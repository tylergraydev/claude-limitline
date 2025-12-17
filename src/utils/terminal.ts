// Terminal utility functions

export function getTerminalWidth(): number {
  return process.stdout.columns || 80;
}

// Calculate visible length of string (excluding ANSI codes)
export function visibleLength(str: string): number {
  // Remove ANSI escape codes
  const stripped = str.replace(/\x1b\[[0-9;]*m/g, "");
  return stripped.length;
}

// Format with ANSI colors
export function colorize(text: string, fg: string, bg?: string): string {
  let result = fg + text;
  if (bg) {
    result = bg + result;
  }
  return result + "\x1b[0m";
}

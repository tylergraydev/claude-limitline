// Debug logging utility
const DEBUG = process.env.CLAUDE_LIMITLINE_DEBUG === "true";

export function debug(...args: unknown[]): void {
  if (DEBUG) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [DEBUG]`, ...args);
  }
}

export function error(...args: unknown[]): void {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [ERROR]`, ...args);
}

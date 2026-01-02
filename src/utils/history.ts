import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { debug } from "./logger.js";

export interface UsageSample {
  timestamp: number;  // Unix ms
  blockPercent: number | null;
  weeklyPercent: number | null;
}

export interface HistoryData {
  samples: UsageSample[];
}

const SPARKLINE_CHARS = "▁▂▃▄▅▆▇█";
const MAX_HISTORY_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const HISTORY_FILE = "limitline-history.json";

function getHistoryPath(): string {
  return path.join(os.homedir(), ".claude", HISTORY_FILE);
}

export function loadHistory(): HistoryData {
  const historyPath = getHistoryPath();
  try {
    if (fs.existsSync(historyPath)) {
      const content = fs.readFileSync(historyPath, "utf-8");
      const data = JSON.parse(content) as HistoryData;
      return data;
    }
  } catch (error) {
    debug("Failed to load history:", error);
  }
  return { samples: [] };
}

export function saveHistory(data: HistoryData): void {
  const historyPath = getHistoryPath();
  try {
    // Ensure directory exists
    const dir = path.dirname(historyPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(historyPath, JSON.stringify(data, null, 2));
  } catch (error) {
    debug("Failed to save history:", error);
  }
}

export function pruneOldSamples(data: HistoryData): HistoryData {
  const cutoff = Date.now() - MAX_HISTORY_AGE_MS;
  return {
    samples: data.samples.filter(s => s.timestamp > cutoff),
  };
}

export function addSample(
  blockPercent: number | null,
  weeklyPercent: number | null
): void {
  const history = loadHistory();

  // Add new sample
  history.samples.push({
    timestamp: Date.now(),
    blockPercent,
    weeklyPercent,
  });

  // Prune old samples and save
  const pruned = pruneOldSamples(history);
  saveHistory(pruned);
}

export function getSparkline(
  samples: (number | null)[],
  width: number
): string {
  // Filter out nulls and get the last 'width' samples
  const validSamples = samples.filter((s): s is number => s !== null);

  if (validSamples.length === 0) {
    return "";
  }

  // Take the last 'width' samples
  const recentSamples = validSamples.slice(-width);

  // Map each value to a sparkline character (0-100 -> 0-7)
  return recentSamples
    .map(value => {
      const clamped = Math.max(0, Math.min(100, value));
      const index = Math.floor((clamped / 100) * 7);
      return SPARKLINE_CHARS[index];
    })
    .join("");
}

export function getBlockSparkline(width: number): string {
  const history = loadHistory();
  const blockSamples = history.samples.map(s => s.blockPercent);
  return getSparkline(blockSamples, width);
}

export function getWeeklySparkline(width: number): string {
  const history = loadHistory();
  const weeklySamples = history.samples.map(s => s.weeklyPercent);
  return getSparkline(weeklySamples, width);
}

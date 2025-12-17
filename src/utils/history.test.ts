import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getSparkline, pruneOldSamples, type HistoryData } from "./history.js";

// Mock fs module
vi.mock("node:fs", () => ({
  default: {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
  },
}));

describe("history utilities", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getSparkline", () => {
    it("generates sparkline from samples", () => {
      const samples = [0, 25, 50, 75, 100];
      const sparkline = getSparkline(samples, 5);

      expect(sparkline).toHaveLength(5);
      // First char should be lowest (0%), last should be highest (100%)
      expect(sparkline[0]).toBe("▁");
      expect(sparkline[4]).toBe("█");
    });

    it("returns empty string for empty samples", () => {
      const sparkline = getSparkline([], 5);
      expect(sparkline).toBe("");
    });

    it("returns empty string for all null samples", () => {
      const sparkline = getSparkline([null, null, null], 5);
      expect(sparkline).toBe("");
    });

    it("filters out null values", () => {
      const samples = [null, 50, null, 100];
      const sparkline = getSparkline(samples, 5);

      expect(sparkline).toHaveLength(2);
    });

    it("limits to specified width", () => {
      const samples = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      const sparkline = getSparkline(samples, 5);

      // Should only take the last 5 samples
      expect(sparkline).toHaveLength(5);
    });

    it("handles values at boundaries correctly", () => {
      // Test edge cases: 0, 50, 100
      const samples = [0, 50, 100];
      const sparkline = getSparkline(samples, 3);

      expect(sparkline[0]).toBe("▁"); // 0%
      expect(sparkline[1]).toBe("▄"); // 50% -> index 3
      expect(sparkline[2]).toBe("█"); // 100% -> index 7
    });

    it("clamps values over 100", () => {
      const samples = [150];
      const sparkline = getSparkline(samples, 1);

      expect(sparkline).toBe("█");
    });

    it("clamps negative values to 0", () => {
      const samples = [-10];
      const sparkline = getSparkline(samples, 1);

      expect(sparkline).toBe("▁");
    });
  });

  describe("pruneOldSamples", () => {
    it("removes samples older than 24 hours", () => {
      const now = Date.now();
      const oldTimestamp = now - 25 * 60 * 60 * 1000; // 25 hours ago
      const recentTimestamp = now - 1 * 60 * 60 * 1000; // 1 hour ago

      const data: HistoryData = {
        samples: [
          { timestamp: oldTimestamp, blockPercent: 50, weeklyPercent: 30 },
          { timestamp: recentTimestamp, blockPercent: 60, weeklyPercent: 40 },
        ],
      };

      const pruned = pruneOldSamples(data);

      expect(pruned.samples).toHaveLength(1);
      expect(pruned.samples[0].timestamp).toBe(recentTimestamp);
    });

    it("keeps all samples if none are old", () => {
      const now = Date.now();
      const data: HistoryData = {
        samples: [
          { timestamp: now - 1000, blockPercent: 50, weeklyPercent: 30 },
          { timestamp: now - 2000, blockPercent: 60, weeklyPercent: 40 },
        ],
      };

      const pruned = pruneOldSamples(data);

      expect(pruned.samples).toHaveLength(2);
    });

    it("handles empty samples array", () => {
      const data: HistoryData = { samples: [] };
      const pruned = pruneOldSamples(data);

      expect(pruned.samples).toHaveLength(0);
    });
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { WeeklyProvider } from "./weekly.js";

// Mock the oauth module
vi.mock("../utils/oauth.js", () => ({
  getRealtimeUsage: vi.fn(),
}));

import { getRealtimeUsage } from "../utils/oauth.js";

describe("WeeklyProvider", () => {
  let provider: WeeklyProvider;

  beforeEach(() => {
    vi.resetAllMocks();
    provider = new WeeklyProvider();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getWeeklyInfo", () => {
    it("returns realtime weekly info when API returns data", async () => {
      const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days from now
      vi.mocked(getRealtimeUsage).mockResolvedValue({
        fiveHour: null,
        sevenDay: {
          percentUsed: 65,
          resetAt: futureDate,
          isOverLimit: false,
        },
        sevenDayOpus: null,
        sevenDaySonnet: null,
      });

      const result = await provider.getWeeklyInfo();

      expect(result.percentUsed).toBe(65);
      expect(result.isRealtime).toBe(true);
      expect(result.resetAt).toEqual(futureDate);
      expect(result.weekProgressPercent).toBeGreaterThanOrEqual(0);
      expect(result.weekProgressPercent).toBeLessThanOrEqual(100);
      expect(result.opusPercentUsed).toBeNull();
      expect(result.sonnetPercentUsed).toBeNull();
    });

    it("returns null values and calculated week progress when API returns no sevenDay data", async () => {
      vi.mocked(getRealtimeUsage).mockResolvedValue({
        fiveHour: {
          percentUsed: 25,
          resetAt: new Date(),
          isOverLimit: false,
        },
        sevenDay: null,
        sevenDayOpus: null,
        sevenDaySonnet: null,
      });

      const result = await provider.getWeeklyInfo();

      expect(result.percentUsed).toBeNull();
      expect(result.resetAt).toBeNull();
      expect(result.isRealtime).toBe(false);
      expect(result.weekProgressPercent).toBeGreaterThanOrEqual(0);
      expect(result.weekProgressPercent).toBeLessThanOrEqual(100);
    });

    it("returns model-specific usage when Opus data is available", async () => {
      const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      vi.mocked(getRealtimeUsage).mockResolvedValue({
        fiveHour: null,
        sevenDay: {
          percentUsed: 47,
          resetAt: futureDate,
          isOverLimit: false,
        },
        sevenDayOpus: {
          percentUsed: 15,
          resetAt: futureDate,
          isOverLimit: false,
        },
        sevenDaySonnet: null,
      });

      const result = await provider.getWeeklyInfo();

      expect(result.percentUsed).toBe(47);
      expect(result.opusPercentUsed).toBe(15);
      expect(result.sonnetPercentUsed).toBeNull();
      expect(result.opusResetAt).toEqual(futureDate);
      expect(result.sonnetResetAt).toBeNull();
    });

    it("returns model-specific usage when Sonnet data is available", async () => {
      const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      vi.mocked(getRealtimeUsage).mockResolvedValue({
        fiveHour: null,
        sevenDay: {
          percentUsed: 47,
          resetAt: futureDate,
          isOverLimit: false,
        },
        sevenDayOpus: null,
        sevenDaySonnet: {
          percentUsed: 7,
          resetAt: futureDate,
          isOverLimit: false,
        },
      });

      const result = await provider.getWeeklyInfo();

      expect(result.percentUsed).toBe(47);
      expect(result.opusPercentUsed).toBeNull();
      expect(result.sonnetPercentUsed).toBe(7);
      expect(result.opusResetAt).toBeNull();
      expect(result.sonnetResetAt).toEqual(futureDate);
    });

    it("returns all model-specific usage when both are available", async () => {
      const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      vi.mocked(getRealtimeUsage).mockResolvedValue({
        fiveHour: null,
        sevenDay: {
          percentUsed: 47,
          resetAt: futureDate,
          isOverLimit: false,
        },
        sevenDayOpus: {
          percentUsed: 15,
          resetAt: futureDate,
          isOverLimit: false,
        },
        sevenDaySonnet: {
          percentUsed: 7,
          resetAt: futureDate,
          isOverLimit: false,
        },
      });

      const result = await provider.getWeeklyInfo();

      expect(result.percentUsed).toBe(47);
      expect(result.opusPercentUsed).toBe(15);
      expect(result.sonnetPercentUsed).toBe(7);
    });

    it("returns null values when API returns null", async () => {
      vi.mocked(getRealtimeUsage).mockResolvedValue(null);

      const result = await provider.getWeeklyInfo();

      expect(result.percentUsed).toBeNull();
      expect(result.isRealtime).toBe(false);
    });

    it("uses custom poll interval", async () => {
      vi.mocked(getRealtimeUsage).mockResolvedValue(null);

      await provider.getWeeklyInfo(undefined, undefined, undefined, 30);

      expect(getRealtimeUsage).toHaveBeenCalledWith(30);
    });

    it("uses default poll interval of 15 when not specified", async () => {
      vi.mocked(getRealtimeUsage).mockResolvedValue(null);

      await provider.getWeeklyInfo();

      expect(getRealtimeUsage).toHaveBeenCalledWith(15);
    });

    it("handles API errors gracefully", async () => {
      vi.mocked(getRealtimeUsage).mockRejectedValue(new Error("Network error"));

      const result = await provider.getWeeklyInfo();

      expect(result.percentUsed).toBeNull();
      expect(result.isRealtime).toBe(false);
    });

    it("calculates week progress from API reset time", async () => {
      // Reset time 2 days from now means we're 5 days into the week (71%)
      const twoDaysFromNow = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      vi.mocked(getRealtimeUsage).mockResolvedValue({
        fiveHour: null,
        sevenDay: {
          percentUsed: 50,
          resetAt: twoDaysFromNow,
          isOverLimit: false,
        },
        sevenDayOpus: null,
        sevenDaySonnet: null,
      });

      const result = await provider.getWeeklyInfo();

      // Should be around 71% (5/7 days)
      expect(result.weekProgressPercent).toBeGreaterThan(60);
      expect(result.weekProgressPercent).toBeLessThan(80);
    });
  });

  describe("week progress calculation (fallback mode)", () => {
    beforeEach(() => {
      vi.mocked(getRealtimeUsage).mockResolvedValue(null);
    });

    it("calculates progress with default Monday reset", async () => {
      const result = await provider.getWeeklyInfo();

      expect(result.weekProgressPercent).toBeGreaterThanOrEqual(0);
      expect(result.weekProgressPercent).toBeLessThanOrEqual(100);
    });

    it("accepts custom reset day", async () => {
      // Reset on Sunday (0)
      const result = await provider.getWeeklyInfo(0);

      expect(result.weekProgressPercent).toBeGreaterThanOrEqual(0);
      expect(result.weekProgressPercent).toBeLessThanOrEqual(100);
    });

    it("accepts custom reset hour and minute", async () => {
      const result = await provider.getWeeklyInfo(1, 12, 30); // Monday at 12:30

      expect(result.weekProgressPercent).toBeGreaterThanOrEqual(0);
      expect(result.weekProgressPercent).toBeLessThanOrEqual(100);
    });
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BlockProvider } from "./block.js";

// Mock the oauth module
vi.mock("../utils/oauth.js", () => ({
  getRealtimeUsage: vi.fn(),
}));

import { getRealtimeUsage } from "../utils/oauth.js";

describe("BlockProvider", () => {
  let provider: BlockProvider;

  beforeEach(() => {
    vi.resetAllMocks();
    provider = new BlockProvider();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getBlockInfo", () => {
    it("returns realtime block info when API returns data", async () => {
      const futureDate = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3 hours from now
      vi.mocked(getRealtimeUsage).mockResolvedValue({
        fiveHour: {
          percentUsed: 45,
          resetAt: futureDate,
          isOverLimit: false,
        },
        sevenDay: null,
      });

      const result = await provider.getBlockInfo(15);

      expect(result.percentUsed).toBe(45);
      expect(result.isRealtime).toBe(true);
      expect(result.timeRemaining).toBeGreaterThan(0);
      expect(result.resetAt).toEqual(futureDate);
    });

    it("calculates correct time remaining", async () => {
      const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
      vi.mocked(getRealtimeUsage).mockResolvedValue({
        fiveHour: {
          percentUsed: 30,
          resetAt: twoHoursFromNow,
          isOverLimit: false,
        },
        sevenDay: null,
      });

      const result = await provider.getBlockInfo();

      // Should be approximately 120 minutes (2 hours)
      expect(result.timeRemaining).toBeGreaterThanOrEqual(119);
      expect(result.timeRemaining).toBeLessThanOrEqual(121);
    });

    it("returns null values when API returns no fiveHour data", async () => {
      vi.mocked(getRealtimeUsage).mockResolvedValue({
        fiveHour: null,
        sevenDay: {
          percentUsed: 50,
          resetAt: new Date(),
          isOverLimit: false,
        },
      });

      const result = await provider.getBlockInfo();

      expect(result.percentUsed).toBeNull();
      expect(result.resetAt).toBeNull();
      expect(result.timeRemaining).toBeNull();
      expect(result.isRealtime).toBe(false);
    });

    it("returns null values when API returns null", async () => {
      vi.mocked(getRealtimeUsage).mockResolvedValue(null);

      const result = await provider.getBlockInfo();

      expect(result.percentUsed).toBeNull();
      expect(result.resetAt).toBeNull();
      expect(result.timeRemaining).toBeNull();
      expect(result.isRealtime).toBe(false);
    });

    it("uses custom poll interval", async () => {
      vi.mocked(getRealtimeUsage).mockResolvedValue(null);

      await provider.getBlockInfo(30);

      expect(getRealtimeUsage).toHaveBeenCalledWith(30);
    });

    it("uses default poll interval of 15 when not specified", async () => {
      vi.mocked(getRealtimeUsage).mockResolvedValue(null);

      await provider.getBlockInfo();

      expect(getRealtimeUsage).toHaveBeenCalledWith(15);
    });

    it("handles zero time remaining when reset time is past", async () => {
      const pastDate = new Date(Date.now() - 1000); // 1 second ago
      vi.mocked(getRealtimeUsage).mockResolvedValue({
        fiveHour: {
          percentUsed: 100,
          resetAt: pastDate,
          isOverLimit: true,
        },
        sevenDay: null,
      });

      const result = await provider.getBlockInfo();

      expect(result.timeRemaining).toBe(0);
    });

    it("handles API errors gracefully", async () => {
      vi.mocked(getRealtimeUsage).mockRejectedValue(new Error("Network error"));

      const result = await provider.getBlockInfo();

      expect(result.percentUsed).toBeNull();
      expect(result.isRealtime).toBe(false);
    });
  });
});

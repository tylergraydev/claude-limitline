import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchUsageFromAPI,
  getUsageTrend,
  getRealtimeUsage,
  clearUsageCache,
  getOAuthToken,
} from "./oauth.js";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Mock fs and child_process
vi.mock("node:fs", () => ({
  default: {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
  },
}));

import fs from "node:fs";

describe("oauth utilities", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    clearUsageCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("fetchUsageFromAPI", () => {
    it("returns parsed usage data on success", async () => {
      const mockResponse = {
        five_hour: {
          resets_at: "2025-01-15T12:00:00Z",
          utilization: 45.5,
        },
        seven_day: {
          resets_at: "2025-01-20T00:00:00Z",
          utilization: 30.2,
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await fetchUsageFromAPI("test-token");

      expect(result).not.toBeNull();
      expect(result?.fiveHour?.percentUsed).toBe(45.5);
      expect(result?.sevenDay?.percentUsed).toBe(30.2);
      expect(result?.fiveHour?.isOverLimit).toBe(false);
    });

    it("sets isOverLimit to true when utilization >= 100", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            five_hour: { utilization: 100 },
            seven_day: { utilization: 150 },
          }),
      });

      const result = await fetchUsageFromAPI("test-token");

      expect(result?.fiveHour?.isOverLimit).toBe(true);
      expect(result?.sevenDay?.isOverLimit).toBe(true);
    });

    it("returns null when API returns error status", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      });

      const result = await fetchUsageFromAPI("invalid-token");

      expect(result).toBeNull();
    });

    it("returns null when fetch throws", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      const result = await fetchUsageFromAPI("test-token");

      expect(result).toBeNull();
    });

    it("handles missing five_hour data", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            seven_day: { utilization: 50 },
          }),
      });

      const result = await fetchUsageFromAPI("test-token");

      expect(result?.fiveHour).toBeNull();
      expect(result?.sevenDay?.percentUsed).toBe(50);
    });

    it("handles missing seven_day data", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            five_hour: { utilization: 25 },
          }),
      });

      const result = await fetchUsageFromAPI("test-token");

      expect(result?.fiveHour?.percentUsed).toBe(25);
      expect(result?.sevenDay).toBeNull();
    });

    it("parses seven_day_opus when present", async () => {
      const mockResponse = {
        five_hour: { utilization: 29.0, resets_at: "2025-01-15T12:00:00Z" },
        seven_day: { utilization: 47.0, resets_at: "2025-01-20T00:00:00Z" },
        seven_day_opus: { utilization: 15.0, resets_at: "2025-01-20T00:00:00Z" },
        seven_day_sonnet: null,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await fetchUsageFromAPI("test-token");

      expect(result?.sevenDayOpus?.percentUsed).toBe(15.0);
      expect(result?.sevenDaySonnet).toBeNull();
    });

    it("parses seven_day_sonnet when present", async () => {
      const mockResponse = {
        five_hour: { utilization: 29.0, resets_at: "2025-01-15T12:00:00Z" },
        seven_day: { utilization: 47.0, resets_at: "2025-01-20T00:00:00Z" },
        seven_day_opus: null,
        seven_day_sonnet: { utilization: 7.0, resets_at: "2025-01-20T00:00:00Z" },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await fetchUsageFromAPI("test-token");

      expect(result?.sevenDayOpus).toBeNull();
      expect(result?.sevenDaySonnet?.percentUsed).toBe(7.0);
    });

    it("parses all model-specific limits when present", async () => {
      const mockResponse = {
        five_hour: { utilization: 29.0, resets_at: "2025-01-15T12:00:00Z" },
        seven_day: { utilization: 47.0, resets_at: "2025-01-20T00:00:00Z" },
        seven_day_opus: { utilization: 15.0, resets_at: "2025-01-20T00:00:00Z" },
        seven_day_sonnet: { utilization: 7.0, resets_at: "2025-01-20T00:00:00Z" },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await fetchUsageFromAPI("test-token");

      expect(result?.sevenDay?.percentUsed).toBe(47.0);
      expect(result?.sevenDayOpus?.percentUsed).toBe(15.0);
      expect(result?.sevenDaySonnet?.percentUsed).toBe(7.0);
    });

    it("sends correct headers", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await fetchUsageFromAPI("my-token");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.anthropic.com/api/oauth/usage",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: "Bearer my-token",
            "anthropic-beta": "oauth-2025-04-20",
          }),
        })
      );
    });
  });

  describe("getUsageTrend", () => {
    it("returns null trends when no cached data", () => {
      clearUsageCache();
      const trend = getUsageTrend();

      expect(trend.fiveHourTrend).toBeNull();
      expect(trend.sevenDayTrend).toBeNull();
      expect(trend.sevenDayOpusTrend).toBeNull();
      expect(trend.sevenDaySonnetTrend).toBeNull();
    });

    // Note: Testing trends with actual API calls requires integration tests
    // The trend comparison depends on module-level state (cachedUsage, previousUsage)
    // that persists between calls. The getRealtimeUsage function also calls
    // platform-specific code that is difficult to mock without complex setup.
  });

  describe("clearUsageCache", () => {
    it("is a function that can be called", () => {
      // clearUsageCache resets internal module state
      // We can't easily test the effect without integration tests
      expect(() => clearUsageCache()).not.toThrow();
    });
  });

  describe("getOAuthToken", () => {
    it("returns null for unsupported platform", async () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, "platform", { value: "freebsd" });

      const token = await getOAuthToken();

      expect(token).toBeNull();

      Object.defineProperty(process, "platform", { value: originalPlatform });
    });
  });
});

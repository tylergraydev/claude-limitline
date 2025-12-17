import { debug } from "../utils/logger.js";
import { getRealtimeUsage } from "../utils/oauth.js";

export interface BlockInfo {
  percentUsed: number | null;
  resetAt: Date | null;
  timeRemaining: number | null; // minutes
  isRealtime: boolean;
}

export class BlockProvider {
  async getBlockInfo(pollInterval?: number): Promise<BlockInfo> {
    // Try to get data from OAuth API (realtime mode)
    const realtimeInfo = await this.getRealtimeBlockInfo(pollInterval);
    if (realtimeInfo) {
      return realtimeInfo;
    }

    // Fallback - no data available
    debug("Realtime mode failed, no block data available");
    return {
      percentUsed: null,
      resetAt: null,
      timeRemaining: null,
      isRealtime: false,
    };
  }

  private async getRealtimeBlockInfo(
    pollInterval?: number
  ): Promise<BlockInfo | null> {
    try {
      const usage = await getRealtimeUsage(pollInterval ?? 15);
      if (!usage || !usage.fiveHour) {
        debug("No realtime block usage data available");
        return null;
      }

      const fiveHour = usage.fiveHour;

      // Calculate time remaining from reset time
      const now = new Date();
      const resetAt = new Date(fiveHour.resetAt);
      const timeRemaining = Math.max(
        0,
        Math.round((resetAt.getTime() - now.getTime()) / (1000 * 60))
      );

      debug(
        `Block segment (realtime): ${fiveHour.percentUsed}% used, resets at ${fiveHour.resetAt.toISOString()}, ${timeRemaining}m remaining`
      );

      return {
        percentUsed: fiveHour.percentUsed,
        resetAt: fiveHour.resetAt,
        timeRemaining,
        isRealtime: true,
      };
    } catch (error) {
      debug("Error getting realtime block info:", error);
      return null;
    }
  }
}

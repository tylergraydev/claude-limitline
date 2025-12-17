import { SYMBOLS, TEXT_SYMBOLS, RESET_CODE } from "./utils/constants.js";
import { getTheme, ansi, type ColorTheme, type SegmentColor } from "./themes/index.js";
import { type LimitlineConfig, type SegmentName } from "./config/index.js";
import { type BlockInfo } from "./segments/block.js";
import { type WeeklyInfo } from "./segments/weekly.js";
import { type EnvironmentInfo } from "./utils/environment.js";
import { type TrendInfo } from "./utils/oauth.js";
import { getTerminalWidth } from "./utils/terminal.js";

interface SymbolSet {
  block: string;
  weekly: string;
  opus: string;
  sonnet: string;
  bottleneck: string;
  rightArrow: string;
  separator: string;
  branch: string;
  model: string;
  progressFull: string;
  progressEmpty: string;
  trendUp: string;
  trendDown: string;
}

interface Segment {
  text: string;
  colors: SegmentColor;
}

interface RenderContext {
  blockInfo: BlockInfo | null;
  weeklyInfo: WeeklyInfo | null;
  envInfo: EnvironmentInfo;
  trendInfo: TrendInfo | null;
  compact: boolean;
}

export class Renderer {
  private config: LimitlineConfig;
  private theme: ColorTheme;
  private symbols: SymbolSet;
  private usePowerline: boolean;

  constructor(config: LimitlineConfig) {
    this.config = config;
    this.theme = getTheme(config.theme || "dark");

    const useNerd = config.display?.useNerdFonts ?? true;
    const symbolSet = useNerd ? SYMBOLS : TEXT_SYMBOLS;
    this.usePowerline = useNerd;

    this.symbols = {
      block: symbolSet.block_cost,
      weekly: symbolSet.weekly_cost,
      opus: symbolSet.opus_cost,
      sonnet: symbolSet.sonnet_cost,
      bottleneck: symbolSet.bottleneck,
      rightArrow: symbolSet.right,
      separator: symbolSet.separator,
      branch: symbolSet.branch,
      model: symbolSet.model,
      progressFull: symbolSet.progress_full,
      progressEmpty: symbolSet.progress_empty,
      trendUp: "↑",
      trendDown: "↓",
    };
  }

  private isCompactMode(): boolean {
    const mode = this.config.display?.compactMode ?? "auto";
    if (mode === "always") return true;
    if (mode === "never") return false;

    // Auto mode - check terminal width
    const threshold = this.config.display?.compactWidth ?? 80;
    const termWidth = getTerminalWidth();
    return termWidth < threshold;
  }

  private formatProgressBar(percent: number, width: number): string {
    const filled = Math.round((percent / 100) * width);
    const empty = width - filled;
    return this.symbols.progressFull.repeat(filled) + this.symbols.progressEmpty.repeat(empty);
  }

  private formatTimeRemaining(minutes: number, compact: boolean): string {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      if (compact) {
        return mins > 0 ? `${hours}h${mins}m` : `${hours}h`;
      }
      return mins > 0 ? `${hours}h${mins}m` : `${hours}h`;
    }
    return `${minutes}m`;
  }

  private getTrendSymbol(trend: "up" | "down" | "same" | null): string {
    if (!this.config.showTrend) return "";
    if (trend === "up") return this.symbols.trendUp;
    if (trend === "down") return this.symbols.trendDown;
    return "";
  }

  private getColorsForPercent(percent: number, baseColors: SegmentColor): SegmentColor {
    const threshold = this.config.budget?.warningThreshold ?? 80;

    if (percent >= 100) {
      return this.theme.critical;
    } else if (percent >= threshold) {
      return this.theme.warning;
    }
    return baseColors;
  }

  private renderPowerline(segments: Segment[]): string {
    if (segments.length === 0) return "";

    let output = "";

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const nextColors = i < segments.length - 1 ? segments[i + 1].colors : null;

      // Segment content with background and foreground
      output += ansi.bg(seg.colors.bg) + ansi.fg(seg.colors.fg) + seg.text;

      // Powerline arrow
      output += RESET_CODE;
      if (nextColors) {
        // Arrow: current bg as fg, next bg as bg
        output += ansi.fg(seg.colors.bg) + ansi.bg(nextColors.bg) + this.symbols.rightArrow;
      } else {
        // Final arrow to terminal background
        output += ansi.fg(seg.colors.bg) + this.symbols.rightArrow;
      }
    }

    output += RESET_CODE;
    return output;
  }

  private renderFallback(segments: Segment[]): string {
    return segments
      .map(seg => ansi.bg(seg.colors.bg) + ansi.fg(seg.colors.fg) + seg.text + RESET_CODE)
      .join(` ${this.symbols.separator} `);
  }

  private renderDirectory(ctx: RenderContext): Segment | null {
    if (!this.config.directory?.enabled || !ctx.envInfo.directory) {
      return null;
    }

    const name = ctx.compact && ctx.envInfo.directory.length > 12
      ? ctx.envInfo.directory.slice(0, 10) + "…"
      : ctx.envInfo.directory;

    return {
      text: ` ${name} `,
      colors: this.theme.directory,
    };
  }

  private renderGit(ctx: RenderContext): Segment | null {
    if (!this.config.git?.enabled || !ctx.envInfo.gitBranch) {
      return null;
    }

    const dirtyIndicator = ctx.envInfo.gitDirty ? " ●" : "";
    const icon = this.usePowerline ? this.symbols.branch : "";
    const prefix = icon ? `${icon} ` : "";

    let branch = ctx.envInfo.gitBranch;
    if (ctx.compact && branch.length > 10) {
      branch = branch.slice(0, 8) + "…";
    }

    return {
      text: ` ${prefix}${branch}${dirtyIndicator} `,
      colors: this.theme.git,
    };
  }

  private renderModel(ctx: RenderContext): Segment | null {
    if (!this.config.model?.enabled || !ctx.envInfo.model) {
      return null;
    }

    const icon = this.usePowerline ? this.symbols.model : "";
    const prefix = icon ? `${icon} ` : "";

    return {
      text: ` ${prefix}${ctx.envInfo.model} `,
      colors: this.theme.model,
    };
  }

  private renderBlock(ctx: RenderContext): Segment | null {
    if (!ctx.blockInfo || !this.config.block?.enabled) {
      return null;
    }

    const icon = this.usePowerline ? this.symbols.block : "BLK";

    if (ctx.blockInfo.percentUsed === null) {
      return {
        text: ` ${icon} -- `,
        colors: this.theme.block,
      };
    }

    const percent = ctx.blockInfo.percentUsed;
    const colors = this.getColorsForPercent(percent, this.theme.block);
    const displayStyle = this.config.block.displayStyle || "text";
    const barWidth = this.config.block.barWidth || 10;
    const showTime = this.config.block.showTimeRemaining ?? true;

    // Get trend symbol
    const trend = this.getTrendSymbol(ctx.trendInfo?.fiveHourTrend ?? null);

    let text: string;

    if (displayStyle === "bar" && !ctx.compact) {
      const bar = this.formatProgressBar(percent, barWidth);
      text = `${bar} ${Math.round(percent)}%${trend}`;
    } else {
      text = `${Math.round(percent)}%${trend}`;
    }

    // Add time remaining if available and enabled (skip in compact mode)
    if (showTime && ctx.blockInfo.timeRemaining !== null && !ctx.compact) {
      const timeStr = this.formatTimeRemaining(ctx.blockInfo.timeRemaining, ctx.compact);
      text += ` (${timeStr})`;
    }

    return {
      text: ` ${icon} ${text} `,
      colors,
    };
  }

  private renderWeeklySimple(ctx: RenderContext): Segment | null {
    const info = ctx.weeklyInfo!;
    const icon = this.usePowerline ? this.symbols.weekly : "WK";

    if (info.percentUsed === null) {
      return {
        text: ` ${icon} -- `,
        colors: this.theme.weekly,
      };
    }

    const percent = info.percentUsed;
    const displayStyle = this.config.weekly?.displayStyle || "text";
    const barWidth = this.config.weekly?.barWidth || 10;
    const showWeekProgress = this.config.weekly?.showWeekProgress ?? true;

    // Get trend symbol
    const trend = this.getTrendSymbol(ctx.trendInfo?.sevenDayTrend ?? null);

    let text: string;

    if (displayStyle === "bar" && !ctx.compact) {
      const bar = this.formatProgressBar(percent, barWidth);
      text = `${bar} ${Math.round(percent)}%${trend}`;
    } else {
      text = `${Math.round(percent)}%${trend}`;
    }

    // Add week progress if enabled (skip in compact mode)
    if (showWeekProgress && !ctx.compact) {
      text += ` (wk ${info.weekProgressPercent}%)`;
    }

    return {
      text: ` ${icon} ${text} `,
      colors: this.theme.weekly,
    };
  }

  private renderWeeklySmart(ctx: RenderContext): Segment | null {
    const info = ctx.weeklyInfo!;
    const overallIcon = this.usePowerline ? this.symbols.weekly : "All";
    const sonnetIcon = this.usePowerline ? this.symbols.sonnet : "So";
    const showWeekProgress = this.config.weekly?.showWeekProgress ?? true;

    // Detect current model from environment
    const currentModel = ctx.envInfo.model?.toLowerCase() ?? "";
    const isSonnet = currentModel.includes("sonnet");

    // If using Sonnet and we have Sonnet-specific data, show: Sonnet | Overall
    if (isSonnet && info.sonnetPercentUsed !== null && info.percentUsed !== null) {
      const sonnetTrend = this.getTrendSymbol(ctx.trendInfo?.sevenDaySonnetTrend ?? null);
      const overallTrend = this.getTrendSymbol(ctx.trendInfo?.sevenDayTrend ?? null);

      let text = `${sonnetIcon}${Math.round(info.sonnetPercentUsed)}%${sonnetTrend} | ${overallIcon}${Math.round(info.percentUsed)}%${overallTrend}`;

      if (showWeekProgress && !ctx.compact) {
        text += ` (wk ${info.weekProgressPercent}%)`;
      }

      // Use warning/critical colors based on highest percentage
      const maxPercent = Math.max(info.sonnetPercentUsed, info.percentUsed);
      const colors = this.getColorsForPercent(maxPercent, this.theme.weekly);

      return {
        text: ` ${text} `,
        colors,
      };
    }

    // For Opus, Haiku, or when no model-specific data: just show overall
    if (info.percentUsed === null) {
      return {
        text: ` ${overallIcon} -- `,
        colors: this.theme.weekly,
      };
    }

    const trend = this.getTrendSymbol(ctx.trendInfo?.sevenDayTrend ?? null);
    let text = `${overallIcon}${Math.round(info.percentUsed)}%${trend}`;

    if (showWeekProgress && !ctx.compact) {
      text += ` (wk ${info.weekProgressPercent}%)`;
    }

    const colors = this.getColorsForPercent(info.percentUsed, this.theme.weekly);

    return {
      text: ` ${text} `,
      colors,
    };
  }

  private renderWeekly(ctx: RenderContext): Segment | null {
    if (!ctx.weeklyInfo || !this.config.weekly?.enabled) {
      return null;
    }

    const viewMode = this.config.weekly?.viewMode ?? "simple";

    switch (viewMode) {
      case "smart":
        return this.renderWeeklySmart(ctx);
      case "simple":
      default:
        return this.renderWeeklySimple(ctx);
    }
  }

  private getSegment(name: SegmentName, ctx: RenderContext): Segment | null {
    switch (name) {
      case "directory":
        return this.renderDirectory(ctx);
      case "git":
        return this.renderGit(ctx);
      case "model":
        return this.renderModel(ctx);
      case "block":
        return this.renderBlock(ctx);
      case "weekly":
        return this.renderWeekly(ctx);
      default:
        return null;
    }
  }

  render(
    blockInfo: BlockInfo | null,
    weeklyInfo: WeeklyInfo | null,
    envInfo: EnvironmentInfo,
    trendInfo: TrendInfo | null = null
  ): string {
    const compact = this.isCompactMode();
    const ctx: RenderContext = {
      blockInfo,
      weeklyInfo,
      envInfo,
      trendInfo,
      compact,
    };

    const segments: Segment[] = [];

    // Use configured segment order, or default
    const order = this.config.segmentOrder ?? ["directory", "git", "model", "block", "weekly"];

    for (const name of order) {
      const segment = this.getSegment(name, ctx);
      if (segment) {
        segments.push(segment);
      }
    }

    if (segments.length === 0) {
      return "";
    }

    if (this.usePowerline) {
      return this.renderPowerline(segments);
    } else {
      return this.renderFallback(segments);
    }
  }
}

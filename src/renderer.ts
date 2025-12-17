import { SYMBOLS, TEXT_SYMBOLS, RESET_CODE } from "./utils/constants.js";
import { getTheme, ansi, hexToRaw, type ColorTheme, type SegmentColor } from "./themes/index.js";
import { type LimitlineConfig } from "./config/index.js";
import { type BlockInfo } from "./segments/block.js";
import { type WeeklyInfo } from "./segments/weekly.js";
import { type EnvironmentInfo } from "./utils/environment.js";

interface SymbolSet {
  block: string;
  weekly: string;
  rightArrow: string;
  separator: string;
  branch: string;
  model: string;
  progressFull: string;
  progressEmpty: string;
}

interface Segment {
  text: string;
  colors: SegmentColor;
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
      rightArrow: symbolSet.right,
      separator: symbolSet.separator,
      branch: symbolSet.branch,
      model: "\uf0e7", // Lightning bolt for model
      progressFull: symbolSet.progress_full,
      progressEmpty: symbolSet.progress_empty,
    };
  }

  private formatProgressBar(percent: number, width: number): string {
    const filled = Math.round((percent / 100) * width);
    const empty = width - filled;
    return this.symbols.progressFull.repeat(filled) + this.symbols.progressEmpty.repeat(empty);
  }

  private formatTimeRemaining(minutes: number): string {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h${mins}m` : `${hours}h`;
    }
    return `${minutes}m`;
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

  renderDirectory(envInfo: EnvironmentInfo): Segment | null {
    if (!this.config.directory?.enabled || !envInfo.directory) {
      return null;
    }

    return {
      text: ` ${envInfo.directory} `,
      colors: this.theme.directory,
    };
  }

  renderGit(envInfo: EnvironmentInfo): Segment | null {
    if (!this.config.git?.enabled || !envInfo.gitBranch) {
      return null;
    }

    const dirtyIndicator = envInfo.gitDirty ? " ●" : "";
    const icon = this.usePowerline ? this.symbols.branch : "";
    const prefix = icon ? `${icon} ` : "";

    return {
      text: ` ${prefix}${envInfo.gitBranch}${dirtyIndicator} `,
      colors: this.theme.git,
    };
  }

  renderModel(envInfo: EnvironmentInfo): Segment | null {
    if (!this.config.model?.enabled || !envInfo.model) {
      return null;
    }

    const icon = this.usePowerline ? this.symbols.model : "";
    const prefix = icon ? `${icon} ` : "";

    return {
      text: ` ${prefix}${envInfo.model} `,
      colors: this.theme.model,
    };
  }

  renderBlock(blockInfo: BlockInfo | null): Segment | null {
    if (!blockInfo || !this.config.block?.enabled) {
      return null;
    }

    const icon = this.usePowerline ? this.symbols.block : "BLK";

    if (blockInfo.percentUsed === null) {
      return {
        text: ` ${icon} -- `,
        colors: this.theme.block,
      };
    }

    const percent = blockInfo.percentUsed;
    const colors = this.getColorsForPercent(percent, this.theme.block);
    const displayStyle = this.config.block.displayStyle || "text";
    const barWidth = this.config.block.barWidth || 10;
    const showTime = this.config.block.showTimeRemaining ?? true;

    let text: string;

    if (displayStyle === "bar") {
      const bar = this.formatProgressBar(percent, barWidth);
      text = `${bar} ${Math.round(percent)}%`;
    } else {
      text = `${Math.round(percent)}%`;
    }

    // Add time remaining if available and enabled
    if (showTime && blockInfo.timeRemaining !== null) {
      const timeStr = this.formatTimeRemaining(blockInfo.timeRemaining);
      text += ` (${timeStr})`;
    }

    return {
      text: ` ${icon} ${text} `,
      colors,
    };
  }

  renderWeekly(weeklyInfo: WeeklyInfo | null): Segment | null {
    if (!weeklyInfo || !this.config.weekly?.enabled) {
      return null;
    }

    const icon = this.usePowerline ? this.symbols.weekly : "WK";

    if (weeklyInfo.percentUsed === null) {
      return {
        text: ` ${icon} -- `,
        colors: this.theme.weekly,
      };
    }

    const percent = weeklyInfo.percentUsed;
    const displayStyle = this.config.weekly.displayStyle || "text";
    const barWidth = this.config.weekly.barWidth || 10;
    const showWeekProgress = this.config.weekly.showWeekProgress ?? true;

    let text: string;

    if (displayStyle === "bar") {
      const bar = this.formatProgressBar(percent, barWidth);
      text = `${bar} ${Math.round(percent)}%`;
    } else {
      text = `${Math.round(percent)}%`;
    }

    // Add week progress if enabled
    if (showWeekProgress) {
      text += ` (wk ${weeklyInfo.weekProgressPercent}%)`;
    }

    return {
      text: ` ${icon} ${text} `,
      colors: this.theme.weekly,
    };
  }

  render(
    blockInfo: BlockInfo | null,
    weeklyInfo: WeeklyInfo | null,
    envInfo: EnvironmentInfo
  ): string {
    const segments: Segment[] = [];

    // Directory/repo name
    const dirSegment = this.renderDirectory(envInfo);
    if (dirSegment) segments.push(dirSegment);

    // Git branch
    const gitSegment = this.renderGit(envInfo);
    if (gitSegment) segments.push(gitSegment);

    // Model
    const modelSegment = this.renderModel(envInfo);
    if (modelSegment) segments.push(modelSegment);

    // 5-hour block usage
    const blockSegment = this.renderBlock(blockInfo);
    if (blockSegment) segments.push(blockSegment);

    // Weekly usage
    const weeklySegment = this.renderWeekly(weeklyInfo);
    if (weeklySegment) segments.push(weeklySegment);

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

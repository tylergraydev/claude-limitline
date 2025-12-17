import { SYMBOLS, TEXT_SYMBOLS, RESET_CODE } from "./utils/constants.js";
import { getTheme, type ThemeColors } from "./themes/index.js";
import { type LimitlineConfig } from "./config/index.js";
import { type BlockInfo } from "./segments/block.js";
import { type WeeklyInfo } from "./segments/weekly.js";

interface SymbolSet {
  block: string;
  weekly: string;
  separator: string;
  progressFull: string;
  progressEmpty: string;
}

export class Renderer {
  private config: LimitlineConfig;
  private theme: ThemeColors;
  private symbols: SymbolSet;

  constructor(config: LimitlineConfig) {
    this.config = config;
    this.theme = getTheme(config.theme || "dark");

    const useNerd = config.display?.useNerdFonts ?? true;
    const symbolSet = useNerd ? SYMBOLS : TEXT_SYMBOLS;

    this.symbols = {
      block: symbolSet.block_cost,
      weekly: symbolSet.weekly_cost,
      separator: symbolSet.separator,
      progressFull: symbolSet.progress_full,
      progressEmpty: symbolSet.progress_empty,
    };
  }

  private formatProgressBar(percent: number, width: number, colors: ThemeColors): string {
    const filled = Math.round((percent / 100) * width);
    const empty = width - filled;

    const filledBar = colors.progressFull + this.symbols.progressFull.repeat(filled);
    const emptyBar = colors.progressEmpty + this.symbols.progressEmpty.repeat(empty);

    return filledBar + emptyBar + RESET_CODE;
  }

  private formatTimeRemaining(minutes: number): string {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes}m`;
  }

  private getColorForPercent(percent: number, colors: ThemeColors): { bg: string; fg: string } {
    const threshold = this.config.budget?.warningThreshold ?? 80;

    if (percent >= 100) {
      return { bg: colors.criticalBg, fg: colors.criticalFg };
    } else if (percent >= threshold) {
      return { bg: colors.warningBg, fg: colors.warningFg };
    }
    return { bg: colors.blockBg, fg: colors.blockFg };
  }

  renderBlock(blockInfo: BlockInfo | null): string {
    if (!blockInfo || !this.config.block?.enabled) {
      return "";
    }

    if (blockInfo.percentUsed === null) {
      return `${this.symbols.block} --`;
    }

    const percent = blockInfo.percentUsed;
    const displayStyle = this.config.block.displayStyle || "bar";
    const barWidth = this.config.block.barWidth || 10;
    const showTime = this.config.block.showTimeRemaining ?? true;

    let display: string;

    if (displayStyle === "bar") {
      const bar = this.formatProgressBar(percent, barWidth, this.theme);
      display = `${bar} ${Math.round(percent)}%`;
    } else {
      display = `${Math.round(percent)}%`;
    }

    // Add time remaining if available and enabled
    if (showTime && blockInfo.timeRemaining !== null) {
      const timeStr = this.formatTimeRemaining(blockInfo.timeRemaining);
      display += ` (${timeStr} left)`;
    }

    return `${this.symbols.block} ${display}`;
  }

  renderWeekly(weeklyInfo: WeeklyInfo | null): string {
    if (!weeklyInfo || !this.config.weekly?.enabled) {
      return "";
    }

    if (weeklyInfo.percentUsed === null) {
      return `${this.symbols.weekly} --`;
    }

    const percent = weeklyInfo.percentUsed;
    const displayStyle = this.config.weekly.displayStyle || "bar";
    const barWidth = this.config.weekly.barWidth || 10;
    const showWeekProgress = this.config.weekly.showWeekProgress ?? true;

    let display: string;

    if (displayStyle === "bar") {
      const bar = this.formatProgressBar(percent, barWidth, this.theme);
      display = `${bar} ${Math.round(percent)}%`;
    } else {
      display = `${Math.round(percent)}%`;
    }

    // Add week progress if enabled
    if (showWeekProgress) {
      display += ` (wk ${weeklyInfo.weekProgressPercent}%)`;
    }

    return `${this.symbols.weekly} ${display}`;
  }

  render(blockInfo: BlockInfo | null, weeklyInfo: WeeklyInfo | null): string {
    const parts: string[] = [];

    const blockSegment = this.renderBlock(blockInfo);
    if (blockSegment) {
      parts.push(blockSegment);
    }

    const weeklySegment = this.renderWeekly(weeklyInfo);
    if (weeklySegment) {
      parts.push(weeklySegment);
    }

    if (parts.length === 0) {
      return "";
    }

    const separator = ` ${this.theme.separatorFg}${this.symbols.separator}${RESET_CODE} `;
    return parts.join(separator);
  }
}

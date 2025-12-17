export interface SegmentConfig {
  enabled: boolean;
  displayStyle?: "text" | "bar";
  barWidth?: number;
}

export interface BlockSegmentConfig extends SegmentConfig {
  showTimeRemaining?: boolean;
}

export interface WeeklySegmentConfig extends SegmentConfig {
  showWeekProgress?: boolean;
}

export interface BudgetConfig {
  pollInterval?: number; // minutes between API calls (default 15)
  resetDay?: number;     // 0=Sunday, 1=Monday, ..., 6=Saturday
  resetHour?: number;    // 0-23
  resetMinute?: number;  // 0-59
  warningThreshold?: number; // percentage to show warning color
}

export interface DisplayConfig {
  style?: "powerline" | "minimal" | "capsule";
  useNerdFonts?: boolean;
}

export interface LimitlineConfig {
  display?: DisplayConfig;
  block?: BlockSegmentConfig;
  weekly?: WeeklySegmentConfig;
  budget?: BudgetConfig;
  theme?: string;
}

export const DEFAULT_CONFIG: LimitlineConfig = {
  display: {
    style: "minimal",
    useNerdFonts: true,
  },
  block: {
    enabled: true,
    displayStyle: "bar",
    barWidth: 10,
    showTimeRemaining: true,
  },
  weekly: {
    enabled: true,
    displayStyle: "bar",
    barWidth: 10,
    showWeekProgress: true,
  },
  budget: {
    pollInterval: 15,
    warningThreshold: 80,
  },
  theme: "dark",
};

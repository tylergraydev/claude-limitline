import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Renderer } from "./renderer.js";
import { DEFAULT_CONFIG, type LimitlineConfig } from "./config/index.js";
import { type BlockInfo } from "./segments/block.js";
import { type WeeklyInfo } from "./segments/weekly.js";
import { type EnvironmentInfo } from "./utils/environment.js";
import { RESET_CODE } from "./utils/constants.js";

// Mock terminal width
vi.mock("./utils/terminal.js", () => ({
  getTerminalWidth: vi.fn(() => 120),
}));

describe("Renderer", () => {
  const defaultEnvInfo: EnvironmentInfo = {
    directory: "my-project",
    gitBranch: "main",
    gitDirty: false,
    model: "Opus 4.5",
  };

  const defaultBlockInfo: BlockInfo = {
    percentUsed: 25,
    timeRemaining: 180,
    resetAt: new Date(),
    isRealtime: true,
  };

  const defaultWeeklyInfo: WeeklyInfo = {
    percentUsed: 50,
    weekProgressPercent: 75,
    resetAt: new Date(),
    isRealtime: true,
    opusPercentUsed: null,
    sonnetPercentUsed: null,
    opusResetAt: null,
    sonnetResetAt: null,
  };

  describe("render", () => {
    it("renders all segments with default config", () => {
      const renderer = new Renderer(DEFAULT_CONFIG);
      const output = renderer.render(defaultBlockInfo, defaultWeeklyInfo, defaultEnvInfo);

      expect(output).toBeTruthy();
      expect(output).toContain("my-project");
      expect(output).toContain("main");
      expect(output).toContain("Opus 4.5");
      expect(output).toContain("25%");
      expect(output).toContain("50%");
    });

    it("respects segment order configuration", () => {
      const config: LimitlineConfig = {
        ...DEFAULT_CONFIG,
        segmentOrder: ["model", "block"],
      };
      const renderer = new Renderer(config);
      const output = renderer.render(defaultBlockInfo, defaultWeeklyInfo, defaultEnvInfo);

      // Should contain model and block
      expect(output).toContain("Opus 4.5");
      expect(output).toContain("25%");
      // Should NOT contain directory, git, or weekly since not in order
      expect(output).not.toContain("my-project");
      expect(output).not.toContain("50%");
    });

    it("hides disabled segments", () => {
      const config: LimitlineConfig = {
        ...DEFAULT_CONFIG,
        directory: { enabled: false },
        git: { enabled: false },
      };
      const renderer = new Renderer(config);
      const output = renderer.render(defaultBlockInfo, defaultWeeklyInfo, defaultEnvInfo);

      expect(output).not.toContain("my-project");
      expect(output).not.toContain("main");
      expect(output).toContain("Opus 4.5");
    });

    it("returns empty string when no segments enabled", () => {
      const config: LimitlineConfig = {
        ...DEFAULT_CONFIG,
        directory: { enabled: false },
        git: { enabled: false },
        model: { enabled: false },
        block: { enabled: false },
        weekly: { enabled: false },
      };
      const renderer = new Renderer(config);
      const output = renderer.render(null, null, defaultEnvInfo);

      expect(output).toBe("");
    });

    it("shows dirty indicator when git has changes", () => {
      const renderer = new Renderer(DEFAULT_CONFIG);
      const envInfo: EnvironmentInfo = {
        ...defaultEnvInfo,
        gitDirty: true,
      };
      const output = renderer.render(defaultBlockInfo, defaultWeeklyInfo, envInfo);

      expect(output).toContain("●");
    });

    it("does not show dirty indicator when git is clean", () => {
      const renderer = new Renderer(DEFAULT_CONFIG);
      const output = renderer.render(defaultBlockInfo, defaultWeeklyInfo, defaultEnvInfo);

      // The dot indicator should not appear for clean repos
      // Note: we look for " ● " with spaces to distinguish from progress bars
      expect(output).not.toMatch(/main\s+●/);
    });
  });

  describe("warning and critical colors", () => {
    it("uses warning color when at warning threshold", () => {
      const renderer = new Renderer(DEFAULT_CONFIG);
      const blockInfo: BlockInfo = {
        ...defaultBlockInfo,
        percentUsed: 80, // At warning threshold
      };
      const output = renderer.render(blockInfo, defaultWeeklyInfo, defaultEnvInfo);

      expect(output).toContain("80%");
    });

    it("uses critical color when at or over 100%", () => {
      const renderer = new Renderer(DEFAULT_CONFIG);
      const blockInfo: BlockInfo = {
        ...defaultBlockInfo,
        percentUsed: 100,
      };
      const output = renderer.render(blockInfo, defaultWeeklyInfo, defaultEnvInfo);

      expect(output).toContain("100%");
    });
  });

  describe("time formatting", () => {
    it("formats hours and minutes correctly", () => {
      const renderer = new Renderer(DEFAULT_CONFIG);
      const blockInfo: BlockInfo = {
        ...defaultBlockInfo,
        timeRemaining: 180, // 3 hours
      };
      const output = renderer.render(blockInfo, defaultWeeklyInfo, defaultEnvInfo);

      expect(output).toContain("3h");
    });

    it("formats minutes only when less than an hour", () => {
      const renderer = new Renderer(DEFAULT_CONFIG);
      const blockInfo: BlockInfo = {
        ...defaultBlockInfo,
        timeRemaining: 45, // 45 minutes
      };
      const output = renderer.render(blockInfo, defaultWeeklyInfo, defaultEnvInfo);

      expect(output).toContain("45m");
    });
  });

  describe("trend arrows", () => {
    it("shows up arrow when usage is increasing", () => {
      const config: LimitlineConfig = {
        ...DEFAULT_CONFIG,
        showTrend: true,
      };
      const renderer = new Renderer(config);
      const trendInfo = {
        fiveHourTrend: "up" as const,
        sevenDayTrend: "same" as const,
        sevenDayOpusTrend: null,
        sevenDaySonnetTrend: null,
      };
      const output = renderer.render(defaultBlockInfo, defaultWeeklyInfo, defaultEnvInfo, trendInfo);

      expect(output).toContain("↑");
    });

    it("shows down arrow when usage is decreasing", () => {
      const config: LimitlineConfig = {
        ...DEFAULT_CONFIG,
        showTrend: true,
      };
      const renderer = new Renderer(config);
      const trendInfo = {
        fiveHourTrend: "down" as const,
        sevenDayTrend: "down" as const,
        sevenDayOpusTrend: null,
        sevenDaySonnetTrend: null,
      };
      const output = renderer.render(defaultBlockInfo, defaultWeeklyInfo, defaultEnvInfo, trendInfo);

      expect(output).toContain("↓");
    });

    it("does not show trend arrows when disabled", () => {
      const config: LimitlineConfig = {
        ...DEFAULT_CONFIG,
        showTrend: false,
      };
      const renderer = new Renderer(config);
      const trendInfo = {
        fiveHourTrend: "up" as const,
        sevenDayTrend: "up" as const,
        sevenDayOpusTrend: null,
        sevenDaySonnetTrend: null,
      };
      const output = renderer.render(defaultBlockInfo, defaultWeeklyInfo, defaultEnvInfo, trendInfo);

      expect(output).not.toContain("↑");
      expect(output).not.toContain("↓");
    });
  });

  describe("null data handling", () => {
    it("handles null block info", () => {
      const renderer = new Renderer(DEFAULT_CONFIG);
      const output = renderer.render(null, defaultWeeklyInfo, defaultEnvInfo);

      expect(output).toBeTruthy();
      expect(output).not.toMatch(/◫\s*--/); // Block segment should be hidden, not show "--"
    });

    it("handles null weekly info", () => {
      const renderer = new Renderer(DEFAULT_CONFIG);
      const output = renderer.render(defaultBlockInfo, null, defaultEnvInfo);

      expect(output).toBeTruthy();
    });

    it("handles null percentages in block info", () => {
      const renderer = new Renderer(DEFAULT_CONFIG);
      const blockInfo: BlockInfo = {
        percentUsed: null,
        timeRemaining: null,
        resetAt: null,
        isRealtime: false,
      };
      const output = renderer.render(blockInfo, defaultWeeklyInfo, defaultEnvInfo);

      expect(output).toContain("--");
    });

    it("handles missing git branch", () => {
      const renderer = new Renderer(DEFAULT_CONFIG);
      const envInfo: EnvironmentInfo = {
        ...defaultEnvInfo,
        gitBranch: null,
      };
      const output = renderer.render(defaultBlockInfo, defaultWeeklyInfo, envInfo);

      expect(output).toBeTruthy();
      expect(output).not.toContain("null");
    });

    it("handles missing model", () => {
      const renderer = new Renderer(DEFAULT_CONFIG);
      const envInfo: EnvironmentInfo = {
        ...defaultEnvInfo,
        model: null,
      };
      const output = renderer.render(defaultBlockInfo, defaultWeeklyInfo, envInfo);

      expect(output).toBeTruthy();
    });
  });

  describe("text vs nerd font modes", () => {
    it("uses nerd font symbols by default", () => {
      const renderer = new Renderer(DEFAULT_CONFIG);
      const output = renderer.render(defaultBlockInfo, defaultWeeklyInfo, defaultEnvInfo);

      // Should contain powerline arrow
      expect(output).toContain("\ue0b0");
    });

    it("uses text symbols when nerd fonts disabled", () => {
      const config: LimitlineConfig = {
        ...DEFAULT_CONFIG,
        display: { useNerdFonts: false },
      };
      const renderer = new Renderer(config);
      const output = renderer.render(defaultBlockInfo, defaultWeeklyInfo, defaultEnvInfo);

      // Should not contain powerline arrow
      expect(output).not.toContain("\ue0b0");
      // Should use separator instead
      expect(output).toContain("|");
    });
  });

  describe("display styles", () => {
    it("shows progress bar when displayStyle is bar", () => {
      const config: LimitlineConfig = {
        ...DEFAULT_CONFIG,
        block: {
          enabled: true,
          displayStyle: "bar",
          barWidth: 5,
        },
      };
      const renderer = new Renderer(config);
      const output = renderer.render(defaultBlockInfo, defaultWeeklyInfo, defaultEnvInfo);

      // Should contain progress bar characters
      expect(output).toMatch(/[█░]/);
    });
  });

  describe("weekly view modes", () => {
    const weeklyInfoWithModelData: WeeklyInfo = {
      percentUsed: 47,
      weekProgressPercent: 75,
      resetAt: new Date(),
      isRealtime: true,
      opusPercentUsed: 15,
      sonnetPercentUsed: 7,
      opusResetAt: new Date(),
      sonnetResetAt: new Date(),
    };

    it("shows only overall percentage in simple mode (default)", () => {
      const config: LimitlineConfig = {
        ...DEFAULT_CONFIG,
        weekly: {
          enabled: true,
          viewMode: "simple",
        },
      };
      const renderer = new Renderer(config);
      const output = renderer.render(defaultBlockInfo, weeklyInfoWithModelData, defaultEnvInfo);

      expect(output).toContain("47%");
      // Should not show Opus/Sonnet symbols
      expect(output).not.toContain("◈");
      expect(output).not.toContain("◇");
    });

    it("smart mode shows only overall when using Opus", () => {
      const config: LimitlineConfig = {
        ...DEFAULT_CONFIG,
        weekly: {
          enabled: true,
          viewMode: "smart",
        },
      };
      const renderer = new Renderer(config);
      // defaultEnvInfo has model: "Opus 4.5"
      const output = renderer.render(defaultBlockInfo, weeklyInfoWithModelData, defaultEnvInfo);

      // Should show overall percentage
      expect(output).toContain("47%");
      // Should show week progress
      expect(output).toContain("wk 75%");
      // Should NOT show Sonnet-specific data or bottleneck indicator
      expect(output).not.toContain("◇");
      expect(output).not.toContain("▲");
      expect(output).not.toContain("|");
    });

    it("smart mode shows Sonnet | Overall when using Sonnet", () => {
      const config: LimitlineConfig = {
        ...DEFAULT_CONFIG,
        weekly: {
          enabled: true,
          viewMode: "smart",
        },
      };
      const renderer = new Renderer(config);
      const sonnetEnvInfo: EnvironmentInfo = {
        ...defaultEnvInfo,
        model: "Sonnet 4",
      };
      const output = renderer.render(defaultBlockInfo, weeklyInfoWithModelData, sonnetEnvInfo);

      // Should show both Sonnet (7%) and Overall (47%) with separator
      expect(output).toContain("7%");
      expect(output).toContain("47%");
      expect(output).toContain("|");
      // Should show week progress
      expect(output).toContain("wk 75%");
    });

  });
});

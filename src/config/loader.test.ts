import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { loadConfig } from "./loader.js";
import { DEFAULT_CONFIG } from "./types.js";

vi.mock("node:fs");
vi.mock("node:os");

describe("loadConfig", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(os.homedir).mockReturnValue("/home/user");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns DEFAULT_CONFIG when no config file exists", () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);

    const config = loadConfig();

    expect(config).toEqual(DEFAULT_CONFIG);
  });

  it("loads config from current working directory first", () => {
    const cwdConfig = { theme: "nord" };

    vi.mocked(fs.existsSync).mockImplementation((filePath) => {
      return filePath === path.join(process.cwd(), ".claude-limitline.json");
    });
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(cwdConfig));

    const config = loadConfig();

    expect(config.theme).toBe("nord");
    expect(fs.readFileSync).toHaveBeenCalledWith(
      path.join(process.cwd(), ".claude-limitline.json"),
      "utf-8"
    );
  });

  it("loads config from ~/.claude/ if cwd config not found", () => {
    const homeConfig = { theme: "gruvbox" };

    vi.mocked(fs.existsSync).mockImplementation((filePath) => {
      return filePath === path.join("/home/user", ".claude", "claude-limitline.json");
    });
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(homeConfig));

    const config = loadConfig();

    expect(config.theme).toBe("gruvbox");
  });

  it("merges user config with defaults", () => {
    const userConfig = {
      theme: "tokyo-night",
      block: { enabled: false },
    };

    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(userConfig));

    const config = loadConfig();

    expect(config.theme).toBe("tokyo-night");
    expect(config.block?.enabled).toBe(false);
    // Should preserve other defaults
    expect(config.weekly?.enabled).toBe(true);
    expect(config.display?.useNerdFonts).toBe(true);
  });

  it("handles invalid JSON gracefully", () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue("not valid json {");

    const config = loadConfig();

    expect(config).toEqual(DEFAULT_CONFIG);
  });

  it("preserves segment order from user config", () => {
    const userConfig = {
      segmentOrder: ["model", "block", "weekly"],
    };

    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(userConfig));

    const config = loadConfig();

    expect(config.segmentOrder).toEqual(["model", "block", "weekly"]);
  });

  it("handles compact mode settings", () => {
    const userConfig = {
      display: {
        compactMode: "always",
        compactWidth: 60,
      },
    };

    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(userConfig));

    const config = loadConfig();

    expect(config.display?.compactMode).toBe("always");
    expect(config.display?.compactWidth).toBe(60);
  });
});

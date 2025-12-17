import { describe, it, expect } from "vitest";
import {
  getTheme,
  themes,
  ansi,
  hexToRaw,
  darkTheme,
  lightTheme,
  nordTheme,
  gruvboxTheme,
  tokyoNightTheme,
  rosePineTheme,
} from "./index.js";

describe("themes", () => {
  describe("getTheme", () => {
    it("returns dark theme by default", () => {
      const theme = getTheme("dark");
      expect(theme).toBe(darkTheme);
    });

    it("returns light theme when requested", () => {
      const theme = getTheme("light");
      expect(theme).toBe(lightTheme);
    });

    it("returns nord theme when requested", () => {
      const theme = getTheme("nord");
      expect(theme).toBe(nordTheme);
    });

    it("returns gruvbox theme when requested", () => {
      const theme = getTheme("gruvbox");
      expect(theme).toBe(gruvboxTheme);
    });

    it("returns tokyo-night theme when requested", () => {
      const theme = getTheme("tokyo-night");
      expect(theme).toBe(tokyoNightTheme);
    });

    it("returns rose-pine theme when requested", () => {
      const theme = getTheme("rose-pine");
      expect(theme).toBe(rosePineTheme);
    });

    it("falls back to dark theme for unknown theme names", () => {
      const theme = getTheme("unknown-theme");
      expect(theme).toBe(darkTheme);
    });

    it("falls back to dark theme for empty string", () => {
      const theme = getTheme("");
      expect(theme).toBe(darkTheme);
    });
  });

  describe("theme structure", () => {
    const allThemes = Object.entries(themes);

    it.each(allThemes)("%s theme has all required segments", (name, theme) => {
      expect(theme).toHaveProperty("directory");
      expect(theme).toHaveProperty("git");
      expect(theme).toHaveProperty("model");
      expect(theme).toHaveProperty("block");
      expect(theme).toHaveProperty("weekly");
      expect(theme).toHaveProperty("warning");
      expect(theme).toHaveProperty("critical");
    });

    it.each(allThemes)("%s theme segments have bg and fg colors", (name, theme) => {
      const segments = ["directory", "git", "model", "block", "weekly", "warning", "critical"];
      for (const segment of segments) {
        expect(theme[segment as keyof typeof theme]).toHaveProperty("bg");
        expect(theme[segment as keyof typeof theme]).toHaveProperty("fg");
      }
    });

    it.each(allThemes)("%s theme colors are valid hex codes", (name, theme) => {
      const hexRegex = /^#[0-9a-fA-F]{6}$/;
      const segments = ["directory", "git", "model", "block", "weekly", "warning", "critical"];
      for (const segment of segments) {
        const colors = theme[segment as keyof typeof theme];
        expect(colors.bg).toMatch(hexRegex);
        expect(colors.fg).toMatch(hexRegex);
      }
    });
  });

  describe("hexToRaw", () => {
    it("converts black to ANSI 16", () => {
      expect(hexToRaw("#000000")).toBe(16);
    });

    it("converts white to ANSI 231", () => {
      expect(hexToRaw("#ffffff")).toBe(231);
    });

    it("converts pure red", () => {
      const result = hexToRaw("#ff0000");
      expect(result).toBeGreaterThanOrEqual(16);
      expect(result).toBeLessThanOrEqual(231);
    });

    it("converts pure green", () => {
      const result = hexToRaw("#00ff00");
      expect(result).toBeGreaterThanOrEqual(16);
      expect(result).toBeLessThanOrEqual(231);
    });

    it("converts pure blue", () => {
      const result = hexToRaw("#0000ff");
      expect(result).toBeGreaterThanOrEqual(16);
      expect(result).toBeLessThanOrEqual(231);
    });

    it("converts grayscale colors", () => {
      const gray = hexToRaw("#808080");
      expect(gray).toBeGreaterThanOrEqual(232);
      expect(gray).toBeLessThanOrEqual(255);
    });
  });

  describe("ansi", () => {
    it("generates foreground escape code", () => {
      const code = ansi.fg("#ff0000");
      expect(code).toMatch(/^\x1b\[38;5;\d+m$/);
    });

    it("generates background escape code", () => {
      const code = ansi.bg("#00ff00");
      expect(code).toMatch(/^\x1b\[48;5;\d+m$/);
    });

    it("generates raw foreground escape code", () => {
      const code = ansi.fgRaw(196);
      expect(code).toBe("\x1b[38;5;196m");
    });

    it("generates raw background escape code", () => {
      const code = ansi.bgRaw(46);
      expect(code).toBe("\x1b[48;5;46m");
    });

    it("has reset code", () => {
      expect(ansi.reset).toBe("\x1b[0m");
    });
  });
});

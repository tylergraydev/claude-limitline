import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getTerminalWidth, visibleLength, colorize } from "./terminal.js";

describe("terminal utilities", () => {
  describe("getTerminalWidth", () => {
    const originalColumns = process.stdout.columns;

    afterEach(() => {
      Object.defineProperty(process.stdout, "columns", {
        value: originalColumns,
        writable: true,
      });
    });

    it("returns stdout columns when available", () => {
      Object.defineProperty(process.stdout, "columns", {
        value: 120,
        writable: true,
      });

      expect(getTerminalWidth()).toBe(120);
    });

    it("returns 80 as default when columns is undefined", () => {
      Object.defineProperty(process.stdout, "columns", {
        value: undefined,
        writable: true,
      });

      expect(getTerminalWidth()).toBe(80);
    });

    it("returns 80 as default when columns is 0", () => {
      Object.defineProperty(process.stdout, "columns", {
        value: 0,
        writable: true,
      });

      expect(getTerminalWidth()).toBe(80);
    });
  });

  describe("visibleLength", () => {
    it("returns correct length for plain string", () => {
      expect(visibleLength("hello")).toBe(5);
    });

    it("strips ANSI color codes from string", () => {
      const colored = "\x1b[31mhello\x1b[0m";
      expect(visibleLength(colored)).toBe(5);
    });

    it("strips multiple ANSI codes", () => {
      const multiColored = "\x1b[31m\x1b[44mhello\x1b[0m world\x1b[32m!\x1b[0m";
      expect(visibleLength(multiColored)).toBe(12); // "hello world!"
    });

    it("handles 256 color codes", () => {
      const colored256 = "\x1b[38;5;196mred\x1b[0m";
      expect(visibleLength(colored256)).toBe(3);
    });

    it("handles background colors", () => {
      const bgColored = "\x1b[48;5;21mblue bg\x1b[0m";
      expect(visibleLength(bgColored)).toBe(7);
    });

    it("returns 0 for empty string", () => {
      expect(visibleLength("")).toBe(0);
    });

    it("returns 0 for string with only ANSI codes", () => {
      expect(visibleLength("\x1b[31m\x1b[0m")).toBe(0);
    });
  });

  describe("colorize", () => {
    it("wraps text with foreground color and reset", () => {
      const result = colorize("test", "\x1b[31m");
      expect(result).toBe("\x1b[31mtest\x1b[0m");
    });

    it("wraps text with foreground and background colors", () => {
      const result = colorize("test", "\x1b[31m", "\x1b[44m");
      expect(result).toBe("\x1b[44m\x1b[31mtest\x1b[0m");
    });

    it("handles empty text", () => {
      const result = colorize("", "\x1b[31m");
      expect(result).toBe("\x1b[31m\x1b[0m");
    });
  });
});

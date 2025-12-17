import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("logger", () => {
  const originalEnv = process.env;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    consoleErrorSpy.mockRestore();
  });

  describe("debug", () => {
    it("logs when CLAUDE_LIMITLINE_DEBUG is true", async () => {
      process.env.CLAUDE_LIMITLINE_DEBUG = "true";
      const { debug } = await import("./logger.js");

      debug("test message");

      expect(consoleErrorSpy).toHaveBeenCalled();
      const call = consoleErrorSpy.mock.calls[0];
      expect(call[0]).toMatch(/\[DEBUG\]/);
      expect(call[1]).toBe("test message");
    });

    it("does not log when CLAUDE_LIMITLINE_DEBUG is not set", async () => {
      delete process.env.CLAUDE_LIMITLINE_DEBUG;
      const { debug } = await import("./logger.js");

      debug("test message");

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it("does not log when CLAUDE_LIMITLINE_DEBUG is false", async () => {
      process.env.CLAUDE_LIMITLINE_DEBUG = "false";
      const { debug } = await import("./logger.js");

      debug("test message");

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it("includes timestamp in debug output", async () => {
      process.env.CLAUDE_LIMITLINE_DEBUG = "true";
      const { debug } = await import("./logger.js");

      debug("test");

      const call = consoleErrorSpy.mock.calls[0];
      // Timestamp format: [2025-01-15T12:34:56.789Z]
      expect(call[0]).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it("handles multiple arguments", async () => {
      process.env.CLAUDE_LIMITLINE_DEBUG = "true";
      const { debug } = await import("./logger.js");

      debug("message", { key: "value" }, 123);

      expect(consoleErrorSpy).toHaveBeenCalled();
      const call = consoleErrorSpy.mock.calls[0];
      expect(call[1]).toBe("message");
      expect(call[2]).toEqual({ key: "value" });
      expect(call[3]).toBe(123);
    });
  });

  describe("error", () => {
    it("always logs errors regardless of DEBUG setting", async () => {
      delete process.env.CLAUDE_LIMITLINE_DEBUG;
      const { error } = await import("./logger.js");

      error("error message");

      expect(consoleErrorSpy).toHaveBeenCalled();
      const call = consoleErrorSpy.mock.calls[0];
      expect(call[0]).toMatch(/\[ERROR\]/);
      expect(call[1]).toBe("error message");
    });

    it("includes timestamp in error output", async () => {
      const { error } = await import("./logger.js");

      error("test error");

      const call = consoleErrorSpy.mock.calls[0];
      expect(call[0]).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it("handles multiple arguments", async () => {
      const { error } = await import("./logger.js");

      error("error", new Error("test"), { context: "info" });

      expect(consoleErrorSpy).toHaveBeenCalled();
      const call = consoleErrorSpy.mock.calls[0];
      expect(call[1]).toBe("error");
      expect(call[2]).toBeInstanceOf(Error);
      expect(call[3]).toEqual({ context: "info" });
    });
  });
});

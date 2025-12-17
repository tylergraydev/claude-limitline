import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getDirectoryName, getClaudeModel } from "./environment.js";

describe("environment", () => {
  describe("getDirectoryName", () => {
    it("returns project_dir basename from hook data", () => {
      const hookData = {
        workspace: {
          current_dir: "/home/user/projects/myapp/src",
          project_dir: "/home/user/projects/myapp",
        },
      };
      expect(getDirectoryName(hookData)).toBe("myapp");
    });

    it("returns cwd basename from hook data when no workspace", () => {
      const hookData = {
        cwd: "/home/user/projects/another-project",
      };
      expect(getDirectoryName(hookData)).toBe("another-project");
    });

    it("returns process.cwd basename when no hook data", () => {
      const result = getDirectoryName(null);
      // Should return the basename of current working directory
      expect(result).toBeTruthy();
      expect(typeof result).toBe("string");
    });

    it("handles Windows paths", () => {
      const hookData = {
        workspace: {
          current_dir: "C:\\Users\\user\\projects\\app\\src",
          project_dir: "C:\\Users\\user\\projects\\app",
        },
      };
      expect(getDirectoryName(hookData)).toBe("app");
    });
  });

  describe("getClaudeModel", () => {
    const originalEnv = process.env;

    beforeEach(() => {
      vi.resetModules();
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it("returns formatted model from hook data", () => {
      const hookData = {
        model: {
          id: "claude-opus-4-5-20251101",
          display_name: "Claude Opus 4.5",
        },
      };
      expect(getClaudeModel(hookData)).toBe("Opus 4.5");
    });

    it("falls back to CLAUDE_MODEL env var", () => {
      process.env.CLAUDE_MODEL = "claude-sonnet-4-20250514";
      expect(getClaudeModel(null)).toBe("Sonnet 4");
    });

    it("falls back to CLAUDE_CODE_MODEL env var", () => {
      process.env.CLAUDE_CODE_MODEL = "claude-3-5-sonnet-20241022";
      expect(getClaudeModel(null)).toBe("Sonnet 3.5");
    });

    it("falls back to ANTHROPIC_MODEL env var", () => {
      process.env.ANTHROPIC_MODEL = "claude-3-haiku-20240307";
      expect(getClaudeModel(null)).toBe("Haiku 3");
    });

    it("prioritizes hook data over env vars", () => {
      process.env.CLAUDE_MODEL = "claude-3-haiku-20240307";
      const hookData = {
        model: {
          id: "claude-opus-4-5-20251101",
          display_name: "Claude Opus 4.5",
        },
      };
      expect(getClaudeModel(hookData)).toBe("Opus 4.5");
    });

    it("returns null when no model available", () => {
      delete process.env.CLAUDE_MODEL;
      delete process.env.CLAUDE_CODE_MODEL;
      delete process.env.ANTHROPIC_MODEL;
      expect(getClaudeModel(null)).toBeNull();
    });
  });
});

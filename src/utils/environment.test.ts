import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { execSync } from "child_process";
import {
  getDirectoryName,
  getClaudeModel,
  getGitBranch,
  hasGitChanges,
  getEnvironmentInfo,
} from "./environment.js";

// Mock child_process
vi.mock("child_process", () => ({
  execSync: vi.fn(),
}));

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
      // Note: path.basename on Linux doesn't handle Windows backslashes
      // This test verifies the function works with forward slashes (cross-platform)
      const hookData = {
        workspace: {
          current_dir: "C:/Users/user/projects/app/src",
          project_dir: "C:/Users/user/projects/app",
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

  describe("getGitBranch", () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    it("returns branch name from git command", () => {
      vi.mocked(execSync).mockReturnValue("main\n");

      const result = getGitBranch();

      expect(result).toBe("main");
      expect(execSync).toHaveBeenCalledWith(
        "git rev-parse --abbrev-ref HEAD",
        expect.any(Object)
      );
    });

    it("returns null when not in a git repo", () => {
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error("fatal: not a git repository");
      });

      const result = getGitBranch();

      expect(result).toBeNull();
    });

    it("trims whitespace from branch name", () => {
      vi.mocked(execSync).mockReturnValue("  feature/test  \n");

      const result = getGitBranch();

      expect(result).toBe("feature/test");
    });

    it("returns null for empty branch name", () => {
      vi.mocked(execSync).mockReturnValue("");

      const result = getGitBranch();

      expect(result).toBeNull();
    });
  });

  describe("hasGitChanges", () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    it("returns true when there are uncommitted changes", () => {
      vi.mocked(execSync).mockReturnValue(" M src/index.ts\n?? newfile.txt\n");

      const result = hasGitChanges();

      expect(result).toBe(true);
      expect(execSync).toHaveBeenCalledWith(
        "git status --porcelain",
        expect.any(Object)
      );
    });

    it("returns false when working directory is clean", () => {
      vi.mocked(execSync).mockReturnValue("");

      const result = hasGitChanges();

      expect(result).toBe(false);
    });

    it("returns false when not in a git repo", () => {
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error("fatal: not a git repository");
      });

      const result = hasGitChanges();

      expect(result).toBe(false);
    });

    it("trims whitespace when checking for changes", () => {
      vi.mocked(execSync).mockReturnValue("   \n  ");

      const result = hasGitChanges();

      expect(result).toBe(false);
    });
  });

  describe("getEnvironmentInfo", () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    it("returns all environment info", () => {
      vi.mocked(execSync)
        .mockReturnValueOnce("develop\n") // getGitBranch
        .mockReturnValueOnce(" M file.ts\n"); // hasGitChanges

      const hookData = {
        workspace: {
          current_dir: "/project/src",
          project_dir: "/project",
        },
        model: {
          id: "claude-opus-4-5-20251101",
          display_name: "Claude Opus 4.5",
        },
      };

      const result = getEnvironmentInfo(hookData);

      expect(result.directory).toBe("project");
      expect(result.gitBranch).toBe("develop");
      expect(result.gitDirty).toBe(true);
      expect(result.model).toBe("Opus 4.5");
    });

    it("handles missing hook data", () => {
      vi.mocked(execSync)
        .mockReturnValueOnce("main\n")
        .mockReturnValueOnce("");

      const result = getEnvironmentInfo(null);

      expect(result.gitBranch).toBe("main");
      expect(result.gitDirty).toBe(false);
      expect(result.model).toBeNull();
    });
  });
});

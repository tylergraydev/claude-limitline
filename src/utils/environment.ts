import { execSync } from "child_process";
import { basename } from "path";
import { debug } from "./logger.js";
import { type ClaudeHookData, formatModelName } from "./claude-hook.js";

/**
 * Get the current directory/repo name
 */
export function getDirectoryName(hookData?: ClaudeHookData | null): string | null {
  try {
    // Use workspace from hook data if available
    if (hookData?.workspace?.project_dir) {
      return basename(hookData.workspace.project_dir);
    }
    if (hookData?.cwd) {
      return basename(hookData.cwd);
    }
    return basename(process.cwd());
  } catch (error) {
    debug("Error getting directory name:", error);
    return null;
  }
}

/**
 * Get the current git branch name
 */
export function getGitBranch(): string | null {
  try {
    const branch = execSync("git rev-parse --abbrev-ref HEAD", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    return branch || null;
  } catch (error) {
    debug("Error getting git branch:", error);
    return null;
  }
}

/**
 * Check if the git repo has uncommitted changes
 */
export function hasGitChanges(): boolean {
  try {
    const status = execSync("git status --porcelain", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    return status.length > 0;
  } catch (error) {
    debug("Error checking git status:", error);
    return false;
  }
}

/**
 * Get the Claude model from hook data or environment variable
 */
export function getClaudeModel(hookData?: ClaudeHookData | null): string | null {
  // First try hook data (most reliable)
  if (hookData?.model?.id) {
    return formatModelName(hookData.model.id, hookData.model.display_name);
  }

  // Fall back to environment variables
  const model = process.env.CLAUDE_MODEL
    || process.env.CLAUDE_CODE_MODEL
    || process.env.ANTHROPIC_MODEL;

  if (model) {
    return formatModelName(model);
  }

  return null;
}

export interface EnvironmentInfo {
  directory: string | null;
  gitBranch: string | null;
  gitDirty: boolean;
  model: string | null;
}

/**
 * Get all environment info at once
 */
export function getEnvironmentInfo(hookData?: ClaudeHookData | null): EnvironmentInfo {
  return {
    directory: getDirectoryName(hookData),
    gitBranch: getGitBranch(),
    gitDirty: hasGitChanges(),
    model: getClaudeModel(hookData),
  };
}

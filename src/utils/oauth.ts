import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { debug } from "./logger.js";

const execAsync = promisify(exec);

interface UsageData {
  resetAt: Date;
  percentUsed: number;
  isOverLimit: boolean;
}

export interface OAuthUsageResponse {
  fiveHour: UsageData | null;
  sevenDay: UsageData | null;
  sevenDayOpus: UsageData | null;
  sevenDaySonnet: UsageData | null;
  raw?: unknown;
}

interface ApiUsageBlock {
  resets_at?: string;
  utilization?: number;
}

interface ApiResponse {
  five_hour?: ApiUsageBlock;
  seven_day?: ApiUsageBlock;
  seven_day_opus?: ApiUsageBlock | null;
  seven_day_sonnet?: ApiUsageBlock | null;
}

async function getOAuthTokenWindows(): Promise<string | null> {
  try {
    // Try PowerShell to access Windows Credential Manager
    const { stdout } = await execAsync(
      `powershell -Command "[System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String((Get-StoredCredential -Target 'Claude Code' -AsCredentialObject).Password))"`,
      { timeout: 5000 }
    );
    const token = stdout.trim();
    if (token && token.startsWith("sk-ant-oat")) {
      return token;
    }
  } catch (error) {
    debug("PowerShell credential retrieval failed:", error);
  }

  try {
    // Alternative: Try cmdkey approach
    const { stdout } = await execAsync(
      `powershell -Command "$cred = cmdkey /list:Claude* | Select-String -Pattern 'User:.*'; if ($cred) { $cred.Line.Split(':')[1].Trim() }"`,
      { timeout: 5000 }
    );
    debug("cmdkey output:", stdout);
  } catch (error) {
    debug("cmdkey approach failed:", error);
  }

  // Try looking in common Claude Code config locations
  // Primary location - Claude Code stores credentials in ~/.claude/.credentials.json
  const primaryPath = path.join(os.homedir(), ".claude", ".credentials.json");
  try {
    if (fs.existsSync(primaryPath)) {
      const content = fs.readFileSync(primaryPath, "utf-8");
      const config = JSON.parse(content);

      // Claude Code stores OAuth as an object with accessToken
      if (config.claudeAiOauth && typeof config.claudeAiOauth === "object") {
        const token = config.claudeAiOauth.accessToken;
        if (token && typeof token === "string" && token.startsWith("sk-ant-oat")) {
          debug(`Found OAuth token in ${primaryPath} under claudeAiOauth.accessToken`);
          return token;
        }
      }
    }
  } catch (error) {
    debug(`Failed to read config from ${primaryPath}:`, error);
  }

  // Fallback locations
  const fallbackPaths = [
    path.join(os.homedir(), ".claude", "credentials.json"),
    path.join(os.homedir(), ".config", "claude-code", "credentials.json"),
    path.join(process.env.APPDATA || "", "Claude Code", "credentials.json"),
    path.join(process.env.LOCALAPPDATA || "", "Claude Code", "credentials.json"),
  ];

  for (const configPath of fallbackPaths) {
    try {
      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, "utf-8");
        const config = JSON.parse(content);

        for (const key of ["oauth_token", "token", "accessToken"]) {
          const token = config[key];
          if (token && typeof token === "string" && token.startsWith("sk-ant-oat")) {
            debug(`Found OAuth token in ${configPath} under key ${key}`);
            return token;
          }
        }
      }
    } catch (error) {
      debug(`Failed to read config from ${configPath}:`, error);
    }
  }

  return null;
}

async function findKeychainServiceName(): Promise<string> {
  // Claude Code may use a hash-suffixed keychain service name (e.g. "Claude Code-credentials-697375ae").
  // Find the most specific (longest) matching entry to prefer the suffixed variant over the legacy name.
  try {
    const { stdout } = await execAsync(
      `security dump-keychain 2>/dev/null | grep -o '"Claude Code-credentials[^"]*"' | awk '{ print length, $0 }' | sort -rn | head -1 | cut -d' ' -f2-`,
      { timeout: 5000 }
    );
    const svcName = stdout.trim().replace(/^"|"$/g, "");
    if (svcName) {
      debug(`Found keychain service: ${svcName}`);
      return svcName;
    }
  } catch (error) {
    debug("Keychain service name lookup failed:", error);
  }
  return "Claude Code-credentials";
}

async function readKeychainContent(serviceName: string): Promise<string | null> {
  try {
    const { stdout } = await execAsync(
      `security find-generic-password -s "${serviceName}" -w`,
      { timeout: 5000 }
    );
    return stdout.trim() || null;
  } catch (error) {
    debug(`Keychain read failed for service "${serviceName}":`, error);
    return null;
  }
}

function extractTokenFromKeychainContent(content: string): string | null {
  // The keychain stores JSON with structure: {"claudeAiOauth":{"accessToken":"..."}}
  if (content.startsWith("{")) {
    try {
      const parsed = JSON.parse(content);
      if (parsed.claudeAiOauth && typeof parsed.claudeAiOauth === "object") {
        const token = parsed.claudeAiOauth.accessToken;
        if (token && typeof token === "string" && token.startsWith("sk-ant-oat")) {
          debug("Found OAuth token in macOS Keychain under claudeAiOauth.accessToken");
          return token;
        }
      }
    } catch (parseError) {
      debug("Failed to parse keychain JSON:", parseError);
    }
  }

  // Fallback: check if it's a raw token
  if (content.startsWith("sk-ant-oat")) {
    return content;
  }

  return null;
}

async function getOAuthTokenMacOS(): Promise<string | null> {
  const serviceName = await findKeychainServiceName();
  const content = await readKeychainContent(serviceName);

  if (content) {
    const token = extractTokenFromKeychainContent(content);
    if (token) return token;
  }

  // If the dynamic lookup returned a suffixed name that failed, try the legacy name as fallback
  if (serviceName !== "Claude Code-credentials") {
    debug("Suffixed keychain entry failed, trying legacy name");
    const legacyContent = await readKeychainContent("Claude Code-credentials");
    if (legacyContent) {
      return extractTokenFromKeychainContent(legacyContent);
    }
  }

  // Fallback to config file locations (same as Linux)
  const configPaths = [
    path.join(os.homedir(), ".claude", ".credentials.json"),
    path.join(os.homedir(), ".claude", "credentials.json"),
    path.join(os.homedir(), ".config", "claude-code", "credentials.json"),
  ];

  for (const configPath of configPaths) {
    try {
      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, "utf-8");
        const config = JSON.parse(content);

        // Check for claudeAiOauth.accessToken structure
        if (config.claudeAiOauth && typeof config.claudeAiOauth === "object") {
          const token = config.claudeAiOauth.accessToken;
          if (token && typeof token === "string" && token.startsWith("sk-ant-oat")) {
            debug(`Found OAuth token in ${configPath} under claudeAiOauth.accessToken`);
            return token;
          }
        }

        // Check for direct token fields
        for (const key of ["oauth_token", "token", "accessToken"]) {
          const token = config[key];
          if (token && typeof token === "string" && token.startsWith("sk-ant-oat")) {
            debug(`Found OAuth token in ${configPath} under key ${key}`);
            return token;
          }
        }
      }
    } catch (error) {
      debug(`Failed to read config from ${configPath}:`, error);
    }
  }

  return null;
}

async function getOAuthTokenLinux(): Promise<string | null> {
  // Try secret-tool (GNOME Keyring)
  try {
    const { stdout } = await execAsync(
      `secret-tool lookup service "Claude Code"`,
      { timeout: 5000 }
    );
    const token = stdout.trim();
    if (token && token.startsWith("sk-ant-oat")) {
      return token;
    }
  } catch (error) {
    debug("Linux secret-tool retrieval failed:", error);
  }

  // Try config file locations
  const configPaths = [
    path.join(os.homedir(), ".claude", ".credentials.json"),
    path.join(os.homedir(), ".claude", "credentials.json"),
    path.join(os.homedir(), ".config", "claude-code", "credentials.json"),
  ];

  for (const configPath of configPaths) {
    try {
      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, "utf-8");
        const config = JSON.parse(content);

        // Check for claudeAiOauth.accessToken structure
        if (config.claudeAiOauth && typeof config.claudeAiOauth === "object") {
          const token = config.claudeAiOauth.accessToken;
          if (token && typeof token === "string" && token.startsWith("sk-ant-oat")) {
            debug(`Found OAuth token in ${configPath} under claudeAiOauth.accessToken`);
            return token;
          }
        }

        // Check for direct token fields
        for (const key of ["oauth_token", "token", "accessToken"]) {
          const token = config[key];
          if (token && typeof token === "string" && token.startsWith("sk-ant-oat")) {
            debug(`Found OAuth token in ${configPath} under key ${key}`);
            return token;
          }
        }
      }
    } catch (error) {
      debug(`Failed to read config from ${configPath}:`, error);
    }
  }

  return null;
}

export async function getOAuthToken(): Promise<string | null> {
  const platform = process.platform;

  debug(`Attempting to retrieve OAuth token on platform: ${platform}`);

  switch (platform) {
    case "win32":
      return getOAuthTokenWindows();
    case "darwin":
      return getOAuthTokenMacOS();
    case "linux":
      return getOAuthTokenLinux();
    default:
      debug(`Unsupported platform for OAuth token retrieval: ${platform}`);
      return null;
  }
}

export async function fetchUsageFromAPI(
  token: string
): Promise<OAuthUsageResponse | null> {
  try {
    const response = await fetch("https://api.anthropic.com/api/oauth/usage", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "claude-limitline/1.0.0",
        Authorization: `Bearer ${token}`,
        "anthropic-beta": "oauth-2025-04-20",
      },
    });

    if (!response.ok) {
      debug(`Usage API returned status ${response.status}: ${response.statusText}`);
      return null;
    }

    const data = (await response.json()) as ApiResponse;
    debug("Usage API response:", JSON.stringify(data));

    const parseUsageBlock = (block?: ApiUsageBlock): UsageData | null => {
      if (!block) return null;
      return {
        resetAt: block.resets_at ? new Date(block.resets_at) : new Date(),
        percentUsed: block.utilization ?? 0,
        isOverLimit: (block.utilization ?? 0) >= 100,
      };
    };

    return {
      fiveHour: parseUsageBlock(data.five_hour),
      sevenDay: parseUsageBlock(data.seven_day),
      sevenDayOpus: parseUsageBlock(data.seven_day_opus ?? undefined),
      sevenDaySonnet: parseUsageBlock(data.seven_day_sonnet ?? undefined),
      raw: data,
    };
  } catch (error) {
    debug("Failed to fetch usage from API:", error);
    return null;
  }
}

// Cache for API responses to avoid hitting rate limits
let cachedUsage: OAuthUsageResponse | null = null;
let previousUsage: OAuthUsageResponse | null = null;  // For trend tracking
let cacheTimestamp = 0;
let cachedToken: string | null = null;

export type TrendDirection = "up" | "down" | "same" | null;

export interface TrendInfo {
  fiveHourTrend: TrendDirection;
  sevenDayTrend: TrendDirection;
  sevenDayOpusTrend: TrendDirection;
  sevenDaySonnetTrend: TrendDirection;
}

export function getUsageTrend(): TrendInfo {
  const result: TrendInfo = {
    fiveHourTrend: null,
    sevenDayTrend: null,
    sevenDayOpusTrend: null,
    sevenDaySonnetTrend: null,
  };

  if (!cachedUsage || !previousUsage) {
    return result;
  }

  const compareTrend = (
    current: UsageData | null,
    previous: UsageData | null
  ): TrendDirection => {
    if (!current || !previous) return null;
    const diff = current.percentUsed - previous.percentUsed;
    if (diff > 0.5) return "up";
    if (diff < -0.5) return "down";
    return "same";
  };

  result.fiveHourTrend = compareTrend(cachedUsage.fiveHour, previousUsage.fiveHour);
  result.sevenDayTrend = compareTrend(cachedUsage.sevenDay, previousUsage.sevenDay);
  result.sevenDayOpusTrend = compareTrend(cachedUsage.sevenDayOpus, previousUsage.sevenDayOpus);
  result.sevenDaySonnetTrend = compareTrend(cachedUsage.sevenDaySonnet, previousUsage.sevenDaySonnet);

  return result;
}

export async function getRealtimeUsage(
  pollIntervalMinutes: number = 15
): Promise<OAuthUsageResponse | null> {
  const now = Date.now();
  const cacheAgeMs = now - cacheTimestamp;
  const pollIntervalMs = pollIntervalMinutes * 60 * 1000;

  // Return cached data if still fresh
  if (cachedUsage && cacheAgeMs < pollIntervalMs) {
    debug(`Using cached usage data (age: ${Math.round(cacheAgeMs / 1000)}s)`);
    return cachedUsage;
  }

  // Get token if not cached
  if (!cachedToken) {
    cachedToken = await getOAuthToken();
    if (!cachedToken) {
      debug("Could not retrieve OAuth token for realtime usage");
      return null;
    }
  }

  // Fetch fresh data
  const usage = await fetchUsageFromAPI(cachedToken);
  if (usage) {
    // Store previous for trend tracking before updating
    previousUsage = cachedUsage;
    cachedUsage = usage;
    cacheTimestamp = now;
    debug("Refreshed realtime usage cache");
  } else {
    // Token might be expired, clear it for retry next time
    cachedToken = null;
  }

  return usage;
}

export function clearUsageCache(): void {
  cachedUsage = null;
  previousUsage = null;
  cacheTimestamp = 0;
  cachedToken = null;
}

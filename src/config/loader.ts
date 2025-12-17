import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { debug } from "../utils/logger.js";
import { DEFAULT_CONFIG, type LimitlineConfig } from "./types.js";

function deepMerge(
  target: LimitlineConfig,
  source: Partial<LimitlineConfig>
): LimitlineConfig {
  const result = { ...target };

  for (const key of Object.keys(source) as (keyof LimitlineConfig)[]) {
    const sourceValue = source[key];
    const targetValue = target[key];

    if (
      sourceValue !== undefined &&
      typeof sourceValue === "object" &&
      sourceValue !== null &&
      !Array.isArray(sourceValue) &&
      typeof targetValue === "object" &&
      targetValue !== null &&
      !Array.isArray(targetValue)
    ) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (result as any)[key] = { ...targetValue, ...sourceValue };
    } else if (sourceValue !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (result as any)[key] = sourceValue;
    }
  }

  return result;
}

export function loadConfig(): LimitlineConfig {
  const configPaths = [
    path.join(process.cwd(), ".claude-limitline.json"),
    path.join(os.homedir(), ".claude", "claude-limitline.json"),
  ];

  for (const configPath of configPaths) {
    try {
      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, "utf-8");
        const userConfig = JSON.parse(content) as Partial<LimitlineConfig>;
        debug(`Loaded config from ${configPath}`);
        return deepMerge(DEFAULT_CONFIG, userConfig);
      }
    } catch (error) {
      debug(`Failed to load config from ${configPath}:`, error);
    }
  }

  debug("Using default config");
  return DEFAULT_CONFIG;
}

#!/usr/bin/env node

import { loadConfig } from "./config/index.js";
import { BlockProvider } from "./segments/block.js";
import { WeeklyProvider } from "./segments/weekly.js";
import { Renderer } from "./renderer.js";
import { debug } from "./utils/logger.js";

async function main(): Promise<void> {
  try {
    // Load configuration
    const config = loadConfig();
    debug("Config loaded:", JSON.stringify(config));

    // Initialize providers
    const blockProvider = new BlockProvider();
    const weeklyProvider = new WeeklyProvider();

    // Get data
    const pollInterval = config.budget?.pollInterval ?? 15;

    const [blockInfo, weeklyInfo] = await Promise.all([
      config.block?.enabled ? blockProvider.getBlockInfo(pollInterval) : null,
      config.weekly?.enabled
        ? weeklyProvider.getWeeklyInfo(
            config.budget?.resetDay,
            config.budget?.resetHour,
            config.budget?.resetMinute,
            pollInterval
          )
        : null,
    ]);

    debug("Block info:", JSON.stringify(blockInfo));
    debug("Weekly info:", JSON.stringify(weeklyInfo));

    // Render output
    const renderer = new Renderer(config);
    const output = renderer.render(blockInfo, weeklyInfo);

    if (output) {
      process.stdout.write(output);
    }
  } catch (error) {
    debug("Error in main:", error);
    // Silent failure for statusline - don't break the terminal
    process.exit(0);
  }
}

main();

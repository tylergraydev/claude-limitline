#!/usr/bin/env node

// Theme demo script - shows all themes at once
// Usage: node theme-demo.mjs

import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const themes = ['dark', 'light', 'nord', 'gruvbox', 'tokyo-night', 'rose-pine'];
const hookData = '{"model":{"id":"claude-opus-4-5-20251101"}}';
const configPath = join(homedir(), '.claude-limitline.json');

function setTheme(theme) {
  const config = {
    display: { style: 'powerline', useNerdFonts: true },
    directory: { enabled: true },
    git: { enabled: true },
    model: { enabled: true },
    block: { enabled: true, displayStyle: 'text', showTimeRemaining: true },
    weekly: { enabled: true, displayStyle: 'text', showWeekProgress: true },
    theme: theme
  };
  writeFileSync(configPath, JSON.stringify(config, null, 2));
}

function getOutput(theme) {
  setTheme(theme);
  try {
    return execSync(
      `echo '${hookData}' | node dist/index.js`,
      { encoding: 'utf-8', cwd: process.cwd(), shell: true }
    ).trim();
  } catch (e) {
    return 'Error: ' + e.message;
  }
}

// Clear screen
console.log('\x1b[2J\x1b[H');
console.log('🎨 Claude Limitline - All Themes\n');
console.log('═'.repeat(75));

for (const theme of themes) {
  const output = getOutput(theme);
  console.log(`\n\x1b[1m${theme}\x1b[0m`);
  console.log(output);
  console.log('');
}

console.log('═'.repeat(75));
console.log('\nDone! Your config has been set to the last theme (rose-pine).');
console.log('Edit ~/.claude-limitline.json to change it back.');

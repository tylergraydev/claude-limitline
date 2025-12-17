#!/usr/bin/env node
/**
 * Demo script to showcase the three weekly view modes
 * Outputs raw ANSI-styled text to demonstrate the modes
 */

// ANSI color helpers
const ansi = {
  fg: (n) => `\x1b[38;5;${n}m`,
  bg: (n) => `\x1b[48;5;${n}m`,
  reset: '\x1b[0m',
};

// Powerline arrow
const arrow = '\ue0b0';

// Symbols
const symbols = {
  block: '◫',
  weekly: '○',
  sonnet: '◇',
  branch: '\ue0a0',
  model: '✱',
};

// Dark theme colors (approximate ANSI 256 values)
const colors = {
  directory: { bg: 94, fg: 231 },   // Brown bg, white fg
  git: { bg: 238, fg: 231 },        // Dark gray bg, white fg
  model: { bg: 236, fg: 231 },      // Darker gray bg, white fg
  block: { bg: 235, fg: 117 },      // Dark bg, cyan fg
  weekly: { bg: 234, fg: 120 },     // Darker bg, green fg
};

function segment(text, color, nextColor = null) {
  let out = ansi.bg(color.bg) + ansi.fg(color.fg) + text + ansi.reset;
  if (nextColor) {
    out += ansi.fg(color.bg) + ansi.bg(nextColor.bg) + arrow;
  } else {
    out += ansi.fg(color.bg) + arrow;
  }
  return out + ansi.reset;
}

function renderStatusline(weeklyText, weeklyColor = colors.weekly) {
  return (
    segment(` claude-limitline `, colors.directory, colors.git) +
    segment(` ${symbols.branch} main `, colors.git, colors.model) +
    segment(` ${symbols.model} Opus 4.5 `, colors.model, colors.block) +
    segment(` ${symbols.block} 29% (3h) `, colors.block, weeklyColor) +
    segment(weeklyText, weeklyColor)
  );
}

console.log("\n┌─────────────────────────────────────────────────────────────┐");
console.log("│              Weekly View Modes Demo                         │");
console.log("└─────────────────────────────────────────────────────────────┘\n");

// Simple mode
console.log('\x1b[1mSimple Mode\x1b[0m (default):');
console.log('Shows overall weekly usage only');
console.log('Config: { "weekly": { "viewMode": "simple" } }\n');
console.log(renderStatusline(` ${symbols.weekly} 47% (wk 85%) `));
console.log("\n");

// Smart mode - Opus selected
console.log('\x1b[1mSmart Mode\x1b[0m (Opus selected):');
console.log('When using Opus, shows only Overall usage');
console.log('Config: { "weekly": { "viewMode": "smart" } }\n');
console.log(renderStatusline(` ${symbols.weekly}47% (wk 85%) `));
console.log("\n");

// Smart mode - Sonnet selected
console.log('\x1b[1mSmart Mode\x1b[0m (Sonnet selected):');
console.log('When using Sonnet, shows Sonnet | Overall format');
console.log('Config: { "weekly": { "viewMode": "smart" } }\n');
console.log(
  segment(` claude-limitline `, colors.directory, colors.git) +
  segment(` ${symbols.branch} main `, colors.git, colors.model) +
  segment(` ${symbols.model} Sonnet 4 `, colors.model, colors.block) +
  segment(` ${symbols.block} 29% (3h) `, colors.block, colors.weekly) +
  segment(` ${symbols.sonnet}7% | ${symbols.weekly}47% (wk 85%) `, colors.weekly)
);
console.log("\n");

console.log("─".repeat(62));
console.log("Note: Model-specific limits (Opus/Sonnet) are only available");
console.log("on certain subscription tiers.\n");

# claude-limitline

A powerline-style statusline for Claude Code showing real-time usage limits, git info, and model details.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.3-blue.svg)

![Theme Preview](imgs/themes-preview.png)

## Features

- **Powerline Style** - Beautiful segmented display with smooth transitions
- **5-Hour Block Limit** - Shows current usage percentage with time remaining until reset
- **7-Day Rolling Limit** - Tracks weekly usage with progress indicator
- **Repository Name** - Displays current project/directory name
- **Git Branch** - Shows current branch with dirty indicator (●)
- **Claude Model** - Displays the active model (Opus 4.5, Sonnet 4, etc.)
- **Multiple Themes** - Dark, light, nord, gruvbox, tokyo-night, and rose-pine
- **Real-time Tracking** - Uses Anthropic's OAuth usage API for accurate data
- **Cross-Platform** - Works on Windows, macOS, and Linux

## Example Output

```
 claude-limitline  main ●   Opus 4.5   12% (3h20m)   45% (wk 85%)
```

## Prerequisites

- **Node.js** 18.0.0 or higher
- **Claude Code** CLI installed and authenticated (for OAuth token)
- **Nerd Font** (recommended, for powerline symbols)

## Installation

### From npm (recommended)

```bash
npm install -g claude-limitline
```

### From Source

See [Development](#development) section, then run `npm link` to make it available globally.

## Quick Start

Add to your Claude Code settings file (`~/.claude/settings.json`):

```json
{
  "statusLine": {
    "type": "command",
    "command": "npx claude-limitline"
  }
}
```

That's it! The status line will now show your usage limits in Claude Code.

> **Tip:** For faster startup, use `"command": "claude-limitline"` after installing globally.

## Configuration

Create a `claude-limitline.json` file in your Claude config directory (`~/.claude/claude-limitline.json`) or `.claude-limitline.json` in your current working directory:

```json
{
  "display": {
    "style": "powerline",
    "useNerdFonts": true,
    "compactMode": "auto",
    "compactWidth": 80
  },
  "directory": {
    "enabled": true
  },
  "git": {
    "enabled": true
  },
  "model": {
    "enabled": true
  },
  "block": {
    "enabled": true,
    "displayStyle": "text",
    "barWidth": 10,
    "showTimeRemaining": true
  },
  "weekly": {
    "enabled": true,
    "displayStyle": "text",
    "barWidth": 10,
    "showWeekProgress": true,
    "viewMode": "smart"
  },
  "budget": {
    "pollInterval": 15,
    "warningThreshold": 80
  },
  "theme": "dark",
  "segmentOrder": ["directory", "git", "model", "block", "weekly"],
  "showTrend": true
}
```

### Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `display.useNerdFonts` | Use Nerd Font symbols for powerline | `true` |
| `display.compactMode` | `"auto"`, `"always"`, or `"never"` | `"auto"` |
| `display.compactWidth` | Terminal width threshold for compact mode | `80` |
| `directory.enabled` | Show repository/directory name | `true` |
| `git.enabled` | Show git branch with dirty indicator | `true` |
| `model.enabled` | Show Claude model name | `true` |
| `block.enabled` | Show 5-hour block usage | `true` |
| `block.displayStyle` | `"bar"` or `"text"` | `"text"` |
| `block.barWidth` | Width of progress bar in characters | `10` |
| `block.showTimeRemaining` | Show time until block resets | `true` |
| `weekly.enabled` | Show 7-day rolling usage | `true` |
| `weekly.displayStyle` | `"bar"` or `"text"` | `"text"` |
| `weekly.barWidth` | Width of progress bar in characters | `10` |
| `weekly.showWeekProgress` | Show week progress percentage | `true` |
| `weekly.viewMode` | `"simple"`, `"detailed"`, or `"smart"` | `"simple"` |
| `budget.pollInterval` | Minutes between API calls | `15` |
| `budget.warningThreshold` | Percentage to trigger warning color | `80` |
| `theme` | Color theme name | `"dark"` |
| `segmentOrder` | Array to customize segment order | `["directory", "git", "model", "block", "weekly"]` |
| `showTrend` | Show ↑↓ arrows for usage changes | `true` |

### Weekly View Modes

The weekly segment supports three view modes for displaying usage limits:

| Mode | Description | Example |
|------|-------------|---------|
| `simple` | Shows overall weekly usage only (default) | `○ 47% (wk 85%)` |
| `detailed` | Shows overall, Opus, and Sonnet usage side by side | `○47% ◈15% ◇7%` |
| `smart` | Shows the most restrictive (bottleneck) limit with indicator | `○47%▲ (wk 85%)` |

**Note:** Model-specific limits (Opus/Sonnet) are only available on certain subscription tiers. When a model-specific limit is not available, it will be hidden from the display.

### Available Themes

- `dark` - Default dark theme with warm browns and cool cyans
- `light` - Light background theme with vibrant colors
- `nord` - Nord color palette
- `gruvbox` - Gruvbox color palette
- `tokyo-night` - Tokyo Night color palette
- `rose-pine` - Rosé Pine color palette

## Segments

The statusline displays the following segments (all configurable):

| Segment | Description | Color (dark theme) |
|---------|-------------|-------------------|
| **Directory** | Current repo/project name | Brown/Orange |
| **Git** | Branch name + dirty indicator (●) | Dark Gray |
| **Model** | Claude model (Opus 4.5, Sonnet 4, etc.) | Dark Gray |
| **Block** | 5-hour usage % + time remaining | Cyan (warning: Orange, critical: Red) |
| **Weekly** | 7-day usage % + week progress | Green |

## How It Works

claude-limitline retrieves data from two sources:

1. **Hook Data (stdin)** - Claude Code passes JSON with model info, workspace, and session data
2. **Usage API** - Fetches usage limits from Anthropic's OAuth usage endpoint

### OAuth Token Location

| Platform | Location |
|----------|----------|
| **Windows** | Credential Manager or `~/.claude/.credentials.json` |
| **macOS** | Keychain or `~/.claude/.credentials.json` |
| **Linux** | secret-tool (GNOME Keyring) or `~/.claude/.credentials.json` |

## Development

```bash
git clone https://github.com/tylergraydev/claude-limitline.git
cd claude-limitline
npm install
npm run build    # Build once
npm run dev      # Watch mode
```

## Testing

The project uses [Vitest](https://vitest.dev/) for testing with 166 tests covering config loading, themes, segments, utilities, and rendering.

```bash
npm test              # Run tests once
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

### Test Structure

| File | Tests | Coverage |
|------|-------|----------|
| `src/config/loader.test.ts` | 7 | Config loading, merging, fallbacks |
| `src/themes/index.test.ts` | 37 | Theme retrieval, color validation |
| `src/segments/block.test.ts` | 8 | Block segment, time calculations |
| `src/segments/weekly.test.ts` | 10 | Weekly segment, week progress |
| `src/utils/oauth.test.ts` | 10 | API responses, caching |
| `src/utils/claude-hook.test.ts` | 21 | Model name formatting |
| `src/utils/environment.test.ts` | 20 | Git branch, directory detection |
| `src/utils/terminal.test.ts` | 13 | Terminal width, ANSI handling |
| `src/utils/logger.test.ts` | 8 | Debug/error logging |
| `src/renderer.test.ts` | 21 | Segment rendering, ordering |

## Debug Mode

Enable debug logging to troubleshoot issues:

```bash
# Linux/macOS
CLAUDE_LIMITLINE_DEBUG=true claude-limitline

# Windows (PowerShell)
$env:CLAUDE_LIMITLINE_DEBUG="true"; claude-limitline

# Windows (CMD)
set CLAUDE_LIMITLINE_DEBUG=true && claude-limitline
```

Debug output is written to stderr so it won't interfere with the status line output.

## Troubleshooting

### Model not showing

The model is passed via stdin from Claude Code. If running standalone, pipe in hook data:
```bash
echo '{"model":{"id":"claude-opus-4-5-20251101"}}' | claude-limitline
```

### "No data" or empty output

1. **Check OAuth token**: Make sure you're logged into Claude Code (`claude --login`)
2. **Check credentials file**: Verify `~/.claude/.credentials.json` exists
3. **Enable debug mode**: Run with `CLAUDE_LIMITLINE_DEBUG=true`

### Git branch not showing

Make sure you're in a git repository. The git segment only appears when a `.git` directory is found.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- Inspired by [claude-powerline](https://github.com/Owloops/claude-powerline)
- Built for use with [Claude Code](https://claude.com/claude-code)

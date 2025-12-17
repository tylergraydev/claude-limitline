# claude-limitline

A statusline for Claude Code showing real-time usage limits and weekly tracking.

## Features

- **5-Hour Block Limit** - Shows current usage percentage with time remaining until reset
- **7-Day Rolling Limit** - Tracks weekly usage with progress indicator
- **Real-time Tracking** - Uses Anthropic's OAuth API for accurate usage data
- **Progress Bar Display** - Visual progress bars for quick status checks
- **Cross-Platform** - Works on Windows, macOS, and Linux
- **Zero Dependencies** - Lightweight and fast

## Installation

```bash
npm install -g claude-limitline
```

Or install from source:

```bash
git clone https://github.com/yourusername/claude-limitline.git
cd claude-limitline
npm install
npm run build
npm link
```

## Usage

### With Claude Code

Add to your Claude Code settings (`~/.claude/settings.json`):

```json
{
  "statusLine": {
    "command": "claude-limitline"
  }
}
```

### Standalone

```bash
claude-limitline
```

## Configuration

Create a `.claude-limitline.json` file in your home directory or current working directory:

```json
{
  "display": {
    "style": "minimal",
    "useNerdFonts": true
  },
  "block": {
    "enabled": true,
    "displayStyle": "bar",
    "barWidth": 10,
    "showTimeRemaining": true
  },
  "weekly": {
    "enabled": true,
    "displayStyle": "bar",
    "barWidth": 10,
    "showWeekProgress": true
  },
  "budget": {
    "pollInterval": 15,
    "warningThreshold": 80
  },
  "theme": "dark"
}
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `display.useNerdFonts` | Use Nerd Font symbols | `true` |
| `block.enabled` | Show 5-hour block usage | `true` |
| `block.displayStyle` | `"bar"` or `"text"` | `"bar"` |
| `block.barWidth` | Width of progress bar | `10` |
| `block.showTimeRemaining` | Show time until reset | `true` |
| `weekly.enabled` | Show 7-day usage | `true` |
| `weekly.displayStyle` | `"bar"` or `"text"` | `"bar"` |
| `weekly.showWeekProgress` | Show week progress % | `true` |
| `budget.pollInterval` | Minutes between API calls | `15` |
| `budget.warningThreshold` | % to show warning color | `80` |
| `theme` | Color theme | `"dark"` |

### Themes

Available themes: `dark`, `light`, `nord`, `gruvbox`

## How It Works

claude-limitline retrieves your Claude usage data from Anthropic's OAuth usage API. It reads your OAuth token from the system credential store:

- **Windows**: Credential Manager or `~/.claude/.credentials.json`
- **macOS**: Keychain
- **Linux**: secret-tool (GNOME Keyring) or `~/.claude/.credentials.json`

The usage data is cached to respect API rate limits (configurable via `pollInterval`).

## Debug Mode

Enable debug logging:

```bash
CLAUDE_LIMITLINE_DEBUG=true claude-limitline
```

## License

MIT License - see [LICENSE](LICENSE) for details.

# Model-Specific Usage Tracking Implementation Plan

## Overview

Add support for model-specific weekly usage limits (Opus, Sonnet) with three display modes:
- **Simple**: Current behavior (overall only)
- **Detailed**: Show Overall, Opus, Sonnet side by side
- **Smart/Bottleneck**: Show the most restrictive limit dynamically

## API Response Structure

```json
{
    "five_hour": { "utilization": 29.0, "resets_at": "..." },
    "seven_day": { "utilization": 47.0, "resets_at": "..." },
    "seven_day_opus": { "utilization": 15.0, "resets_at": "..." } | null,
    "seven_day_sonnet": { "utilization": 7.0, "resets_at": "..." } | null
}
```

## Implementation Steps

### 1. Update `src/utils/oauth.ts`

**Changes:**
- Update `ApiResponse` interface to include `seven_day_opus` and `seven_day_sonnet`
- Update `OAuthUsageResponse` interface to include model-specific data:
  ```typescript
  export interface OAuthUsageResponse {
    fiveHour: UsageData | null;
    sevenDay: UsageData | null;
    sevenDayOpus: UsageData | null;
    sevenDaySonnet: UsageData | null;
    raw?: unknown;
  }
  ```
- Update `fetchUsageFromAPI` to parse the new fields
- Update `TrendInfo` to include model-specific trends (optional, can be done later)

### 2. Update `src/config/types.ts`

**Changes:**
- Add new `WeeklyViewMode` type:
  ```typescript
  export type WeeklyViewMode = "simple" | "detailed" | "smart";
  ```
- Update `WeeklySegmentConfig` to include view mode:
  ```typescript
  export interface WeeklySegmentConfig extends SegmentConfig {
    showWeekProgress?: boolean;
    viewMode?: WeeklyViewMode;  // New: default "simple"
  }
  ```
- Update `DEFAULT_CONFIG` with `viewMode: "simple"`

### 3. Update `src/segments/weekly.ts`

**Changes:**
- Update `WeeklyInfo` interface to include model-specific data:
  ```typescript
  export interface WeeklyInfo {
    percentUsed: number | null;
    resetAt: Date | null;
    isRealtime: boolean;
    weekProgressPercent: number;
    // New model-specific fields
    opusPercentUsed: number | null;
    sonnetPercentUsed: number | null;
    opusResetAt: Date | null;
    sonnetResetAt: Date | null;
  }
  ```
- Update `getRealtimeWeeklyInfo` to extract and return model-specific data

### 4. Update `src/renderer.ts`

**Changes:**
- Update `renderWeekly` method to handle three view modes:

  **Simple mode** (current behavior):
  ```
  ○ 47% (wk 85%)
  ```

  **Detailed mode** (show all three):
  ```
  ○ 47% | ◈15% | ◇7%
  ```
  Where ○ = Overall, ◈ = Opus, ◇ = Sonnet

  Or use labels:
  ```
  ○ All:47% Op:15% So:7%
  ```

  **Smart/Bottleneck mode**:
  - Show whichever is highest percentage (closest to limit)
  - Add indicator of which limit is shown
  - Example: `○ 47%▲` (▲ indicates this is the bottleneck)
  - Or show model name: `○ 47% (all)` vs `◈ 85% (opus)`

### 5. Update `src/themes/index.ts`

**Changes:**
- Add colors for Opus and Sonnet segments (optional, can reuse existing):
  ```typescript
  export interface ColorTheme {
    // ... existing
    opus: SegmentColor;    // New
    sonnet: SegmentColor;  // New
  }
  ```

### 6. Update `src/utils/constants.ts`

**Changes:**
- Add symbols for model-specific indicators:
  ```typescript
  export const SYMBOLS = {
    // ... existing
    opus: "\u25c8",    // ◈ Diamond with dot
    sonnet: "\u25c7",  // ◇ White diamond
  };
  ```

### 7. Update Tests

**Files to update:**
- `src/utils/oauth.test.ts` - Add tests for new API fields
- `src/segments/weekly.test.ts` - Add tests for model-specific data
- `src/renderer.test.ts` - Add tests for three view modes

### 8. Update Documentation

**Files to update:**
- `README.md` - Document new config option and view modes
- `.claude-limitline.example.json` - Add viewMode example

## Configuration Example

```json
{
  "weekly": {
    "enabled": true,
    "displayStyle": "text",
    "showWeekProgress": true,
    "viewMode": "smart"
  }
}
```

## Display Examples

### Simple Mode (default)
```
 claude-limitline  main   Opus 4.5   ◫ 29%   ○ 47%
```

### Detailed Mode
```
 claude-limitline  main   Opus 4.5   ◫ 29%   ○ 47% ◈ 15% ◇ 7%
```
Or as separate segments (if user wants):
```
 claude-limitline  main   Opus 4.5   ◫ 29%   ○ 47%   ◈ 15%   ◇ 7%
```

### Smart Mode
Shows the most restrictive limit with an indicator:
```
 claude-limitline  main   Opus 4.5   ◫ 29%   ○ 47%*
```
Where `*` or similar indicates this is the bottleneck.

If Opus was at 90%:
```
 claude-limitline  main   Opus 4.5   ◫ 29%   ◈ 90%*
```

## Edge Cases

1. **Opus/Sonnet is null** (user on Pro without Opus access):
   - Simple: Show overall only
   - Detailed: Show only available limits
   - Smart: Show overall (it's the only limit)

2. **All limits are equal**: Smart mode shows overall by default

3. **Compact mode**:
   - Simple: `47%`
   - Detailed: `47/15/7%` (compact format)
   - Smart: `47%*`

## Implementation Order

1. `oauth.ts` - Parse new API fields (foundation)
2. `config/types.ts` - Add config types
3. `segments/weekly.ts` - Update WeeklyInfo
4. `constants.ts` & `themes/index.ts` - Add symbols/colors
5. `renderer.ts` - Implement three view modes
6. Tests - Add coverage
7. Documentation - Update README

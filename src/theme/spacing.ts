/** Faded — spacing, radius & layout tokens (dev-plan §4.3). 4-pt scale. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  card: 14,
  sheet: 20,
  pill: 999,
} as const;

export const layout = {
  /** Screen edge padding. */
  screenPadding: 16,
  /** Gap between grid items. */
  gridGutter: 12,
  /** Home shutter FAB diameter. */
  fabSize: 76,
  /** Camera capture button diameter. */
  captureSize: 84,
} as const;

/**
 * Design tokens that JavaScript needs at runtime.
 *
 * CSS is the source of truth (src/styles/tokens.css). The handful of values
 * below are mirrored here because components occasionally need them in code —
 * e.g. the hero carousel schedules its crossfade with setTimeout, and media
 * queries in JS need the same breakpoints as the stylesheet.
 *
 * If you change a value here, change it in tokens.css too.
 */

export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1600,
  ultra: 2200,
} as const;

export type Breakpoint = keyof typeof breakpoints;

/** Milliseconds. Keep in sync with --duration-* in tokens.css. */
export const durations = {
  fast: 150,
  base: 250,
  slow: 600,
  hero: 1200,
  heroDrift: 8000,
  /** How long each dog stays on screen in the hero before advancing. */
  heroDwell: 6500,
} as const;

/** Media query strings, so components and styles agree. */
export const mediaQueries = {
  sm: `(min-width: ${breakpoints.sm}px)`,
  md: `(min-width: ${breakpoints.md}px)`,
  lg: `(min-width: ${breakpoints.lg}px)`,
  xl: `(min-width: ${breakpoints.xl}px)`,
  "2xl": `(min-width: ${breakpoints["2xl"]}px)`,
  ultra: `(min-width: ${breakpoints.ultra}px)`,
  reducedMotion: "(prefers-reduced-motion: reduce)",
} as const;

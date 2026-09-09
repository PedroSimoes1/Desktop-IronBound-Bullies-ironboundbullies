import localFont from "next/font/local";

/**
 * The two — and only two — type families on the site.
 *
 * Both are variable fonts (one file covers every weight), self-hosted from
 * src/fonts and served from our own domain. They are rebuilt with
 * tools/fonts/build_fonts.py; see that file for licensing (SIL OFL 1.1).
 *
 * The CSS variables set here (--font-display, --font-text) are consumed by
 * src/styles/tokens.css.
 */

/** Big Shoulders Display — dog names, page titles. Heavy, condensed, industrial. */
export const displayFont = localFont({
  src: "../fonts/big-shoulders-display-variable.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  variable: "--font-display",
  // Metrics-matched fallback keeps layout stable while the file loads.
  adjustFontFallback: "Arial",
  preload: true,
});

/** Hanken Grotesk — body, labels, UI. Quiet and readable at every size. */
export const textFont = localFont({
  src: [
    {
      path: "../fonts/hanken-grotesk-variable.woff2",
      weight: "100 900",
      style: "normal",
    },
    {
      path: "../fonts/hanken-grotesk-italic-variable.woff2",
      weight: "100 900",
      style: "italic",
    },
  ],
  display: "swap",
  variable: "--font-text",
  adjustFontFallback: "Arial",
  preload: true,
});

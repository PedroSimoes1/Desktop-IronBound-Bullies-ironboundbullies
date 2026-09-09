/**
 * Ensures the self-hosted font files exist before `next build`.
 *
 * The .woff2 files in src/fonts are committed to the repository, so in normal
 * use (a git clone, Vercel building from GitHub) this script does nothing.
 * It exists for one situation: a file-based deployment that omits binary
 * assets. In that case it downloads the Latin subsets of the same two
 * families from Google Fonts' CDN, so the build still self-hosts every font
 * and the browser never contacts Google.
 *
 * No third-party packages: Node's built-in fetch and fs only.
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const fontsDir = resolve(here, "../src/fonts");

// A modern browser user-agent makes the CSS API return variable woff2 sources.
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const FONTS = [
  {
    file: "big-shoulders-display-variable.woff2",
    css: "https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@100..900&display=swap",
    style: "normal",
  },
  {
    file: "hanken-grotesk-variable.woff2",
    css: "https://fonts.googleapis.com/css2?family=Hanken+Grotesk:ital,wght@0,100..900&display=swap",
    style: "normal",
  },
  {
    file: "hanken-grotesk-italic-variable.woff2",
    css: "https://fonts.googleapis.com/css2?family=Hanken+Grotesk:ital,wght@1,100..900&display=swap",
    style: "italic",
  },
];

/**
 * Picks the woff2 URL of the Latin subset from a Google Fonts stylesheet.
 * Each @font-face block carries a comment naming its subset ("/* latin *\/").
 */
export function pickLatinSource(css, style) {
  // Pairs each subset comment with the @font-face block that follows it.
  const pattern = /\/\*\s*([a-z-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g;
  for (const [, subset, block] of css.matchAll(pattern)) {
    if (subset !== "latin") continue;
    if (!new RegExp(`font-style:\\s*${style}\\b`).test(block)) continue;
    const url = block.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/)?.[1];
    if (url) return url;
  }
  return null;
}

async function ensure({ file, css, style }) {
  const target = resolve(fontsDir, file);
  if (existsSync(target)) return "present";

  const stylesheet = await (await fetch(css, { headers: { "User-Agent": USER_AGENT } })).text();
  const source = pickLatinSource(stylesheet, style);
  if (!source) throw new Error(`Could not find a Latin woff2 source for ${file}`);

  const bytes = Buffer.from(await (await fetch(source)).arrayBuffer());
  mkdirSync(fontsDir, { recursive: true });
  writeFileSync(target, bytes);
  return `downloaded (${Math.round(bytes.length / 1024)} KB)`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const font of FONTS) {
    const result = await ensure(font);
    console.log(`fonts: ${font.file} — ${result}`);
  }
}

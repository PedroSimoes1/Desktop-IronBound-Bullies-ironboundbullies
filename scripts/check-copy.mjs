/**
 * Copy rule check: no em-dashes (U+2014) or en-dashes (U+2013) in anything a
 * visitor can read. Periods, commas, colons, and hyphens only.
 *
 * Scans every .ts/.tsx file under src/ with comments removed, so the rule
 * applies to strings and JSX text but not to code comments.
 *
 * Usage: node scripts/check-copy.mjs   (exit code 1 when a violation is found)
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("../src/", import.meta.url).pathname;
const BANNED = /[–—]/;

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");
}

let failures = 0;
for (const file of walk(ROOT)) {
  const lines = stripComments(readFileSync(file, "utf8")).split("\n");
  lines.forEach((line, i) => {
    if (BANNED.test(line)) {
      failures += 1;
      console.error(`${relative(process.cwd(), file)}:${i + 1}: ${line.trim()}`);
    }
  });
}

if (failures > 0) {
  console.error(`\ncopy check: ${failures} line(s) contain an em-dash or en-dash. Use a period, comma, colon, or hyphen.`);
  process.exit(1);
}
console.log("copy check: no em-dashes or en-dashes in visitor-facing code.");

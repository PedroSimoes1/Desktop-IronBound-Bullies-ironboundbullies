#!/usr/bin/env node
/**
 * The logo placeholder, end to end.
 *
 *   A dog with no photograph shows the kennel logo in its photo frame, on the
 *   public site and in the owner area. The logo is never stored as one of the
 *   dog's photographs. The first upload replaces it everywhere, and removing
 *   the last photograph brings it back.
 *
 * Needs the same things as tests/owner.e2e.mjs: the production server on
 * :3000, DATABASE_URL pointing at a DEVELOPMENT database, and the test owner's
 * email and password. Screenshots land in /tmp/placeholder-e2e.
 *
 *   OWNER_TEST_EMAIL=… OWNER_TEST_PASSWORD=… DATABASE_URL=… npm run test:placeholder
 *
 * It uses two dogs from the seed: Amy (no photograph) and Minnie (two). Both
 * are made "available" through the owner screens so they appear as cards on
 * /available, and both are put back before it exits.
 */

import { chromium } from "playwright";
import postgres from "postgres";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const EMAIL = process.env.OWNER_TEST_EMAIL;
const PASSWORD = process.env.OWNER_TEST_PASSWORD;
const OUT = process.env.TEST_SHOT_DIR ?? "/tmp/placeholder-e2e";
const LOGO = "ironbound-placeholder-logo";
const EMPTY = "amy";
const PHOTOGRAPHED = "minnie";

if (!EMAIL || !PASSWORD || !process.env.DATABASE_URL) {
  console.error("Set OWNER_TEST_EMAIL, OWNER_TEST_PASSWORD and DATABASE_URL (a development database).");
  process.exit(1);
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const sql = postgres(process.env.DATABASE_URL, { max: 2 });
const results = [];
const check = (name, ok, detail = "") => results.push({ ok: Boolean(ok), name, detail });

async function until(read, { timeout = 20000, every = 200 } = {}) {
  const deadline = Date.now() + timeout;
  for (;;) {
    const value = await read();
    if (value) return value;
    if (Date.now() > deadline) return null;
    await new Promise((resume) => setTimeout(resume, every));
  }
}

const VIEWPORTS = [
  [360, 800],
  [390, 844],
  [430, 932],
  [768, 1024],
  [1440, 900],
];

const before = await sql`select id, status from dogs where id in (${EMPTY}, ${PHOTOGRAPHED})`;
const photoCountBefore = (await sql`select count(*)::int as n from photos where dog_id = ${EMPTY}`)[0].n;
if (photoCountBefore !== 0) {
  console.error(`${EMPTY} already has photographs; this suite needs a dog without any.`);
  process.exit(1);
}

async function putEverythingBack() {
  for (const row of before) await sql`update dogs set status = ${row.status} where id = ${row.id}`;
  await sql`delete from dog_drafts where dog_id in (${EMPTY}, ${PHOTOGRAPHED})`;
  await sql`delete from photos where dog_id = ${EMPTY}`;
  await sql`delete from sign_in_attempts where email = ${EMAIL} and succeeded = false`;
}

const browser = await chromium.launch();

async function signIn(page) {
  await page.goto(`${BASE}/owner/login`, { waitUntil: "networkidle" });
  await page.fill('input[name="email"]', EMAIL);
  await page.fill('input[name="password"]', PASSWORD);
  await Promise.all([page.waitForURL(/\/owner(\?|$)/, { timeout: 15000 }), page.click('button[type="submit"]')]);
}

/** Save and publish a status through the real form, which also rebuilds the public pages. */
async function publishStatus(page, id, status) {
  await page.goto(`${BASE}/owner/dogs/${id}`, { waitUntil: "networkidle" });
  await page.locator(`label:has(input[name="status"][value="${status}"])`).click();
  await page.click('button[form="edit-dog"]');
  await page.locator('button:has-text("Publish")').waitFor({ timeout: 15000 });
  await page.click('button:has-text("Publish")');
  await until(async () => (await sql`select status from dogs where id = ${id}`)[0].status === status);
}

/**
 * Everything about the logos on the current page, measured in the browser:
 * whether each sits wholly inside its frame with room to spare, keeps its
 * square shape, is contained rather than cropped, loads lazily, and is
 * silent to a screen reader.
 */
function inspectLogos(page) {
  return page.evaluate((logo) => {
    // A logo inside a closed dialog is not on screen; it is measured when it is.
    const visible = [...document.querySelectorAll(`img[src*="${logo}"]`)].filter((img) => img.getClientRects().length > 0);
    return visible.map((img) => {
      const frame = img.parentElement.parentElement;
      const f = frame.getBoundingClientRect();
      const b = img.getBoundingClientRect();
      const fit = getComputedStyle(img).objectFit;
      // With object-fit: contain the drawn logo is the largest square inside the box.
      const drawn = Math.min(b.width, b.height);
      return {
        alt: img.getAttribute("alt"),
        loading: img.getAttribute("loading"),
        fetchpriority: img.getAttribute("fetchpriority"),
        fit,
        loaded: img.complete && img.naturalWidth > 0,
        natural: img.naturalWidth / (img.naturalHeight || 1),
        inside: b.left >= f.left - 0.5 && b.right <= f.right + 0.5 && b.top >= f.top - 0.5 && b.bottom <= f.bottom + 0.5,
        margin: Math.min(b.left - f.left, f.right - b.right, b.top - f.top, f.bottom - b.bottom),
        drawn,
        frame: { w: Math.round(f.width), h: Math.round(f.height) },
      };
    });
  }, LOGO);
}

const overflowOf = (page) =>
  page.evaluate(() => {
    const de = document.documentElement;
    return de.scrollWidth > de.clientWidth + 1 ? `${de.scrollWidth} > ${de.clientWidth}` : null;
  });

/** Layout shift accumulated since the page started loading. */
const layoutShift = (page) =>
  page.evaluate(
    () =>
      new Promise((resolve) => {
        let total = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) if (!entry.hadRecentInput) total += entry.value;
        }).observe({ type: "layout-shift", buffered: true });
        setTimeout(() => resolve(Math.round(total * 1000) / 1000), 300);
      }),
  );

async function checkLogos(page, where, { expect }) {
  const logos = await inspectLogos(page);
  if (!expect) {
    check(`${where}: no logo`, logos.length === 0, `${logos.length} found`);
    return logos;
  }
  check(`${where}: logo shown`, logos.length > 0, `${logos.length}`);
  for (const l of logos) {
    check(`${where}: logo loaded`, l.loaded);
    check(`${where}: logo contained, not cropped or stretched`, l.fit === "contain" && Math.abs(l.natural - 1) < 0.01, `${l.fit}, ${l.natural.toFixed(3)}`);
    check(`${where}: logo inside its frame with padding`, l.inside && l.margin >= 4, `margin ${l.margin.toFixed(1)}px, frame ${l.frame.w}x${l.frame.h}`);
    check(`${where}: logo decorative (name is beside it)`, l.alt === "");
    check(`${where}: logo not high priority`, l.loading === "lazy" && l.fetchpriority !== "high", `${l.loading}/${l.fetchpriority}`);
  }
  return logos;
}

try {
  /* ---- set up: both dogs available, so both are cards on /available ---- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await signIn(page);
    await publishStatus(page, EMPTY, "available");
    await publishStatus(page, PHOTOGRAPHED, "available");
    await ctx.close();
  }

  /* ---- every viewport, public and owner ---- */
  for (const [w, h] of VIEWPORTS) {
    const label = `${w}x${h}`;
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 1024, hasTouch: w < 1024 });
    const page = await ctx.newPage();
    page.on("pageerror", (e) => check(`no page errors (${label})`, false, e.message));

    // Available: one card with a photograph, one with the logo, same frame size.
    await page.goto(`${BASE}/available`, { waitUntil: "networkidle" });
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
    await page.waitForTimeout(400);
    await checkLogos(page, `/available ${label}`, { expect: true });
    check(`/available ${label}: no sideways scroll`, (await overflowOf(page)) === null, (await overflowOf(page)) ?? "");
    const frames = await page.evaluate(() =>
      [...document.querySelectorAll("main ul li a")].map((a) => {
        const r = a.firstElementChild.getBoundingClientRect();
        return { name: a.querySelector("h2,h3")?.textContent, w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top) };
      }),
    );
    const amy = frames.find((f) => /amy/i.test(f.name ?? ""));
    const minnie = frames.find((f) => /minnie/i.test(f.name ?? ""));
    check(`/available ${label}: logo card frame matches the photo card frame`, amy && minnie && amy.w === minnie.w && amy.h === minnie.h, JSON.stringify({ amy, minnie }));
    if (amy && minnie && w >= 640) check(`/available ${label}: cards aligned in one row`, amy.top === minnie.top, `${amy.top} vs ${minnie.top}`);
    check(`/available ${label}: layout shift`, (await layoutShift(page)) < 0.1, String(await layoutShift(page)));
    if (w === 390) {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      const card = page.locator("main ul li", { hasText: "Amy" }).first();
      await card.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await card.screenshot({ path: `${OUT}/public-card-390.png` });
      await page.screenshot({ path: `${OUT}/public-available-390.png`, fullPage: true });
    }

    // Profile without a photograph.
    await page.goto(`${BASE}/dogs/${EMPTY}`, { waitUntil: "networkidle" });
    await checkLogos(page, `/dogs/${EMPTY} ${label}`, { expect: true });
    check(`/dogs/${EMPTY} ${label}: no sideways scroll`, (await overflowOf(page)) === null);
    check(`/dogs/${EMPTY} ${label}: layout shift`, (await layoutShift(page)) < 0.1, String(await layoutShift(page)));
    const clearOfHeader = await page.evaluate((logo) => {
      const img = document.querySelector(`img[src*="${logo}"]`);
      const header = document.querySelector("header");
      return img && header ? img.getBoundingClientRect().top >= header.getBoundingClientRect().bottom - 1 : false;
    }, LOGO);
    check(`/dogs/${EMPTY} ${label}: logo starts below the floating header`, clearOfHeader);
    await page.screenshot({ path: `${OUT}/profile-${EMPTY}-${w}.png` });

    // Profile with photographs: untouched.
    await page.goto(`${BASE}/dogs/${PHOTOGRAPHED}`, { waitUntil: "networkidle" });
    await checkLogos(page, `/dogs/${PHOTOGRAPHED} ${label}`, { expect: false });
    // `priority` in Next 16 means: loaded eagerly and preloaded from the head.
    const hero = await page.evaluate(() => ({
      loading: document.querySelector("article img")?.getAttribute("loading"),
      preloaded: Boolean(document.querySelector('link[rel="preload"][as="image"]')),
    }));
    check(`/dogs/${PHOTOGRAPHED} ${label}: real photograph keeps its priority`, hero.loading !== "lazy" && hero.preloaded, JSON.stringify(hero));

    // /dogs keeps the text roster for dogs without a photograph (the owner's choice).
    await page.goto(`${BASE}/dogs`, { waitUntil: "networkidle" });
    await checkLogos(page, `/dogs ${label}`, { expect: false });
    check(`/dogs ${label}: roster still lists ${EMPTY}`, await page.locator("#roster-heading").count() === 1);

    // Owner area.
    await signIn(page);
    await page.goto(`${BASE}/owner/dogs`, { waitUntil: "networkidle" });
    await checkLogos(page, `/owner/dogs ${label}`, { expect: true });
    check(`/owner/dogs ${label}: no sideways scroll`, (await overflowOf(page)) === null);
    if (w === 390) await page.screenshot({ path: `${OUT}/owner-dogs-390.png` });

    await page.goto(`${BASE}/owner/dogs/${EMPTY}`, { waitUntil: "networkidle" });
    await checkLogos(page, `/owner/dogs/${EMPTY} ${label}`, { expect: true });
    check(`/owner/dogs/${EMPTY} ${label}: no sideways scroll`, (await overflowOf(page)) === null);
    if (w === 390) await page.screenshot({ path: `${OUT}/owner-edit-390.png` });

    // The bottom bar must not cover anything once scrolled to the end.
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
    await page.waitForTimeout(500);
    const buried = await page.evaluate(() => {
      const bars = [...document.querySelectorAll("body *")].filter((el) => {
        const s = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return s.position === "fixed" && r.height > 0 && r.bottom >= window.innerHeight - 2;
      });
      for (const c of document.querySelectorAll("main button, main a[href], main input, main textarea, main select")) {
        const r = c.getBoundingClientRect();
        if (!r.width || !r.height || r.bottom < 0 || r.top > window.innerHeight) continue;
        const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        if (top && bars.some((b) => b === top || b.contains(top)) && !c.closest("label")?.contains(top)) return c.textContent?.trim().slice(0, 30);
      }
      return null;
    });
    check(`/owner/dogs/${EMPTY} ${label}: nothing hides under the bottom bar`, buried === null, buried ?? "");

    // Preview sheet (appears once the form has a change).
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.locator('label:has(input[name="status"][value="reserved"])').click();
    await page.click('button:has-text("Preview")');
    await page.locator("dialog[open]").waitFor();
    await page.waitForTimeout(400);
    const inDialog = await page.evaluate((logo) => Boolean(document.querySelector(`dialog[open] img[src*="${logo}"]`)), LOGO);
    check(`owner preview ${label}: logo shown`, inDialog);
    if (w === 390) await page.screenshot({ path: `${OUT}/owner-preview-390.png` });
    await ctx.close();
  }

  /* ---- upload replaces the logo; removing the last photograph restores it ---- */
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await signIn(page);
    await page.goto(`${BASE}/owner/dogs/${EMPTY}`, { waitUntil: "networkidle" });
    await page.setInputFiles('input[type="file"]', path.join(process.cwd(), "src/photos/minnie-01.jpg"));
    await page.fill('input[name="alt"]', "Test photograph for the placeholder suite");
    const add = page.locator('button:has-text("Add photograph")');
    await add.scrollIntoViewIfNeeded();
    await add.click();
    const landed = await until(async () => (await sql`select count(*)::int as n from photos where dog_id = ${EMPTY}`)[0].n === 1);
    check("upload stored exactly one photograph row", landed);
    const rows = await sql`select src, is_main from photos where dog_id = ${EMPTY}`;
    check("...and it is the upload, marked main, not the logo", rows.length === 1 && rows[0].is_main && !rows[0].src.includes(LOGO), JSON.stringify(rows));

    await page.goto(`${BASE}/owner/dogs/${EMPTY}`, { waitUntil: "networkidle" });
    await checkLogos(page, "owner edit after upload", { expect: false });
    await page.screenshot({ path: `${OUT}/owner-edit-after-upload-390.png` });
    await page.goto(`${BASE}/owner/dogs`, { waitUntil: "networkidle" });
    const amyRowHasLogo = await page.evaluate((logo) => Boolean(document.querySelector(`a[href="/owner/dogs/amy"] img[src*="${logo}"]`)), LOGO);
    check("owner list after upload: Amy shows her photograph", !amyRowHasLogo);
    await page.goto(`${BASE}/dogs/${EMPTY}`, { waitUntil: "networkidle" });
    await checkLogos(page, "public profile after upload", { expect: false });
    await page.goto(`${BASE}/available`, { waitUntil: "networkidle" });
    await checkLogos(page, "/available after upload", { expect: false });

    // Remove it again.
    await page.goto(`${BASE}/owner/dogs/${EMPTY}`, { waitUntil: "networkidle" });
    await page.locator('button:has-text("Remove")').first().click();
    const gone = await until(async () => (await sql`select count(*)::int as n from photos where dog_id = ${EMPTY}`)[0].n === 0);
    check("removing the last photograph leaves no rows (no placeholder record)", gone);
    await page.goto(`${BASE}/owner/dogs/${EMPTY}`, { waitUntil: "networkidle" });
    await checkLogos(page, "owner edit after removal", { expect: true });
    await page.goto(`${BASE}/owner/dogs`, { waitUntil: "networkidle" });
    const back = await page.evaluate((logo) => Boolean(document.querySelector(`a[href="/owner/dogs/amy"] img[src*="${logo}"]`)), LOGO);
    check("owner list after removal: logo is back", back);
    await page.goto(`${BASE}/dogs/${EMPTY}`, { waitUntil: "networkidle" });
    await checkLogos(page, "public profile after removal", { expect: true });
    await page.goto(`${BASE}/available`, { waitUntil: "networkidle" });
    await checkLogos(page, "/available after removal", { expect: true });
    await ctx.close();
  }

  const stored = (await sql`select count(*)::int as n from photos where src like ${"%" + LOGO + "%"}`)[0].n;
  check("the logo is never stored as a photograph", stored === 0, `${stored} rows`);
} catch (error) {
  check("the suite ran to the end", false, error?.message ?? String(error));
} finally {
  await putEverythingBack().catch(() => {});
  await browser.close();
  await sql.end();
}

const failed = results.filter((r) => !r.ok);
for (const r of results) console.log(`  ${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.detail ? `   [${r.detail}]` : ""}`);
console.log(`\n  ${results.length - failed.length} passed, ${failed.length} failed`);
console.log(`  screenshots: ${OUT}`);
console.log("  the database is back as it was; rebuild the server to refresh its cached public pages");
process.exit(failed.length ? 1 : 0);

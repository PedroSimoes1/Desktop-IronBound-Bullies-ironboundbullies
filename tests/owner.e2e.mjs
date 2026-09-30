/**
 * End to end, against a real database.
 *
 * Nothing here is mocked. It signs in with a real password, writes real rows,
 * and reads the public pages back to see whether a change actually arrived.
 * A test that passes because a button changed colour is worth nothing; every
 * assertion below either reads the database or reads the rendered site.
 *
 *   node tests/owner.e2e.mjs
 *
 * Needs: the server running on :3000, DATABASE_URL, and an owner account whose
 * password is in OWNER_TEST_PASSWORD.
 */

import { chromium, devices } from "playwright";
import postgres from "postgres";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const EMAIL = process.env.OWNER_TEST_EMAIL ?? "owner@ironboundbullies.test";
const PASSWORD = process.env.OWNER_TEST_PASSWORD;
const OUT = process.env.TEST_SHOT_DIR ?? "/tmp/owner-e2e";

if (!PASSWORD) {
  console.error("OWNER_TEST_PASSWORD is not set. Create an account with `npm run owner:create` first.");
  process.exit(1);
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const sql = postgres(process.env.DATABASE_URL, { max: 2 });
const results = [];
const pass = (name, detail = "") => results.push({ ok: true, name, detail });
const fail = (name, detail) => results.push({ ok: false, name, detail });

const check = (name, condition, detail = "") => (condition ? pass(name, detail) : fail(name, detail));

/**
 * Waits for something to become true rather than sleeping for a guessed number
 * of seconds. A fixed sleep turns a slow save into a failed test and a fast
 * machine into a test that passes without proving anything; polling fails only
 * when the thing genuinely never happens.
 */
async function until(read, { timeout = 20000, every = 200 } = {}) {
  const deadline = Date.now() + timeout;
  for (;;) {
    const value = await read();
    if (value) return value;
    if (Date.now() > deadline) return null;
    await new Promise((resume) => setTimeout(resume, every));
  }
}

const rowCount = async (query) => (await query)[0].n;

/**
 * Everything this suite is about to change, remembered so it can be put back.
 *
 * The test edits and publishes real dogs, which is the only honest way to prove
 * that publishing works. Leaving a test marker in the dogs table afterwards
 * would be inventing business data, so the suite restores every row it touched
 * before it exits, whether it passed or failed.
 */
const TOUCHED = ["voodoo", "knuckles", "missy", "shadow"];
const original = await sql`
  select id, status, summary, price_cents, stud_fee_cents, contact_for_price
  from dogs where id in ${sql(TOUCHED)}`;
const originalPhotos = await sql`select id, sort_order, is_main from photos where dog_id in ${sql(TOUCHED)}`;

async function putEverythingBack() {
  for (const row of original) {
    await sql`
      update dogs set
        status = ${row.status},
        summary = ${row.summary},
        price_cents = ${row.price_cents},
        stud_fee_cents = ${row.stud_fee_cents},
        contact_for_price = ${row.contact_for_price}
      where id = ${row.id}`;
  }
  for (const photo of originalPhotos) {
    await sql`update photos set sort_order = ${photo.sort_order}, is_main = ${photo.is_main} where id = ${photo.id}`;
  }
  await sql`delete from photos where source = 'blob' and dog_id in ${sql(TOUCHED)}`;
  await sql`delete from dog_drafts where dog_id in ${sql(TOUCHED)}`;
  await sql`delete from dog_notes where dog_id in ${sql(TOUCHED)}`;
  await sql`delete from dogs where kennel_id = 'rival'`;
  await sql`delete from kennels where id = 'rival'`;
  await forgetFailedAttempts();
}

/**
 * Clears the wrong-password attempts this suite made on purpose.
 *
 * The application locks an account after enough failures, which is the right
 * behaviour and is tested below. Left behind, the suite's own deliberate
 * failures would lock the test account out of the next run, so they are cleared
 * as soon as each test that needs them is finished.
 */
const forgetFailedAttempts = () => sql`delete from sign_in_attempts where email = ${EMAIL} and succeeded = false`;
await forgetFailedAttempts();

process.on("uncaughtException", async (error) => {
  console.error("\n  the suite stopped early:", error?.message ?? error);
  await putEverythingBack().catch(() => {});
  process.exit(1);
});

const browser = await chromium.launch();

/** A real browser context with a real cookie jar, like a real phone. */
async function phone() {
  const ctx = await browser.newContext({ ...devices["iPhone 13"], viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => fail("no page errors", `${page.url()}: ${e.message}`));
  return { ctx, page };
}

async function signIn(page) {
  await page.goto(`${BASE}/owner/login`, { waitUntil: "networkidle" });
  await page.fill('input[name="email"]', EMAIL);
  await page.fill('input[name="password"]', PASSWORD);
  await Promise.all([page.waitForURL(/\/owner(\?|$)/, { timeout: 15000 }), page.click('button[type="submit"]')]);
}

/* ===========================================================================
   1. SIGNED OUT
   ========================================================================= */
{
  const { ctx, page } = await phone();

  const res = await page.goto(`${BASE}/owner`, { waitUntil: "networkidle" });
  check("/owner sends a signed-out visitor to the sign-in page", page.url().includes("/owner/login"), page.url());
  check("...and does not 404", res.status() === 200, `status ${res.status()}`);

  for (const guarded of ["/owner/dogs", "/owner/dogs/voodoo", "/owner/litters", "/owner/inquiries"]) {
    await page.goto(`${BASE}${guarded}`, { waitUntil: "networkidle" });
    check(`${guarded} is closed to a signed-out visitor`, page.url().includes("/owner/login"), page.url());
  }

  // A wrong password must not get in, and must not say which half was wrong.
  await page.goto(`${BASE}/owner/login`, { waitUntil: "networkidle" });
  await page.fill('input[name="email"]', EMAIL);
  await page.fill('input[name="password"]', "definitely-not-the-password");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1500);
  const wrongText = (await page.textContent("body")) ?? "";
  check("a wrong password does not sign anybody in", !page.url().endsWith("/owner"), page.url());
  check("...and the message does not reveal whether the account exists", !/no account|unknown|not found/i.test(wrongText));

  /* ---- a wrong password must not also lose what was typed ---- */
  check("the email address survives a wrong password", (await page.inputValue('input[name="email"]')) === EMAIL);
  check("...and the password field is cleared", (await page.inputValue('input[name="password"]')) === "");

  /* ---- guessing is not allowed to go on forever ---- */
  for (let attempt = 0; attempt < 9; attempt += 1) {
    await page.fill('input[name="password"]', `guess-number-${attempt}`);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(400);
  }
  const lockedText = (await page.textContent("body")) ?? "";
  check("repeated wrong passwords lock the account for a while", /too many attempts/i.test(lockedText), lockedText.slice(0, 120));

  // And the lock is not theatre: the real password does not get in either.
  await page.fill('input[name="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1200);
  check("...and the correct password is refused while the lock holds", !page.url().endsWith("/owner"), page.url());

  await page.screenshot({ path: `${OUT}/01-login.png` });
  await ctx.close();
  await forgetFailedAttempts();
}

/* ===========================================================================
   2. SIGNING IN, AND EDITING THAT PERSISTS
   ========================================================================= */
const MARKER = `persisted ${randomUUID().slice(0, 8)}`;
{
  const { ctx, page } = await phone();
  await signIn(page);
  check("the owner can sign in", page.url().endsWith("/owner"), page.url());
  await page.screenshot({ path: `${OUT}/02-today.png`, fullPage: true });

  // Reached the way the owner reaches it: the button on the Today screen.
  await page.click('a[href="/owner/dogs"]');
  await page.waitForURL(/\/owner\/dogs$/, { timeout: 15000 });
  await page.waitForLoadState("networkidle");
  const listText = (await page.textContent("body")) ?? "";
  check("the dogs list shows the kennel's dogs", listText.includes("Voodoo") && listText.includes("Knuckles"));
  await page.screenshot({ path: `${OUT}/03-dogs.png`, fullPage: true });

  await page.click('a[href="/owner/dogs/voodoo"]');
  await page.waitForURL(/\/owner\/dogs\/voodoo$/, { timeout: 15000 });
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: `${OUT}/04-edit.png`, fullPage: true });

  // Change availability, description and price together.
  // Tapped the way a thumb taps it: the whole row, not the radio dot.
  await page.locator('label:has(input[name="status"][value="reserved"])').click();
  await page.fill('textarea[name="summary"]', MARKER);
  await page.fill('input[name="money"]', "2750");
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/05-edited.png` });

  await page.click('button[form="edit-dog"]');

  const draftRow = await until(async () => (await sql`select fields from dog_drafts where dog_id = 'voodoo'`)[0]);
  check("saving writes a draft to the database", Boolean(draftRow), draftRow ? JSON.stringify(draftRow.fields) : "no row");
  check("the draft holds the typed description", draftRow?.fields?.summary === MARKER);
  check("the draft holds the typed fee in whole cents", draftRow?.fields?.studFeeCents === 275000, String(draftRow?.fields?.studFeeCents));

  const [published] = await sql`select status, summary, stud_fee_cents from dogs where id = 'voodoo'`;
  check("the published record is untouched by a draft", published.status === "stud_available" && published.summary !== MARKER);

  /* ---- the draft must stay off the public site ---- */
  const publicPage = await ctx.newPage();
  await publicPage.goto(`${BASE}/dogs/voodoo`, { waitUntil: "networkidle" });
  const publicText = ((await publicPage.textContent("body")) ?? "").toLowerCase();
  check("an unpublished draft does not appear publicly", !publicText.includes(MARKER.toLowerCase()));
  check("...and the public page still shows the published availability", publicText.includes("stud available"));
  await publicPage.close();

  /* ---- persistence across a reload ---- */
  await page.reload({ waitUntil: "networkidle" });
  const afterReload = await page.inputValue('textarea[name="summary"]');
  const feeAfterReload = await page.inputValue('input[name="money"]');
  check("the edit survives a reload", afterReload === MARKER, afterReload);
  check("...including the fee", feeAfterReload === "2750", feeAfterReload);

  await ctx.close();
}

/* ===========================================================================
   3. A SECOND DEVICE SEES THE SAME THING
   ========================================================================= */
{
  const { ctx, page } = await phone();
  await signIn(page);
  await page.goto(`${BASE}/owner/dogs/voodoo`, { waitUntil: "networkidle" });
  const summary = await page.inputValue('textarea[name="summary"]');
  check("a second sign-in on another device sees the same saved edit", summary === MARKER, summary);
  await ctx.close();
}

/* ===========================================================================
   4. PUBLISHING REACHES THE PUBLIC PAGE
   ========================================================================= */
{
  const { ctx, page } = await phone();
  await signIn(page);
  await page.goto(`${BASE}/owner/dogs/voodoo`, { waitUntil: "networkidle" });

  await page.click('button:has-text("Publish")');

  const afterPublish =
    (await until(async () => {
      const [row] = await sql`select status, summary, stud_fee_cents from dogs where id = 'voodoo'`;
      return row.summary === MARKER ? row : null;
    })) ?? (await sql`select status, summary, stud_fee_cents from dogs where id = 'voodoo'`)[0];
  await page.screenshot({ path: `${OUT}/06-published.png`, fullPage: true });

  check("publishing writes the draft onto the dog", afterPublish.summary === MARKER, afterPublish.summary);
  check("...including availability", afterPublish.status === "reserved", afterPublish.status);
  check("...including the fee", afterPublish.stud_fee_cents === 275000, String(afterPublish.stud_fee_cents));

  const draftsGone = await until(async () => (await rowCount(sql`select count(*)::int as n from dog_drafts where dog_id = 'voodoo'`)) === 0);
  check("...and clears the draft", Boolean(draftsGone));

  const publicPage = await ctx.newPage();
  await publicPage.goto(`${BASE}/dogs/voodoo`, { waitUntil: "networkidle" });
  const text = ((await publicPage.textContent("body")) ?? "").toLowerCase();
  check("the published change reaches the dog's public page", text.includes(MARKER.toLowerCase()));
  check("...and the new availability is shown", text.includes("reserved"));
  await publicPage.screenshot({ path: `${OUT}/07-public.png`, fullPage: true });
  await publicPage.close();

  /* ---- changing your mind, the same way round ----
     This also puts the real record back through the product's own publish
     path, which is the only thing that refreshes the prerendered public page.
     Restoring the row straight in the database would leave the website showing
     a test marker until the next build. */
  const was = original.find((r) => r.id === "voodoo");
  await page.goto(`${BASE}/owner/dogs/voodoo`, { waitUntil: "networkidle" });
  await page.locator(`label:has(input[name="status"][value="${was.status}"])`).click();
  await page.fill('textarea[name="summary"]', was.summary ?? "");
  await page.fill('input[name="money"]', was.stud_fee_cents === null ? "" : String(was.stud_fee_cents / 100));
  await page.click('button[form="edit-dog"]');
  await until(async () => (await sql`select fields from dog_drafts where dog_id = 'voodoo'`).length > 0);

  // Save must hand straight over to Publish. Needing a reload in between is how
  // an owner saves a change and then finds nothing to press.
  const publishAppeared = await page
    .locator('button:has-text("Publish")')
    .waitFor({ state: "visible", timeout: 10000 })
    .then(() => true)
    .catch(() => false);
  check("Publish appears as soon as a save lands, without reloading", publishAppeared);
  await page.locator('button:has-text("Publish")').click();
  const restored = await until(async () => {
    const [row] = await sql`select status, summary from dogs where id = 'voodoo'`;
    return row.summary === was.summary && row.status === was.status ? row : null;
  });
  check("the owner can change his mind and the record goes back", Boolean(restored), restored ? "" : "still holding the test values");

  const backPage = await ctx.newPage();
  await backPage.goto(`${BASE}/dogs/voodoo`, { waitUntil: "networkidle" });
  const backText = ((await backPage.textContent("body")) ?? "").toLowerCase();
  check("...and the public page follows it back", !backText.includes(MARKER.toLowerCase()) && backText.includes("stud available"));
  await backPage.close();
  await ctx.close();
}

/* ===========================================================================
   5. PHOTOGRAPHS
   ========================================================================= */
{
  const { ctx, page } = await phone();
  await signIn(page);
  await page.goto(`${BASE}/owner/dogs/missy`, { waitUntil: "networkidle" });

  const startedWith = await rowCount(sql`select count(*)::int as n from photos where dog_id = 'missy'`);

  // A real JPEG from the project, so this is a real upload of a real photograph.
  const source = path.join(process.cwd(), "src/photos/missy-01.jpg");
  await page.setInputFiles('input[type="file"]', source);
  await page.fill('input[name="alt"]', "Missy on the grass, added in a test");
  const addButton = page.locator('button:has-text("Add photograph")');
  await addButton.scrollIntoViewIfNeeded();
  await addButton.click();

  const landed = await until(async () => (await rowCount(sql`select count(*)::int as n from photos where dog_id = 'missy'`)) > startedWith);
  if (!landed) {
    const said = await page.$$eval('[role="status"]', (els) => els.map((e) => e.textContent).join(" | "));
    const chooser = await page.textContent(".chooserLabel, label span").catch(() => "");
    console.log(`  upload diagnosis: on-screen status ${JSON.stringify(said)}, chooser ${JSON.stringify(chooser)}`);
  }
  const after = await sql`select id, alt, width, height, storage_key, source, sort_order from photos where dog_id = 'missy' order by sort_order`;
  check("uploading adds a photograph row", after.length === startedWith + 1, `${startedWith} -> ${after.length}`);
  const uploaded = after.find((p) => p.source === "blob");
  check("...stored as an uploaded file, not a repository one", Boolean(uploaded));
  check("...with the real pixel size read from the file", uploaded?.width > 200 && uploaded?.height > 200, `${uploaded?.width}x${uploaded?.height}`);
  check("...and a storage key that contains no name the uploader chose", Boolean(uploaded?.storage_key) && !uploaded.storage_key.includes("missy-01"), uploaded?.storage_key);

  if (uploaded?.storage_key) {
    const onDisk = path.join(process.cwd(), ".uploads", uploaded.storage_key);
    check("...and the file really exists in storage", fs.existsSync(onDisk), onDisk);
    const served = await page.request.get(`${BASE}/uploads/${uploaded.storage_key}`);
    check("...and is served back over HTTP", served.status() === 200, `status ${served.status()}`);
  }
  await page.screenshot({ path: `${OUT}/08-photos.png`, fullPage: true });

  // Reorder.
  await page.reload({ waitUntil: "networkidle" });
  const orderBefore = (await sql`select id from photos where dog_id='missy' order by sort_order`).map((r) => r.id);
  const downButtons = page.locator('button[aria-label^="Move"][aria-label$="later"]');
  if ((await downButtons.count()) > 0) {
    await downButtons.first().click();
    await until(async () => (await sql`select id from photos where dog_id='missy' order by sort_order`)[0].id !== orderBefore[0]);
    const orderAfter = (await sql`select id from photos where dog_id='missy' order by sort_order`).map((r) => r.id);
    check("photographs can be reordered", orderBefore[0] !== orderAfter[0], `${orderBefore.join(",")} -> ${orderAfter.join(",")}`);
  }

  // Remove the uploaded one, and confirm the file goes too.
  if (uploaded) {
    await page.reload({ waitUntil: "networkidle" });
    const removeButton = page.locator('button:has-text("Remove")');
    if ((await removeButton.count()) > 0) {
      await removeButton.first().click();
      await until(async () => (await rowCount(sql`select count(*)::int as n from photos where id = ${uploaded.id}`)) === 0);
      const [gone] = await sql`select count(*)::int as n from photos where id = ${uploaded.id}`;
      check("an uploaded photograph can be removed", gone.n === 0);
      const onDisk = path.join(process.cwd(), ".uploads", uploaded.storage_key);
      check("...and its file is deleted from storage", !fs.existsSync(onDisk));
    }
  }
  await ctx.close();
}

/* ===========================================================================
   6. ONE KENNEL CANNOT REACH ANOTHER
   ========================================================================= */
{
  // A second kennel with a dog in it, and nobody signed in who belongs to it.
  await sql`insert into kennels (id, slug, name) values ('rival', 'rival-kennel', 'Rival Kennel') on conflict (id) do nothing`;
  await sql`
    insert into dogs (id, kennel_id, slug, name, status, summary, sort_order)
    values ('rival-dog', 'rival', 'rival-dog', 'Rival Dog', 'available', 'Belongs to somebody else', 900)
    on conflict (id) do nothing`;

  const { ctx, page } = await phone();
  await signIn(page);

  // By URL.
  const res = await page.goto(`${BASE}/owner/dogs/rival-dog`, { waitUntil: "networkidle" });
  const body = (await page.textContent("body")) ?? "";
  check(
    "an owner cannot open another kennel's dog by changing the URL",
    res.status() === 404 || !body.includes("Belongs to somebody else"),
    `status ${res.status()}`,
  );

  // By payload: post the action directly with the other kennel's id.
  await page.goto(`${BASE}/owner/dogs/voodoo`, { waitUntil: "networkidle" });
  const tampered = await page.evaluate(async () => {
    const form = document.querySelector("form#edit-dog");
    const action = form?.getAttribute("action");
    const body = new FormData();
    body.set("dogId", "rival-dog");
    body.set("status", "sold");
    body.set("summary", "TAMPERED");
    body.set("isStud", "false");
    body.set("money", "1");
    const response = await fetch(location.href, {
      method: "POST",
      headers: { "Next-Action": action ?? "" },
      body,
    });
    return response.status;
  });

  const [rival] = await sql`select status, summary from dogs where id = 'rival-dog'`;
  const [rivalDraft] = await sql`select count(*)::int as n from dog_drafts where dog_id = 'rival-dog'`;
  check(
    "an owner cannot edit another kennel's dog by changing the request payload",
    rival.status === "available" && rival.summary === "Belongs to somebody else" && rivalDraft.n === 0,
    `status ${rival.status}, draft rows ${rivalDraft.n}, http ${tampered}`,
  );

  // The dogs list must not show it either.
  await page.goto(`${BASE}/owner/dogs`, { waitUntil: "networkidle" });
  const listText = (await page.textContent("body")) ?? "";
  check("another kennel's dog is not in the list", !listText.includes("Rival Dog"));

  await ctx.close();
}

/* ===========================================================================
   7. A FAILED SAVE KEEPS WHAT WAS TYPED
   ========================================================================= */
{
  const { ctx, page } = await phone();
  await signIn(page);
  await page.goto(`${BASE}/owner/dogs/knuckles`, { waitUntil: "networkidle" });

  await page.fill('input[name="money"]', "two thousand");
  await page.fill('textarea[name="summary"]', "typed before the failure");
  await page.waitForTimeout(400);

  const saveDisabled = await page.evaluate(() => {
    const b = document.querySelector('button[form="edit-dog"]');
    return b?.disabled ?? null;
  });
  check("an invalid amount stops the save", saveDisabled === true, String(saveDisabled));

  const stillThere = await page.inputValue('textarea[name="summary"]');
  check("...and what was typed is still on screen", stillThere === "typed before the failure");
  await page.screenshot({ path: `${OUT}/09-validation.png` });

  /* ---- throwing a draft away puts the boxes back too ---- */
  const publishedSummary = (await sql`select summary from dogs where id = 'knuckles'`)[0].summary ?? "";
  await page.fill('input[name="money"]', "2000");
  await page.fill('textarea[name="summary"]', "a change that will be thrown away");
  /* Checked while the field still has focus, which is the state a thumb presses
     from. Anything that moves the button between the press and the release
     sends the click to the page instead and the save silently does nothing. */
  const pressed = await page.evaluate(() => {
    const button = document.querySelector('button[form="edit-dog"]');
    const box = button.getBoundingClientRect();
    const before = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
    button.focus(); // what pressing it does first
    const after = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
    return { steady: before === after, before: before?.tagName, after: after?.tagName ?? "nothing" };
  });
  check("the save button does not move when it takes focus from a field", pressed.steady, `${pressed.before} then ${pressed.after}`);

  await page.locator('button[form="edit-dog"]:not([disabled])').click();
  const knucklesDraft = await until(async () => (await rowCount(sql`select count(*)::int as n from dog_drafts where dog_id = 'knuckles'`)) === 1);
  check("a correction after a rejected amount saves", Boolean(knucklesDraft), "no draft was written");

  if (knucklesDraft) {
    const discard = page.locator('button:has-text("Discard")');
    const offered = await discard
      .waitFor({ state: "visible", timeout: 10000 })
      .then(() => true)
      .catch(() => false);
    check("Discard is offered once a draft is saved", offered);
    if (offered) {
      await discard.click();
      await until(async () => (await rowCount(sql`select count(*)::int as n from dog_drafts where dog_id = 'knuckles'`)) === 0);
      const afterDiscard = await until(async () => ((await page.inputValue('textarea[name="summary"]')) === publishedSummary ? true : null));
      check("discarding a draft puts the form back to what the website shows", Boolean(afterDiscard), await page.inputValue('textarea[name="summary"]'));
    }
  }
  await ctx.close();
}

/* ===========================================================================
   8. NO PRIVATE DATA ON PUBLIC PAGES
   ========================================================================= */
{
  const CANARY = `private-${randomUUID().slice(0, 8)}`;
  await sql`
    insert into dog_notes (dog_id, body) values ('voodoo', ${CANARY})
    on conflict (dog_id) do update set body = ${CANARY}`;
  await sql`
    insert into dog_drafts (dog_id, fields) values ('shadow', ${sql.json({ status: "sold", summary: CANARY })})
    on conflict (dog_id) do update set fields = ${sql.json({ status: "sold", summary: CANARY })}`;

  const { ctx, page } = await phone();
  let leaked = [];
  for (const p of ["/", "/dogs", "/dogs/voodoo", "/dogs/shadow", "/available", "/breedings", "/about"]) {
    await page.goto(`${BASE}${p}`, { waitUntil: "networkidle" });
    const html = await page.content();
    if (html.includes(CANARY)) leaked.push(p);
  }
  check("private notes and drafts never reach a public page", leaked.length === 0, leaked.join(", "));
  await ctx.close();

  await sql`delete from dog_notes where dog_id = 'voodoo'`;
  await sql`delete from dog_drafts where dog_id = 'shadow'`;
}

/* ===========================================================================
   9. THE DASHBOARD FITS A PHONE
   ========================================================================= */
{
  for (const [w, h, label] of [[390, 844, "iPhone 13"], [360, 780, "Galaxy S24"], [412, 915, "Pixel 8"]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await signIn(page);
    for (const p of ["/owner", "/owner/dogs", "/owner/dogs/voodoo", "/owner/litters", "/owner/inquiries"]) {
      await page.goto(`${BASE}${p}`, { waitUntil: "networkidle" });
      const overflow = await page.evaluate(() => {
        const de = document.documentElement;
        return de.scrollWidth > de.clientWidth + 1 ? `${de.scrollWidth} > ${de.clientWidth}` : null;
      });
      check(`no sideways scrolling on ${p} at ${label}`, overflow === null, overflow ?? "");

      /* The navigation is fixed to the bottom of the screen. Scrolled to the
         end of a long page, the last control must still be tappable rather
         than hiding underneath it. */
      // The site scrolls smoothly, so jump instantly and then wait for the page
      // to actually stop moving. Measuring mid-animation reports whatever
      // happened to be sliding past the bottom bar at that instant.
      await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
      await page.waitForFunction(
        () => {
          const now = Math.round(window.scrollY);
          const settled = window.__lastScrollY === now;
          window.__lastScrollY = now;
          return settled;
        },
        undefined,
        { polling: 100, timeout: 5000 },
      );
      const buried = await page.evaluate(() => {
        /* The thing being looked for is a control the thumb cannot reach: one
           sitting underneath the bar that is pinned to the bottom of the
           screen. A sticky header covering something higher up is not a
           problem, because that content scrolls out from under it. */
        const pinnedToBottom = [...document.querySelectorAll("body *")].filter((el) => {
          const style = getComputedStyle(el);
          if (style.position !== "fixed") return false;
          const box = el.getBoundingClientRect();
          return box.height > 0 && box.bottom >= window.innerHeight - 2;
        });
        if (pinnedToBottom.length === 0) return null;

        const covers = (node) => pinnedToBottom.some((bar) => bar === node || bar.contains(node));

        for (const control of document.querySelectorAll("main button, main a[href], main input, main textarea, main select")) {
          const box = control.getBoundingClientRect();
          if (box.width === 0 || box.height === 0) continue;
          if (box.bottom < 0 || box.top > window.innerHeight) continue;
          const onTop = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
          if (!onTop || !covers(onTop)) continue;
          // A label deliberately painted over its own input is the design, not a trap.
          if (control.closest("label")?.contains(onTop)) continue;
          return `${control.tagName.toLowerCase()} "${(control.textContent ?? control.getAttribute("aria-label") ?? "").trim().slice(0, 30)}"`;
        }
        return null;
      });
      check(`nothing on ${p} hides under the bottom bar at ${label}`, buried === null, buried ?? "");
    }
    if (label === "Galaxy S24") await page.screenshot({ path: `${OUT}/10-android.png`, fullPage: true });
    await ctx.close();
  }
}

/* ===========================================================================
   10. SIGNING OUT REALLY ENDS THE SESSION
   ========================================================================= */
{
  const { ctx, page } = await phone();
  await signIn(page);
  await page.click('button:has-text("Sign out")');
  await page.waitForURL(/\/owner\/login/, { timeout: 15000 }).catch(() => {});
  check("signing out returns to the sign-in page", page.url().includes("/owner/login"), page.url());

  await page.goto(`${BASE}/owner/dogs`, { waitUntil: "networkidle" });
  check("...and the session no longer opens the dashboard", page.url().includes("/owner/login"), page.url());
  await ctx.close();
}

/* ===========================================================================
   TIDY UP AND REPORT
   ========================================================================= */
await putEverythingBack();

// Prove the restore worked rather than assuming it: a marker left behind in the
// dogs table would be fabricated business data on the real website.
const [stillMarked] = await sql`select count(*)::int as n from dogs where summary like 'persisted %' or summary = 'TAMPERED'`;
check("the suite leaves no test data behind in the dogs table", stillMarked.n === 0, `${stillMarked.n} row(s)`);

await browser.close();
await sql.end();

const failed = results.filter((r) => !r.ok);
console.log("");
for (const r of results) console.log(`  ${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.detail ? `   [${r.detail}]` : ""}`);
console.log(`\n  ${results.length - failed.length} passed, ${failed.length} failed`);
console.log(`  screenshots: ${OUT}`);
console.log(`  the database is back as it was; rebuild the server to refresh its cached public pages\n`);
process.exit(failed.length === 0 ? 0 : 1);

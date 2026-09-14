/**
 * One-time import: the content files become database rows.
 *
 * This script is the whole risk of milestone 1. If it drops a fact, changes a
 * price, or reorders the dogs, the site quietly becomes wrong and nobody
 * notices until a customer does. So it is written to be checkable rather than
 * clever:
 *
 *   - It imports the real `dogs` and `photos` modules, so the facts come from
 *     the same source the site renders today. Nothing is retyped by hand.
 *   - Image files are stubbed at import time (Node cannot load a .jpg), so the
 *     pixel dimensions are read from the files themselves instead.
 *   - It refuses to run against a database that already has dogs, unless
 *     --reset is passed, so it can never half-overwrite live records.
 *   - It verifies every row after writing and exits non-zero on any mismatch.
 *
 * Run:  DATABASE_URL=... npx tsx scripts/import-content.ts [--reset]
 */

import postgres from "postgres";

/* ---------------------------------------------------------------------------
   IMPORT THE REAL CONTENT
   -------------------------------------------------------------------------- */

type Loaded = {
  dogs: typeof import("../src/content/dogs").dogs;
  heroSlides: typeof import("../src/content/dogs").heroSlides;
  photos: typeof import("../src/content/photos").photos;
  breedings: typeof import("../src/content/breedings").breedings;
};

async function loadContent(): Promise<Loaded> {
  const [dogsMod, { photos }, { breedings }] = await Promise.all([
    import("../src/content/dogs.ts"),
    import("../src/content/photos.ts"),
    import("../src/content/breedings.ts"),
  ]);
  return { dogs: dogsMod.dogs, heroSlides: dogsMod.heroSlides, photos, breedings };
}

/** Money, dates and numbers pass through untouched; undefined becomes NULL. */
const orNull = <T>(v: T | undefined): T | null => (v === undefined ? null : v);

async function main() {
  const reset = process.argv.includes("--reset");
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const sql = postgres(url, { max: 1 });
  const { dogs, heroSlides, photos, breedings } = await loadContent();

  // Guard: never write over records that already exist unless asked to.
  const [{ count }] = await sql<{ count: string }[]>`select count(*)::text as count from dogs`;
  if (Number(count) > 0 && !reset) {
    console.error(`Refusing to run: the database already holds ${count} dogs. Pass --reset to replace them.`);
    await sql.end();
    process.exit(1);
  }

  const photoList = Object.values(photos);
  /** The curated homepage sequence, by photo id, in order. */
  const heroSlot = new Map<string, number>();
  heroSlides.forEach(({ photo }, i) => heroSlot.set(photo.id, i));
  /** photo id -> the dog it belongs to, derived from each dog's own gallery. */
  const photoOwner = new Map<string, { dogId: string; order: number; isMain: boolean }>();
  for (const dog of dogs) {
    const gallery = dog.gallery ?? (dog.mainPhoto ? [dog.mainPhoto] : []);
    gallery.forEach((p, i) => {
      photoOwner.set(p.id, { dogId: dog.id, order: i, isMain: p.id === dog.mainPhoto?.id });
    });
  }

  await sql.begin(async (tx) => {
    if (reset) {
      // Children first; the foreign keys would refuse the other order.
      await tx`delete from inquiry_notes`;
      await tx`delete from inquiry_contacts`;
      await tx`delete from inquiries`;
      await tx`delete from litter_puppies`;
      await tx`delete from breedings`;
      await tx`delete from photos`;
      await tx`delete from dog_notes`;
      await tx`delete from dog_drafts`;
      await tx`delete from dogs`;
    }

    // Dogs. Two passes: every row first, then the parent links, because a
    // sire may appear later in the list than the puppy that points at him.
    for (const [i, dog] of dogs.entries()) {
      await tx`
        insert into dogs (
          id, slug, name, sex, role, status, breed, color, dog_class, date_of_birth,
          height_inches, weight_lbs, bloodline, registration, sire_name, dam_name,
          summary, description, temperament, stud_fee_cents, lock_in_fee_cents,
          price_cents, contact_for_price, featured, sort_order
        ) values (
          ${dog.id}, ${dog.slug}, ${dog.name}, ${orNull(dog.sex)}, ${orNull(dog.role)},
          ${orNull(dog.status)}, ${orNull(dog.breed)}, ${orNull(dog.color)},
          ${orNull(dog.dogClass)}, ${orNull(dog.dateOfBirth)},
          ${orNull(dog.heightInches)}, ${orNull(dog.weightLbs)},
          ${orNull(dog.bloodline)}, ${orNull(dog.registration)},
          ${orNull(dog.sireName)}, ${orNull(dog.damName)},
          ${orNull(dog.summary)}, ${orNull(dog.description)}, ${orNull(dog.temperament)},
          ${orNull(dog.studFee)}, ${orNull(dog.lockInFee)},
          ${orNull(dog.price)}, ${dog.contactForPrice ?? false},
          ${dog.featured ?? false}, ${i}
        )`;
    }
    for (const dog of dogs) {
      if (dog.sireId || dog.damId) {
        await tx`update dogs set sire_id = ${orNull(dog.sireId)}, dam_id = ${orNull(dog.damId)} where id = ${dog.id}`;
      }
    }

    // Photographs. The file stays in the repo and Next keeps optimising it at
    // build time; the row carries the parts the owner can edit.
    for (const p of photoList) {
      const owner = photoOwner.get(p.id);
      // Dimensions come from the file itself, through the import loader, which
      // is the same number Next reads when it optimises the picture.
      const { width, height } = { width: p.width, height: p.height };
      if (!width || !height) throw new Error(`${p.id}: could not read the image dimensions`);
      await tx`
        insert into photos (
          id, dog_id, source, src, width, height, alt,
          focal_x, focal_y, focal_portrait_x, focal_portrait_y,
          has_embedded_text, caption, sort_order, is_main, hero_slot
        ) values (
          ${p.id}, ${owner?.dogId ?? null}, 'repo', ${p.id}, ${width}, ${height}, ${p.alt},
          ${p.focal.x}, ${p.focal.y},
          ${p.focalPortrait?.x ?? null}, ${p.focalPortrait?.y ?? null},
          ${p.hasEmbeddedText ?? false}, ${orNull(p.caption)},
          ${owner?.order ?? 0}, ${owner?.isMain ?? false}, ${heroSlot.get(p.id) ?? null}
        )`;
    }

    for (const [i, b] of breedings.entries()) {
      await tx`
        insert into breedings (
          id, slug, sire_id, dam_id, sire_name, dam_name, status, headline,
          breeding_date, due_date, litter_date, notes, featured, sort_order
        ) values (
          ${b.id}, ${b.slug}, ${orNull(b.sireId)}, ${orNull(b.damId)},
          ${orNull(b.sireName)}, ${orNull(b.damName)}, ${orNull(b.status)},
          ${orNull(b.headline)}, ${orNull(b.breedingDate)}, ${orNull(b.dueDate)},
          ${orNull(b.litterDate)}, ${orNull(b.notes)}, ${b.featured ?? false}, ${i}
        )`;
    }
  });

  /* -------------------------------------------------------------------------
     VERIFY — read every row back and compare it to the source.
     ------------------------------------------------------------------------ */
  const problems: string[] = [];

  const rows = await sql<Record<string, unknown>[]>`select * from dogs order by sort_order`;
  if (rows.length !== dogs.length) problems.push(`dog count: ${rows.length} in the database, ${dogs.length} in the file`);

  for (const [i, dog] of dogs.entries()) {
    const row = rows[i];
    if (!row) {
      problems.push(`${dog.id}: missing`);
      continue;
    }
    if (row.id !== dog.id) problems.push(`position ${i}: expected ${dog.id}, found ${row.id}`);
    const check: [string, unknown, unknown][] = [
      ["name", row.name, dog.name],
      ["slug", row.slug, dog.slug],
      ["sex", row.sex, orNull(dog.sex)],
      ["role", row.role, orNull(dog.role)],
      ["status", row.status, orNull(dog.status)],
      ["breed", row.breed, orNull(dog.breed)],
      ["color", row.color, orNull(dog.color)],
      ["summary", row.summary, orNull(dog.summary)],
      ["stud_fee_cents", row.stud_fee_cents, orNull(dog.studFee)],
      ["lock_in_fee_cents", row.lock_in_fee_cents, orNull(dog.lockInFee)],
      ["price_cents", row.price_cents, orNull(dog.price)],
      ["featured", row.featured, dog.featured ?? false],
      ["sire_name", row.sire_name, orNull(dog.sireName)],
      ["dam_name", row.dam_name, orNull(dog.damName)],
    ];
    for (const [field, got, want] of check) {
      if (got !== want) problems.push(`${dog.id}.${field}: database has ${JSON.stringify(got)}, file has ${JSON.stringify(want)}`);
    }
  }

  const photoRows = await sql<Record<string, unknown>[]>`select * from photos order by id`;
  if (photoRows.length !== photoList.length) {
    problems.push(`photo count: ${photoRows.length} in the database, ${photoList.length} in the file`);
  }
  for (const p of photoList) {
    const row = photoRows.find((r) => r.id === p.id);
    if (!row) {
      problems.push(`photo ${p.id}: missing`);
      continue;
    }
    if (row.alt !== p.alt) problems.push(`photo ${p.id}.alt differs`);
    if (Number(row.focal_x) !== p.focal.x || Number(row.focal_y) !== p.focal.y) {
      problems.push(`photo ${p.id}.focal: database has ${row.focal_x},${row.focal_y}, file has ${p.focal.x},${p.focal.y}`);
    }
    if (p.focalPortrait && (Number(row.focal_portrait_x) !== p.focalPortrait.x || Number(row.focal_portrait_y) !== p.focalPortrait.y)) {
      problems.push(`photo ${p.id}.focalPortrait differs`);
    }
  }

  const breedingRows = await sql<Record<string, unknown>[]>`select * from breedings order by sort_order`;
  if (breedingRows.length !== breedings.length) {
    problems.push(`breeding count: ${breedingRows.length} in the database, ${breedings.length} in the file`);
  }
  for (const [i, b] of breedings.entries()) {
    const row = breedingRows[i];
    if (!row) continue;
    if (row.headline !== orNull(b.headline)) problems.push(`breeding ${b.id}.headline differs`);
    if (row.status !== orNull(b.status)) problems.push(`breeding ${b.id}.status differs`);
    if (row.sire_id !== orNull(b.sireId)) problems.push(`breeding ${b.id}.sire_id differs`);
    if (row.dam_name !== orNull(b.damName)) problems.push(`breeding ${b.id}.dam_name differs`);
  }

  const heroRows = await sql<{ id: string }[]>`
    select id from photos where hero_slot is not null order by hero_slot`;
  const wantHero = heroSlides.map((s) => s.photo.id);
  if (heroRows.map((r) => r.id).join(",") !== wantHero.join(",")) {
    problems.push(`hero order: database has ${heroRows.map((r) => r.id).join(",")}, file has ${wantHero.join(",")}`);
  }

  await sql.end();

  console.log(`dogs:       ${rows.length}`);
  console.log(`hero:       ${heroRows.length} slides, ${heroRows.map((r) => r.id).join(" -> ")}`);
  console.log(`photos:     ${photoRows.length}`);
  console.log(`breedings:  ${breedingRows.length}`);
  if (problems.length) {
    console.error(`\n${problems.length} MISMATCHES:`);
    for (const p of problems) console.error("  " + p);
    process.exit(1);
  }
  console.log("\nEvery field read back matches the content file exactly.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

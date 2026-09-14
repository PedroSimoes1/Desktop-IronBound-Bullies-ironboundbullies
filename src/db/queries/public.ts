import "server-only";

import { asc, eq, inArray, isNotNull } from "drizzle-orm";
import { db } from "@/db/client";
import { breedings, dogs, photos } from "@/db/schema";
import type { Breeding } from "@/lib/domain/breeding";
import type { Dog, DogRole } from "@/lib/domain/dog";
import type { Photo } from "@/lib/domain/photo";
import { toDog, toPhoto, type DogRow, type PhotoRow } from "./shape";

/**
 * Everything the public website is allowed to know.
 *
 * This file is the boundary. Every query below names its columns explicitly,
 * and the list never includes a private one. It is not that these queries are
 * careful not to show private data: they never fetch it, so a mistake in a
 * page downstream has nothing to leak. The owner's notes, a customer's phone
 * number and an unpublished draft are not reachable from here at all; they
 * live in their own tables, and only `owner.ts` joins them.
 *
 * Nothing here reads a draft either. A draft is by definition not published,
 * so as far as the public site is concerned it does not exist.
 */

/** The columns a visitor may see. Written out so adding a private column to
 *  the table can never quietly add it to a public page. */
const publicDogColumns = {
  id: dogs.id,
  slug: dogs.slug,
  name: dogs.name,
  sex: dogs.sex,
  role: dogs.role,
  status: dogs.status,
  breed: dogs.breed,
  color: dogs.color,
  dogClass: dogs.dogClass,
  dateOfBirth: dogs.dateOfBirth,
  heightInches: dogs.heightInches,
  weightLbs: dogs.weightLbs,
  bloodline: dogs.bloodline,
  registration: dogs.registration,
  sireId: dogs.sireId,
  damId: dogs.damId,
  sireName: dogs.sireName,
  damName: dogs.damName,
  summary: dogs.summary,
  description: dogs.description,
  temperament: dogs.temperament,
  studFeeCents: dogs.studFeeCents,
  lockInFeeCents: dogs.lockInFeeCents,
  priceCents: dogs.priceCents,
  contactForPrice: dogs.contactForPrice,
  featured: dogs.featured,
} as const;

const publicPhotoColumns = {
  id: photos.id,
  dogId: photos.dogId,
  source: photos.source,
  src: photos.src,
  width: photos.width,
  height: photos.height,
  alt: photos.alt,
  focalX: photos.focalX,
  focalY: photos.focalY,
  focalPortraitX: photos.focalPortraitX,
  focalPortraitY: photos.focalPortraitY,
  blurDataUrl: photos.blurDataUrl,
  hasEmbeddedText: photos.hasEmbeddedText,
  caption: photos.caption,
  sortOrder: photos.sortOrder,
  isMain: photos.isMain,
} as const;

type PhotoWithDog = PhotoRow & { dogId: string | null };

/** Groups photograph rows by the dog they belong to. */
function byDog(rows: PhotoWithDog[]): Map<string, PhotoRow[]> {
  const map = new Map<string, PhotoRow[]>();
  for (const row of rows) {
    if (!row.dogId) continue;
    const list = map.get(row.dogId);
    if (list) list.push(row);
    else map.set(row.dogId, [row]);
  }
  return map;
}

/** Every dog, in the order the kennel wants them read. */
export async function getDogs(): Promise<Dog[]> {
  const rows = (await db.select(publicDogColumns).from(dogs).orderBy(asc(dogs.sortOrder))) as DogRow[];
  if (rows.length === 0) return [];

  const pictures = (await db
    .select(publicPhotoColumns)
    .from(photos)
    .where(
      inArray(
        photos.dogId,
        rows.map((r) => r.id),
      ),
    )
    .orderBy(asc(photos.sortOrder))) as PhotoWithDog[];

  const grouped = byDog(pictures);
  return rows.map((row) => toDog(row, grouped.get(row.id) ?? []));
}

export async function getDogBySlug(slug: string): Promise<Dog | undefined> {
  const [row] = (await db.select(publicDogColumns).from(dogs).where(eq(dogs.slug, slug)).limit(1)) as DogRow[];
  if (!row) return undefined;

  const pictures = (await db
    .select(publicPhotoColumns)
    .from(photos)
    .where(eq(photos.dogId, row.id))
    .orderBy(asc(photos.sortOrder))) as PhotoWithDog[];

  return toDog(row, pictures);
}

/** Slugs only, for generating the dog pages at build time. */
export async function getDogSlugs(): Promise<string[]> {
  const rows = await db.select({ slug: dogs.slug }).from(dogs).orderBy(asc(dogs.sortOrder));
  return rows.map((r) => r.slug);
}

/**
 * The derived lists the pages ask for.
 *
 * All of them filter the same twelve rows in memory rather than issuing a
 * query each. At this size that is one round trip instead of five, and the
 * filtering rules stay next to each other where they can be read together
 * instead of scattered across half a dozen WHERE clauses.
 */
export async function getDogsByRole(role: DogRole): Promise<Dog[]> {
  return (await getDogs()).filter((dog) => dog.role === role);
}

/** Featured dogs for the homepage, in display order: the first is the large frame. */
export async function getFeaturedDogs(): Promise<Dog[]> {
  return (await getDogs()).filter((dog) => dog.featured && dog.mainPhoto);
}

/** Dogs a visitor could actually ask to buy today. */
export async function getAvailableDogs(): Promise<Dog[]> {
  return (await getDogs()).filter(
    (dog) => dog.status === "available" || dog.status === "reserved" || dog.status === "upcoming",
  );
}

/** One photograph by id, for the few places a specific frame is chosen by hand. */
export async function getPhotoById(id: string): Promise<Photo | undefined> {
  const [row] = (await db.select(publicPhotoColumns).from(photos).where(eq(photos.id, id)).limit(1)) as PhotoWithDog[];
  return row ? toPhoto(row) : undefined;
}

/**
 * The same, for a page whose layout is built around one specific photograph.
 *
 * If that picture is ever removed the page cannot render meaningfully, so this
 * stops the build with a message naming the id rather than letting a broken
 * banner reach the site.
 */
export async function requirePhotoById(id: string): Promise<Photo> {
  const photo = await getPhotoById(id);
  if (!photo) {
    throw new Error(`The page needs photograph "${id}", but no row with that id is in the database.`);
  }
  return photo;
}

/** The curated homepage sequence, in the order the kennel set. */
export async function getHeroSlides(): Promise<{ slug: string; name: string; dog: Dog; photo: Photo }[]> {
  const rows = (await db
    .select(publicPhotoColumns)
    .from(photos)
    .where(isNotNull(photos.heroSlot))
    .orderBy(asc(photos.heroSlot))) as PhotoWithDog[];

  const all = await getDogs();
  return rows.flatMap((row) => {
    const dog = all.find((d) => d.id === row.dogId);
    return dog ? [{ slug: dog.slug, name: dog.name, dog, photo: toPhoto(row) }] : [];
  });
}

export async function getBreedings(): Promise<Breeding[]> {
  const rows = await db
    .select({
      id: breedings.id,
      slug: breedings.slug,
      sireId: breedings.sireId,
      damId: breedings.damId,
      sireName: breedings.sireName,
      damName: breedings.damName,
      status: breedings.status,
      headline: breedings.headline,
      breedingDate: breedings.breedingDate,
      dueDate: breedings.dueDate,
      litterDate: breedings.litterDate,
      notes: breedings.notes,
      featured: breedings.featured,
    })
    .from(breedings)
    .orderBy(asc(breedings.sortOrder));

  const opt = <T>(v: T | null): T | undefined => (v === null ? undefined : v);

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    sireId: opt(row.sireId),
    damId: opt(row.damId),
    sireName: opt(row.sireName),
    damName: opt(row.damName),
    status: opt(row.status),
    headline: opt(row.headline),
    breedingDate: opt(row.breedingDate),
    dueDate: opt(row.dueDate),
    litterDate: opt(row.litterDate),
    notes: opt(row.notes),
    featured: row.featured || undefined,
  }));
}

export async function getBreedingBySlug(slug: string): Promise<Breeding | undefined> {
  const all = await getBreedings();
  return all.find((b) => b.slug === slug);
}

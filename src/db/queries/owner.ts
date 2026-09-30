import "server-only";

import { and, asc, count, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { dogDrafts, dogNotes, dogs, inquiries, photos } from "@/db/schema";
import type { DogStatus } from "@/lib/domain/dog";
import { toPhoto, type PhotoRow } from "./shape";

/**
 * What the signed-in owner is allowed to see.
 *
 * Every function here takes a kennelId and filters on it. None of them takes
 * the kennel from a URL: the caller has already proved which kennel this
 * person belongs to, via src/lib/auth/guard.ts, and passes that. So there is
 * no id in a request that could be swapped for somebody else's.
 *
 * This is also the only file that reads drafts and private notes. The public
 * queries next door cannot see either.
 */

/** The fields an owner may change. Deliberately small: these are the ones that
 *  actually change week to week, and every one of them is public information. */
export interface EditableFields {
  status?: DogStatus | null;
  summary?: string | null;
  priceCents?: number | null;
  studFeeCents?: number | null;
  contactForPrice?: boolean;
}

export interface OwnerDogSummary {
  id: string;
  slug: string;
  name: string;
  role: "stud" | "female" | "production" | "puppy" | null;
  color: string | null;
  /** What the website is showing right now. */
  publishedStatus: DogStatus | null;
  photoCount: number;
  thumbnail?: ReturnType<typeof toPhoto>;
  hasDraft: boolean;
}

export async function listDogsForOwner(kennelId: string): Promise<OwnerDogSummary[]> {
  const rows = await db
    .select({
      id: dogs.id,
      slug: dogs.slug,
      name: dogs.name,
      role: dogs.role,
      color: dogs.color,
      publishedStatus: dogs.status,
      hasDraft: sql<boolean>`(${dogDrafts.dogId} is not null)`,
    })
    .from(dogs)
    .leftJoin(dogDrafts, eq(dogDrafts.dogId, dogs.id))
    .where(eq(dogs.kennelId, kennelId))
    .orderBy(asc(dogs.sortOrder));

  const pictures = await db
    .select(photoColumns)
    .from(photos)
    .where(eq(photos.kennelId, kennelId))
    .orderBy(asc(photos.sortOrder));

  const byDog = new Map<string, PhotoRow[]>();
  for (const p of pictures as (PhotoRow & { dogId: string | null })[]) {
    if (!p.dogId) continue;
    const list = byDog.get(p.dogId);
    if (list) list.push(p);
    else byDog.set(p.dogId, [p]);
  }

  return rows.map((row) => {
    const list = byDog.get(row.id) ?? [];
    const main = list.find((p) => p.isMain) ?? list[0];
    return { ...row, photoCount: list.length, thumbnail: main ? toPhoto(main) : undefined };
  });
}

const photoColumns = {
  id: photos.id,
  dogId: photos.dogId,
  source: photos.source,
  src: photos.src,
  storageKey: photos.storageKey,
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

export interface OwnerDogDetail {
  id: string;
  kennelId: string;
  slug: string;
  name: string;
  role: "stud" | "female" | "production" | "puppy" | null;
  color: string | null;
  breed: string | null;
  /** Exactly what the public site shows today. */
  published: EditableFields & { status: DogStatus | null };
  /** The unpublished edit, if there is one. */
  draft: EditableFields | null;
  /** published merged with draft: what Publish would make live. */
  effective: EditableFields & { status: DogStatus | null };
  photos: (ReturnType<typeof toPhoto> & { isMain: boolean; source: "repo" | "blob" })[];
  privateNotes: string;
}

export async function getDogForOwner(kennelId: string, dogId: string): Promise<OwnerDogDetail | undefined> {
  const [row] = await db
    .select({
      id: dogs.id,
      kennelId: dogs.kennelId,
      slug: dogs.slug,
      name: dogs.name,
      role: dogs.role,
      color: dogs.color,
      breed: dogs.breed,
      status: dogs.status,
      summary: dogs.summary,
      priceCents: dogs.priceCents,
      studFeeCents: dogs.studFeeCents,
      contactForPrice: dogs.contactForPrice,
      draft: dogDrafts.fields,
      notes: dogNotes.body,
    })
    .from(dogs)
    .leftJoin(dogDrafts, eq(dogDrafts.dogId, dogs.id))
    .leftJoin(dogNotes, eq(dogNotes.dogId, dogs.id))
    // Both conditions, always. Matching on id alone would hand somebody
    // another kennel's dog if they guessed an id.
    .where(and(eq(dogs.id, dogId), eq(dogs.kennelId, kennelId)))
    .limit(1);

  if (!row) return undefined;

  const pictureRows = (await db
    .select(photoColumns)
    .from(photos)
    .where(eq(photos.dogId, row.id))
    .orderBy(asc(photos.sortOrder))) as (PhotoRow & { dogId: string | null })[];

  const published: EditableFields & { status: DogStatus | null } = {
    status: row.status,
    summary: row.summary,
    priceCents: row.priceCents,
    studFeeCents: row.studFeeCents,
    contactForPrice: row.contactForPrice,
  };
  const draft = (row.draft as EditableFields | null) ?? null;

  return {
    id: row.id,
    kennelId: row.kennelId,
    slug: row.slug,
    name: row.name,
    role: row.role,
    color: row.color,
    breed: row.breed,
    published,
    draft,
    effective: { ...published, ...(draft ?? {}) },
    photos: pictureRows.map((p) => ({ ...toPhoto(p), isMain: p.isMain, source: p.source })),
    privateNotes: row.notes ?? "",
  };
}

/** The counts on the Today screen. Every one is a real record. */
export async function kennelOverview(kennelId: string) {
  const [[dogCount], [withPhotos], [atStud], [available], [pending], [newInquiries]] = await Promise.all([
    db.select({ n: count() }).from(dogs).where(eq(dogs.kennelId, kennelId)),
    db
      .select({ n: sql<number>`count(distinct ${photos.dogId})::int` })
      .from(photos)
      .where(and(eq(photos.kennelId, kennelId), isNotNull(photos.dogId))),
    db.select({ n: count() }).from(dogs).where(and(eq(dogs.kennelId, kennelId), eq(dogs.status, "stud_available"))),
    db.select({ n: count() }).from(dogs).where(and(eq(dogs.kennelId, kennelId), eq(dogs.status, "available"))),
    db
      .select({ n: count() })
      .from(dogDrafts)
      .innerJoin(dogs, eq(dogs.id, dogDrafts.dogId))
      .where(eq(dogs.kennelId, kennelId)),
    db.select({ n: count() }).from(inquiries).where(eq(inquiries.state, "new")),
  ]);

  return {
    dogs: dogCount?.n ?? 0,
    withPhotographs: withPhotos?.n ?? 0,
    standingAtStud: atStud?.n ?? 0,
    availableNow: available?.n ?? 0,
    unpublished: pending?.n ?? 0,
    newInquiries: newInquiries?.n ?? 0,
  };
}

/** Which dogs have an edit waiting, for the Today screen's list. */
export async function dogsWithUnpublishedChanges(kennelId: string) {
  return db
    .select({ id: dogs.id, name: dogs.name, updatedAt: dogDrafts.updatedAt })
    .from(dogDrafts)
    .innerJoin(dogs, eq(dogs.id, dogDrafts.dogId))
    .where(eq(dogs.kennelId, kennelId))
    .orderBy(asc(dogs.sortOrder));
}

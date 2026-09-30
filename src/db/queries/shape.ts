import "server-only";

import type { Dog, DogRole, DogStatus, Sex } from "@/lib/domain/dog";
import type { Photo } from "@/lib/domain/photo";
import { repoImages } from "@/lib/images/repo-photos";

/**
 * Turning database rows into the domain objects the site already speaks.
 *
 * The components, the cards, the hero and the focal-point cropping were all
 * written against `Dog` and `Photo`. Nothing about them changes because the
 * data now arrives from Postgres, and that is the point: milestone one is a
 * change of source, not a change of site.
 *
 * Two conversions matter and are easy to get silently wrong:
 *
 *   Postgres returns `numeric` as a string, to avoid losing precision on the
 *   way through JavaScript's floats. A focal point of "0.300" is not 0.3 to a
 *   CSS calculation, so every numeric is converted explicitly here rather
 *   than left to coerce itself somewhere further downstream.
 *
 *   A column that is NULL becomes `undefined`, not `null`. The domain marks
 *   unknown facts optional, and every component asks "is this missing" with
 *   that in mind. A stray null would render as an empty label, which is the
 *   one thing the project rules forbid.
 */

/** NULL means the business has not told us. Optional, never an empty string. */
const opt = <T>(v: T | null): T | undefined => (v === null ? undefined : v);

/** Postgres numeric arrives as a string; make it a number or nothing. */
const num = (v: string | number | null): number | undefined => {
  if (v === null) return undefined;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
};

export interface PhotoRow {
  id: string;
  source: "repo" | "blob";
  src: string;
  width: number;
  height: number;
  alt: string;
  focalX: string;
  focalY: string;
  focalPortraitX: string | null;
  focalPortraitY: string | null;
  blurDataUrl: string | null;
  hasEmbeddedText: boolean;
  caption: string | null;
  sortOrder: number;
  isMain: boolean;
}

export function toPhoto(row: PhotoRow): Photo {
  // A repository photograph resolves to the build's optimised version, which
  // carries the real src and the blur placeholder. An uploaded one is already
  // a URL and brings its placeholder with it in the row.
  const image = row.source === "repo" ? repoImages[row.src] : undefined;
  if (row.source === "repo" && !image) {
    throw new Error(
      `Photo "${row.id}" says its file is "${row.src}", but no such image is imported in repo-photos.ts. ` +
        `Either the file was removed from the repository or the row is stale.`,
    );
  }

  const portraitX = num(row.focalPortraitX);
  const portraitY = num(row.focalPortraitY);

  return {
    id: row.id,
    src: image?.src ?? row.src,
    width: image?.width ?? row.width,
    height: image?.height ?? row.height,
    alt: row.alt,
    focal: { x: num(row.focalX) ?? 0.5, y: num(row.focalY) ?? 0.5 },
    focalPortrait: portraitX !== undefined && portraitY !== undefined ? { x: portraitX, y: portraitY } : undefined,
    blurDataUrl: image?.blurDataURL ?? opt(row.blurDataUrl),
    hasEmbeddedText: row.hasEmbeddedText,
    caption: opt(row.caption),
    order: row.sortOrder,
  };
}

export interface DogRow {
  id: string;
  slug: string;
  name: string;
  sex: Sex | null;
  role: DogRole | null;
  status: DogStatus | null;
  breed: string | null;
  color: string | null;
  dogClass: string | null;
  dateOfBirth: string | null;
  heightInches: string | null;
  weightLbs: string | null;
  bloodline: string | null;
  registration: string | null;
  sireId: string | null;
  damId: string | null;
  sireName: string | null;
  damName: string | null;
  summary: string | null;
  description: string | null;
  temperament: string | null;
  studFeeCents: number | null;
  lockInFeeCents: number | null;
  priceCents: number | null;
  contactForPrice: boolean;
  featured: boolean;
}

export function toDog(row: DogRow, photos: PhotoRow[] = []): Dog {
  const ordered = [...photos].sort((a, b) => a.sortOrder - b.sortOrder);
  const gallery = ordered.map(toPhoto);
  const mainRow = ordered.find((p) => p.isMain) ?? ordered[0];

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    sex: opt(row.sex),
    role: opt(row.role),
    status: opt(row.status),
    breed: opt(row.breed),
    color: opt(row.color),
    dogClass: opt(row.dogClass),
    dateOfBirth: opt(row.dateOfBirth),
    heightInches: num(row.heightInches),
    weightLbs: num(row.weightLbs),
    bloodline: opt(row.bloodline),
    registration: opt(row.registration),
    sireId: opt(row.sireId),
    damId: opt(row.damId),
    sireName: opt(row.sireName),
    damName: opt(row.damName),
    summary: opt(row.summary),
    description: opt(row.description),
    temperament: opt(row.temperament),
    studFee: opt(row.studFeeCents),
    lockInFee: opt(row.lockInFeeCents),
    price: opt(row.priceCents),
    contactForPrice: row.contactForPrice || undefined,
    featured: row.featured || undefined,
    mainPhoto: mainRow ? toPhoto(mainRow) : undefined,
    gallery: gallery.length ? gallery : undefined,
  };
}

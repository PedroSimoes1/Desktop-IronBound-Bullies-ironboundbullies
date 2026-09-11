import type { Breeding } from "@/lib/domain/breeding";
import { dogs } from "./dogs";

/**
 * Breeding records for the public Version 1.
 *
 * Source: the current public profile (read 2026-09-09), which lists exactly two
 * breedings, each as a sire, a dam, and a bloodline headline in the owner's
 * own words. It states no dates and no status, so neither is stored here.
 * Nothing reproductive is ever assumed (Phase 0, VERIFY V2).
 */

export const breedings: Breeding[] = [
  {
    id: "voodoo-x-sriracha",
    slug: "voodoo-x-sriracha",
    sireId: "voodoo",
    damId: "sriracha",
    headline: "Gotty meets Big30",
    featured: true,
  },
  {
    // VERIFY V2: Gaia is named as the dam but is not listed among the females,
    // so she is carried as an outside dam until the owner says otherwise.
    id: "voodoo-x-gaia",
    slug: "voodoo-x-gaia",
    sireId: "voodoo",
    damName: "Gaia",
    headline: "Gotty meets Crazy Money",
    featured: true,
  },
];

export interface BreedingParents {
  sireName: string;
  damName: string;
  /** Profile links, present only for dogs that have a page here. */
  sireHref?: string;
  damHref?: string;
}

/** Resolves a breeding's parents to display names and, where they exist, profile links. */
export function parentsOf(breeding: Breeding): BreedingParents | undefined {
  const sire = breeding.sireId ? dogs.find((dog) => dog.slug === breeding.sireId) : undefined;
  const dam = breeding.damId ? dogs.find((dog) => dog.slug === breeding.damId) : undefined;
  const sireName = sire?.name ?? breeding.sireName;
  const damName = dam?.name ?? breeding.damName;
  if (!sireName || !damName) return undefined;
  return {
    sireName,
    damName,
    sireHref: sire ? `/dogs/${sire.slug}` : undefined,
    damHref: dam ? `/dogs/${dam.slug}` : undefined,
  };
}

export function getBreedingBySlug(slug: string): Breeding | undefined {
  return breedings.find((breeding) => breeding.slug === slug);
}

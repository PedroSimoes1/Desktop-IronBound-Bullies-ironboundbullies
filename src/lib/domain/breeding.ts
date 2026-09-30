/**
 * Breeding model (brief section 14).
 * Nothing reproductive is ever assumed: every date and status is entered by the owner.
 */

export type BreedingStatus =
  | "planned"
  | "confirmed"
  | "pregnancy_confirmed"
  | "litter_arrived"
  | "completed";

export const BREEDING_STATUS_LABELS: Record<BreedingStatus, string> = {
  planned: "Planned",
  confirmed: "Confirmed",
  pregnancy_confirmed: "Pregnancy confirmed",
  litter_arrived: "Litter arrived",
  completed: "Completed",
};

/** The order a breeding moves through — used by the admin status stepper. */
export const BREEDING_STATUS_ORDER: readonly BreedingStatus[] = [
  "planned",
  "confirmed",
  "pregnancy_confirmed",
  "litter_arrived",
  "completed",
];

export interface BreedingParents {
  sireName: string;
  damName: string;
  /** Profile links, present only for dogs that have a page here. */
  sireHref?: string;
  damHref?: string;
}

/**
 * Resolves a pairing's parents to display names and, where they exist, links.
 *
 * The kennel's own dogs are matched from the list passed in; an outside dog
 * the owner named but does not own has a name and no page, so it renders as
 * plain text. A pairing missing either name renders nothing at all rather
 * than half a pairing.
 */
export function parentsOf(
  breeding: Breeding,
  dogs: { id: string; slug: string; name: string }[],
): BreedingParents | undefined {
  const sire = breeding.sireId ? dogs.find((dog) => dog.id === breeding.sireId || dog.slug === breeding.sireId) : undefined;
  const dam = breeding.damId ? dogs.find((dog) => dog.id === breeding.damId || dog.slug === breeding.damId) : undefined;
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

export interface Breeding {
  id: string;
  /** URL segment: /breedings/voodoo-x-sriracha */
  slug: string;
  /** The kennel's own dog, when the parent has a profile here. */
  sireId?: string;
  damId?: string;
  /** Free-text parent name for an outside dog with no profile of ours. */
  sireName?: string;
  damName?: string;
  /** Absent until the owner states where the breeding stands. Never assumed. */
  status?: BreedingStatus;
  /** Optional bloodline headline in the owner's words, e.g. "Gotty meets Big30". */
  headline?: string;
  /** ISO dates. Only present when the owner knows them. */
  breedingDate?: string;
  dueDate?: string;
  litterDate?: string;
  notes?: string;
  featured?: boolean;
}

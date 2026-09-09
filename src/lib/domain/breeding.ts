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

export interface Breeding {
  id: string;
  /** URL segment: /breedings/voodoo-x-sriracha */
  slug: string;
  sireId: string;
  damId: string;
  status: BreedingStatus;
  /** Optional bloodline headline in the owner's words, e.g. "Gotty meets Big30". */
  headline?: string;
  /** ISO dates. Only present when the owner knows them. */
  breedingDate?: string;
  dueDate?: string;
  litterDate?: string;
  notes?: string;
  featured?: boolean;
}

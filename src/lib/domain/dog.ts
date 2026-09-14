import type { Photo } from "./photo";

/**
 * Core domain model for a dog.
 *
 * This is the shape the whole site is built around — cards, profiles, the
 * hero, the admin forms, and (later) the database rows all map to it.
 * Fields are optional wherever the business may not have the information:
 * the UI never renders an empty label, and nothing here is ever invented.
 */

export type Sex = "male" | "female";

/**
 * Public-facing status. Mirrors the brief (section 12).
 * The wording shown to visitors lives in DOG_STATUS_LABELS, not in components.
 */
export type DogStatus =
  | "available"
  | "reserved"
  | "sold"
  | "not_for_sale"
  | "stud_available"
  | "retired"
  | "upcoming";

export const DOG_STATUS_LABELS: Record<DogStatus, string> = {
  available: "Available",
  reserved: "Reserved",
  sold: "Sold",
  not_for_sale: "Not for sale",
  stud_available: "Stud available",
  retired: "Retired",
  upcoming: "Upcoming",
};

/** Statuses that represent a live opportunity for a visitor. Drawn with the accent marker. */
export const ACTIVE_DOG_STATUSES: ReadonlySet<DogStatus> = new Set(["available", "stud_available", "upcoming"]);

/** How a dog relates to the kennel. Drives which collection pages it appears on. */
export type DogRole =
  | "stud" // owned male offered for stud
  | "female" // owned female in the program
  | "production" // produced by the kennel, may now live elsewhere
  | "puppy"; // current or recent litter member

/** Money is stored in whole US cents to avoid floating-point mistakes. */
export type Cents = number;

export interface Dog {
  id: string;
  /** URL segment: /dogs/voodoo */
  slug: string;
  name: string;
  /** Unknown until the owner confirms it (e.g. a dog that appears only in photographs). */
  sex?: Sex;
  /** Unknown until confirmed; a dog without a role appears only under "All dogs". */
  role?: DogRole;
  status?: DogStatus;

  /** e.g. "Exotic Bully" — wording confirmed by the owner, never assumed. */
  breed?: string;
  /** e.g. "Chocolate Tri" */
  color?: string;
  /** e.g. "Micro", "Pocket" — only if the owner uses class language. */
  dogClass?: string;
  dateOfBirth?: string; // ISO date, YYYY-MM-DD
  heightInches?: number;
  weightLbs?: number;
  bloodline?: string;
  registration?: string;

  sireId?: string;
  damId?: string;
  /** Free-text parent names for dogs whose parents are not in our database. */
  sireName?: string;
  damName?: string;

  /** One or two sentences in the owner's voice. */
  summary?: string;
  description?: string;
  temperament?: string;

  /** Stud terms — only meaningful when role === "stud". */
  studFee?: Cents;
  lockInFee?: Cents;

  /** Sale terms — price OR contact-for-price, never both. */
  price?: Cents;
  contactForPrice?: boolean;

  featured?: boolean;

  mainPhoto?: Photo;
  gallery?: Photo[];
}

/** Formats cents as "$2,000" (no cents shown when they are zero). */
export function formatMoney(cents: Cents): string {
  const dollars = cents / 100;
  const hasCents = cents % 100 !== 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(dollars);
}

/**
 * Splits a list into the dogs we hold photographs of and the rest.
 *
 * The two halves are presented differently: photographs become picture cards,
 * and the rest become a typographic roster. A grid of empty "photo coming"
 * frames would say the site is unfinished, which is the opposite of the truth.
 */
export function splitByPhoto(list: Dog[]): { photographed: Dog[]; listed: Dog[] } {
  return {
    photographed: list.filter((dog) => dog.mainPhoto),
    listed: list.filter((dog) => !dog.mainPhoto),
  };
}

/** "Male" / "Female" for display. */
export function formatSex(sex: Sex): string {
  return sex === "male" ? "Male" : "Female";
}

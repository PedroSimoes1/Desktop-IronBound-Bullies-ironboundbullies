import type { Dog } from "./dog";
import { formatSex } from "./dog";

/**
 * Small, shared formatting helpers so every page describes a dog the same way.
 * Rule of the system: at most one middle dot per line.
 */

const ROLE_LABEL: Record<NonNullable<Dog["role"]>, string> = {
  stud: "Stud",
  female: "Female",
  production: "Production",
  puppy: "Puppy",
};

/** "Exotic Bully · Chocolate Tri", or whichever half is known, or undefined. */
export function dogDescriptor(dog: Pick<Dog, "breed" | "color">): string | undefined {
  const parts = [dog.breed, dog.color].filter(Boolean);
  return parts.length ? parts.join(" · ") : undefined;
}

/** "Stud · Blue Tri" for cards: the role (or sex) and the color. */
export function dogMeta(dog: Pick<Dog, "role" | "sex" | "color">): string | undefined {
  const kind = dog.role ? ROLE_LABEL[dog.role] : dog.sex ? formatSex(dog.sex) : undefined;
  const parts = [kind, dog.color].filter(Boolean);
  return parts.length ? parts.join(" · ") : undefined;
}

/** Statuses worth showing on a collection card: live opportunities and changes of state. */
export function isCardStatus(status: Dog["status"]): status is NonNullable<Dog["status"]> {
  return status === "available" || status === "stud_available" || status === "upcoming" || status === "reserved" || status === "sold";
}

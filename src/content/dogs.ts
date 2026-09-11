import type { Dog, DogRole } from "@/lib/domain/dog";
import { photos } from "./photos";

/**
 * Dog records for the public Version 1.
 *
 * Source of every fact: the current public profile at
 * kenneldatabase.vercel.app/ironboundbullies (read 2026-09-09). Everything is
 * pending the owner's confirmation (Phase 0 audit items V1 to V8). Fields the
 * profile does not state are left out, never guessed. When the owner
 * dashboard exists, this file is replaced by the database.
 */

const EXOTIC_BULLY = "Exotic Bully";

/** VERIFY V7: identical stud terms are listed for all three studs. */
const STUD_TERMS = { studFee: 200_000, lockInFee: 50_000 } as const;

export const dogs: Dog[] = [
  {
    id: "voodoo",
    slug: "voodoo",
    name: "Voodoo",
    sex: "male",
    role: "stud",
    status: "stud_available",
    breed: EXOTIC_BULLY,
    color: "Chocolate Tri",
    summary: "Nano-sized Gotty clone. Compact, clean, and balanced.",
    featured: true,
    mainPhoto: photos.voodoo02,
    gallery: [photos.voodoo02, photos.voodoo01],
    ...STUD_TERMS,
  },
  {
    id: "knuckles",
    slug: "knuckles",
    name: "Knuckles",
    sex: "male",
    role: "stud",
    status: "stud_available",
    breed: EXOTIC_BULLY,
    color: "Blue Tri",
    summary: "A compact 8.5-inch frame with significant mass.",
    // VERIFY V3: the profile names Knuckles' parents as Krypto and Minnie.
    sireName: "Krypto",
    damName: "Minnie",
    featured: true,
    mainPhoto: photos.knuckles02,
    gallery: [photos.knuckles02, photos.knuckles01],
    ...STUD_TERMS,
  },
  {
    id: "shadow",
    slug: "shadow",
    name: "Shadow",
    sex: "male",
    role: "stud",
    status: "stud_available",
    breed: EXOTIC_BULLY,
    color: "Blue Tri",
    summary: "Bred for producing miniature bulls with structure and substance.",
    featured: true,
    mainPhoto: photos.shadow01,
    gallery: [photos.shadow01, photos.shadow02],
    ...STUD_TERMS,
  },
  { id: "amy", slug: "amy", name: "Amy", sex: "female", role: "female", breed: EXOTIC_BULLY, color: "Blue Tri" },
  { id: "sriracha", slug: "sriracha", name: "Sriracha", sex: "female", role: "female", breed: EXOTIC_BULLY, color: "Chocolate" },
  {
    id: "minnie",
    slug: "minnie",
    name: "Minnie",
    sex: "female",
    role: "female",
    breed: EXOTIC_BULLY,
    color: "Blue Tri",
    mainPhoto: photos.minnie01,
    gallery: [photos.minnie01, photos.minnie02],
  },
  { id: "cinnabon", slug: "cinnabon", name: "Cinnabon", sex: "female", role: "female", breed: EXOTIC_BULLY, color: "Chocolate Fawn" },
  { id: "brownie", slug: "brownie", name: "Brownie", sex: "female", role: "female", breed: EXOTIC_BULLY, color: "Chocolate" },
  { id: "diva", slug: "diva", name: "Diva", sex: "female", role: "female", breed: EXOTIC_BULLY, color: "Chocolate" },
  { id: "nutella", slug: "nutella", name: "Nutella", sex: "female", role: "female", breed: EXOTIC_BULLY, color: "Chocolate Tri" },
  { id: "rosie", slug: "rosie", name: "Rosie", sex: "female", role: "female", breed: EXOTIC_BULLY, color: "Lilac" },
  {
    // VERIFY V1: Missy appears in the photographs but not on the current profile.
    // Sex, role, breed, and color are unknown until the owner confirms them.
    id: "missy",
    slug: "missy",
    name: "Missy",
    mainPhoto: photos.missy02,
    gallery: [photos.missy02, photos.missy01],
  },
];

export function getDogBySlug(slug: string): Dog | undefined {
  return dogs.find((dog) => dog.slug === slug);
}

export function dogsByRole(role: DogRole): Dog[] {
  return dogs.filter((dog) => dog.role === role);
}

/** Featured dogs for the homepage, in display order: the first is the large frame. */
export function featuredDogs(): Dog[] {
  return dogs.filter((dog) => dog.featured && dog.mainPhoto);
}

/**
 * Splits a list into the dogs we hold photographs of and the rest.
 *
 * The two halves are presented differently: photographs become picture cards,
 * and the rest become a typographic roster. A grid of empty "photo coming"
 * frames would say the site is unfinished, which is the opposite of the truth.
 */
export function splitByPhoto(list: Dog[] = dogs): { photographed: Dog[]; listed: Dog[] } {
  return {
    photographed: list.filter((dog) => dog.mainPhoto),
    listed: list.filter((dog) => !dog.mainPhoto),
  };
}

/** Dogs currently offered for sale. None are verified yet, so the list is empty (V5). */
export function availableDogs(): Dog[] {
  return dogs.filter((dog) => dog.status === "available" || dog.status === "reserved" || dog.status === "upcoming");
}

/**
 * Hero sequence (docs/image-inventory.md): alternating side and front stances,
 * using frames that do not repeat in the Featured section.
 */
export const heroSlides = [
  { slug: "voodoo", photo: photos.voodoo01 },
  { slug: "knuckles", photo: photos.knuckles02 },
  { slug: "shadow", photo: photos.shadow02 },
  { slug: "minnie", photo: photos.minnie01 },
  { slug: "missy", photo: photos.missy02 },
] as const;

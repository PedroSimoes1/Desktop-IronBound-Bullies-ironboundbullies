import { breedings, parentsOf } from "@/content/breedings";
import { dogs } from "@/content/dogs";
import type { Cents, DogRole, DogStatus } from "@/lib/domain/dog";
import type { Photo } from "@/lib/domain/photo";

/**
 * Demo state for the owner prototype.
 *
 * NOTHING HERE IS SAVED. Every record below is built in the browser from the
 * site's own content files and lives in React state for the length of the
 * visit. Reloading the page throws it all away. There is no database, no
 * server call and no way for anything typed in the prototype to reach the
 * public website: that is the whole point of reviewing the design before the
 * backend exists.
 *
 * The dogs, their photographs and their published details are the real ones,
 * so the screens are worth judging. Private notes and inquiries are marked as
 * examples wherever they appear, because the kennel has neither yet.
 */

/** The fields an owner can change and publish. Kept apart from the rest of the
 *  dog record so "what the website shows" and "what I have edited" never blur. */
export interface DogFields {
  status?: DogStatus;
  summary?: string;
  price?: Cents;
  contactForPrice?: boolean;
  studFee?: Cents;
  lockInFee?: Cents;
}

export interface OwnerDog {
  id: string;
  slug: string;
  name: string;
  role?: DogRole;
  breed?: string;
  color?: string;
  photo?: Photo;
  photoCount: number;
  /** Exactly what the public website is showing right now. */
  published: DogFields;
  /** Edits not yet published. Null when the dog is up to date. */
  draft: DogFields | null;
  /** Owner's own note. Never appears on the public website. */
  privateNotes: string;
}

export interface OwnerLitter {
  id: string;
  sireName: string;
  damName: string;
  headline?: string;
  /** No litter has been recorded against either pairing yet. */
  puppyCount: number;
}

export interface OwnerInquiry {
  id: string;
  receivedAt: string;
  name: string;
  email: string;
  phone?: string;
  about: string;
  message: string;
  state: InquiryState;
  privateNotes: string;
}

export type InquiryState = "new" | "replied" | "closed";

export const INQUIRY_STATE_LABELS: Record<InquiryState, string> = {
  new: "New",
  replied: "Replied",
  closed: "Closed",
};

/** The statuses the owner picks from, in the order they matter to the business. */
export const AVAILABILITY_CHOICES: { value: DogStatus; label: string; help: string }[] = [
  { value: "available", label: "Available", help: "Shown on the Available dogs page." },
  { value: "reserved", label: "Reserved", help: "Listed, marked as taken." },
  { value: "sold", label: "Sold", help: "Listed, marked as sold." },
  { value: "upcoming", label: "Upcoming", help: "Coming soon, not yet ready." },
  { value: "stud_available", label: "Stud available", help: "Standing at stud." },
  { value: "not_for_sale", label: "Not for sale", help: "Part of the program, not offered." },
  { value: "retired", label: "Retired", help: "No longer breeding." },
];

export function seedDogs(): OwnerDog[] {
  return dogs.map((dog) => ({
    id: dog.id,
    slug: dog.slug,
    name: dog.name,
    role: dog.role,
    breed: dog.breed,
    color: dog.color,
    photo: dog.mainPhoto,
    photoCount: dog.gallery?.length ?? (dog.mainPhoto ? 1 : 0),
    published: {
      status: dog.status,
      summary: dog.summary,
      price: dog.price,
      contactForPrice: dog.contactForPrice,
      studFee: dog.studFee,
      lockInFee: dog.lockInFee,
    },
    draft: null,
    privateNotes: "",
  }));
}

export function seedLitters(): OwnerLitter[] {
  return breedings.flatMap((breeding) => {
    const parents = parentsOf(breeding);
    if (!parents) return [];
    return [
      {
        id: breeding.id,
        sireName: parents.sireName,
        damName: parents.damName,
        headline: breeding.headline,
        puppyCount: 0,
      },
    ];
  });
}

/**
 * Example inquiries. The website does not collect any yet, so these exist only
 * so the screen can be judged. Every screen that shows them says so.
 */
export function seedInquiries(): OwnerInquiry[] {
  return [
    {
      id: "example-1",
      receivedAt: "2026-09-09T14:12:00Z",
      name: "Example: Marisol Rivera",
      email: "example@sample.invalid",
      phone: "555 0100",
      about: "Voodoo",
      message: "Asking about stud service and whether the fee covers a repeat if the first attempt does not take.",
      state: "new",
      privateNotes: "",
    },
    {
      id: "example-2",
      receivedAt: "2026-09-07T09:40:00Z",
      name: "Example: Dwayne Okafor",
      email: "example2@sample.invalid",
      about: "Upcoming litter",
      message: "Wants a blue tri male from the next litter and asked to be told first when one is available.",
      state: "replied",
      privateNotes: "",
    },
  ];
}

/** True when the draft differs from what is published. */
export function hasChanges(dog: OwnerDog): boolean {
  if (!dog.draft) return false;
  const keys = Object.keys({ ...dog.published, ...dog.draft }) as (keyof DogFields)[];
  return keys.some((key) => dog.draft?.[key] !== dog.published[key]);
}

/** What the public website would show for this dog if everything were published. */
export function effectiveFields(dog: OwnerDog): DogFields {
  return { ...dog.published, ...(dog.draft ?? {}) };
}

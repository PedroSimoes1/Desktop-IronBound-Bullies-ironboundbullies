/**
 * Inquiry model (brief section 17).
 * The public form and the admin inbox both use these types.
 */

export type InquiryType =
  | "puppy"
  | "adult_dog"
  | "stud_service"
  | "upcoming_litter"
  | "existing_breeding"
  | "general";

export const INQUIRY_TYPE_LABELS: Record<InquiryType, string> = {
  puppy: "Puppy",
  adult_dog: "Adult dog",
  stud_service: "Stud service",
  upcoming_litter: "Upcoming litter",
  existing_breeding: "Existing breeding",
  general: "General question",
};

export type ContactMethod = "email" | "phone" | "text";

export const CONTACT_METHOD_LABELS: Record<ContactMethod, string> = {
  email: "Email",
  phone: "Phone call",
  text: "Text message",
};

export interface Inquiry {
  id: string;
  createdAt: string; // ISO timestamp
  type: InquiryType;
  name: string;
  email: string;
  phone?: string;
  preferredContact: ContactMethod;
  /** Pre-filled when the visitor started from a dog or breeding page. */
  dogId?: string;
  breedingId?: string;
  message: string;
  /** Owner-side bookkeeping. */
  handled?: boolean;
}

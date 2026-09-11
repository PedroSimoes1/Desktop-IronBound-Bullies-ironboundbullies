/**
 * Site-wide constants. Business facts here were read from the current public
 * profile (kenneldatabase.vercel.app/ironboundbullies) and are marked VERIFY
 * in the Phase 0 audit until the owner confirms them.
 */

export const site = {
  name: "Ironbound Bullies",
  /** The typographic wordmark is split so the two words can carry different weights. */
  wordmark: { primary: "Ironbound", secondary: "Bullies" },
  /** VERIFY (V8/V9): breed wording and public region as the owner wants them stated. */
  tagline: "Exotic Bullies · Northern New Jersey",
  region: "Northern New Jersey",
  /** The kennel's own sentence, migrated verbatim from the current profile. */
  description:
    "Ironbound Bullies is a small kennel in Northern New Jersey focused on producing quality Exotic Bullies.",
  /** Production URL. Overridden by NEXT_PUBLIC_SITE_URL so previews generate correct absolute links. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://ironboundbullies.com",
  locale: "en_US",
} as const;

/**
 * Contact channels, migrated from the business's own public profile.
 *
 * VERIFY V10 — confirm every value below before launch, and decide whether the
 * aol address should be replaced by a domain address (see Phase 0, Part 7).
 * VERIFY V11 — the only Facebook link on the current profile is a personal
 * profile, so it is deliberately not listed here until a business page exists.
 */
export const contact = {
  phone: { display: "973 573 5884", href: "tel:+19735735884" },
  email: { display: "ironboundbullies@aol.com", href: "mailto:ironboundbullies@aol.com" },
  instagram: { display: "@ironboundbullies", href: "https://www.instagram.com/ironboundbullies/" },
} as const;

/** True only for the live production deployment (not local, not previews). */
export const isProduction = process.env.VERCEL_ENV === "production";

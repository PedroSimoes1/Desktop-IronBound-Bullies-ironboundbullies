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
  description:
    "Ironbound Bullies is a small kennel in Northern New Jersey focused on producing quality Exotic Bullies.",
  /** Production URL. Overridden by NEXT_PUBLIC_SITE_URL so previews generate correct absolute links. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://ironboundbullies.com",
  locale: "en_US",
} as const;

/** True only for the live production deployment (not local, not previews). */
export const isProduction = process.env.VERCEL_ENV === "production";

import type { Dog } from "@/lib/domain/dog";

/**
 * Specimen dogs for the design-system page.
 *
 * Names, breed, colors, and stud terms were read from the current public
 * profile (kenneldatabase.vercel.app/ironboundbullies). They are audit
 * items V4/V7 and must be confirmed by the owner before launch. Nothing
 * beyond what that page states is filled in — unknown fields stay empty.
 */
export const specimenDogs: Dog[] = [
  {
    id: "voodoo",
    slug: "voodoo",
    name: "Voodoo",
    sex: "male",
    role: "stud",
    status: "stud_available",
    breed: "Exotic Bully",
    color: "Chocolate Tri",
    studFee: 200_000,
    lockInFee: 50_000,
    summary: "Nano-sized Gotty clone. Compact, clean, and balanced.",
  },
  {
    id: "knuckles",
    slug: "knuckles",
    name: "Knuckles",
    sex: "male",
    role: "stud",
    status: "stud_available",
    breed: "Exotic Bully",
    color: "Blue Tri",
    studFee: 200_000,
    lockInFee: 50_000,
  },
  {
    id: "shadow",
    slug: "shadow",
    name: "Shadow",
    sex: "male",
    role: "stud",
    status: "stud_available",
    breed: "Exotic Bully",
    color: "Blue Tri",
    studFee: 200_000,
    lockInFee: 50_000,
  },
  {
    id: "minnie",
    slug: "minnie",
    name: "Minnie",
    sex: "female",
    role: "female",
    breed: "Exotic Bully",
    color: "Blue Tri",
  },
];

/** The palette as documented in tokens.css — kept here so the page can compute contrast. */
export const paletteSpecimens = [
  { token: "--color-bg", hex: "#080808", role: "Page ground", usedAsText: false },
  { token: "--color-surface", hex: "#131416", role: "Footer, menus, admin cards", usedAsText: false },
  { token: "--color-surface-raised", hex: "#1c1e21", role: "Inputs, pressed surfaces", usedAsText: false },
  { token: "--color-fg", hex: "#f4f3f0", role: "Primary text", usedAsText: true },
  { token: "--color-fg-muted", hex: "#a6a9ad", role: "Secondary text", usedAsText: true },
  { token: "--color-fg-subtle", hex: "#80848d", role: "Captions, disabled", usedAsText: true },
  { token: "--color-accent", hex: "#c2612a", role: "Markers, hairlines, active state", usedAsText: false },
  { token: "--color-accent-fg", hex: "#e07a3c", role: "Accent as text", usedAsText: true },
  { token: "--color-danger", hex: "#d64545", role: "Admin only, destructive", usedAsText: true },
] as const;

export const spacingSteps = [
  ["--space-1", "4"],
  ["--space-2", "8"],
  ["--space-3", "12"],
  ["--space-4", "16"],
  ["--space-5", "24"],
  ["--space-6", "32"],
  ["--space-7", "48"],
  ["--space-8", "64"],
  ["--space-9", "96"],
  ["--space-10", "128"],
  ["--space-11", "160"],
] as const;

export const typeScale = [
  ["--text-xs", "12"],
  ["--text-sm", "14"],
  ["--text-base", "16"],
  ["--text-lg", "18"],
  ["--text-xl", "22"],
  ["--text-2xl", "28"],
  ["--text-3xl", "36"],
  ["--text-4xl", "48"],
  ["--text-5xl", "64"],
  ["--text-hero", "72 to 160 (fluid)"],
] as const;

export const motionSpecimens = [
  ["--duration-fast", "150 ms", "Hover, focus"],
  ["--duration-base", "250 ms", "Reveals, filters, menu"],
  ["--duration-slow", "600 ms", "Gallery open / close, card image scale"],
  ["--duration-hero-transition", "1600 ms", "Hero cross-dissolve"],
  ["--duration-hero-dwell", "7600 ms", "One dog to the next"],
  ["--duration-hero-settle", "7600 ms", "Arriving photograph easing to its true size"],
  ["--ease-out", "cubic-bezier(0.22, 1, 0.36, 1)", "Every UI transition"],
  ["--ease-hero", "cubic-bezier(0.4, 0, 0.2, 1)", "Carousel only"],
] as const;

export const layoutSpecimens = [
  ["--container-text", "72ch", "Prose"],
  ["--container", "1280 px", "Standard content"],
  ["--container-wide", "1600 px", "Card grids, gallery"],
  ["--gutter", "16 to 40 px (fluid)", "Page edge + grid gap"],
  ["--section-y", "64 to 160 px (fluid)", "Section padding, top and bottom"],
  ["breakpoints", "640, 768, 1024, 1280, 1600, 2200", "sm, md, lg, xl, 2xl, ultra"],
] as const;

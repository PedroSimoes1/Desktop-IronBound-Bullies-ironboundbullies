/**
 * Primary navigation. Kept to six items maximum (Phase 0, Part 4).
 * During development only the routes that exist are listed; the full set is
 * documented here so it can be enabled route by route as pages are built.
 *
 *   { label: "Our Dogs",    href: "/dogs" }
 *   { label: "Available",   href: "/available" }
 *   { label: "Breedings",   href: "/breedings" }
 *   { label: "Productions", href: "/productions" }
 *   { label: "About",       href: "/about" }
 *   { label: "Contact",     href: "/contact" }
 */

export interface NavItem {
  label: string;
  href: string;
}

export const primaryNavigation: readonly NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Design system", href: "/design-system" },
];

/** The single persistent call-to-action in the header (brief section 45). */
export const headerCta: NavItem = { label: "Design system", href: "/design-system" };

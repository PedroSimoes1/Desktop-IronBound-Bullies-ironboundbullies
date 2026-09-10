/**
 * Primary navigation. Kept to six items maximum (Phase 0, Part 4).
 * Only routes that exist are listed. Canonical CTA labels (one label per
 * intent, reused everywhere): Our dogs · Available dogs · Inquire · Stud
 * service · View profile.
 *
 * Still to come as pages are built:
 *   { label: "Breedings",   href: "/breedings" }
 *   { label: "Productions", href: "/productions" }
 *   { label: "About",       href: "/about" }
 */

export interface NavItem {
  label: string;
  href: string;
}

export const primaryNavigation: readonly NavItem[] = [
  { label: "Our dogs", href: "/dogs" },
  { label: "Available dogs", href: "/available" },
];

/** The single persistent call-to-action in the header (brief section 45). */
export const headerCta: NavItem = { label: "Inquire", href: "/contact" };

/** True when `pathname` is the item's route or a page beneath it. */
export function isCurrent(pathname: string, item: NavItem): boolean {
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/**
 * Primary navigation. Four destinations and one call to action, so the bar
 * stays on a single line at every desktop width (Taste Skill 4.7).
 *
 * Canonical CTA labels, one per intent, reused everywhere on the site:
 *   Our dogs · Available dogs · Inquire · Stud service · View profile
 *
 * Productions is deliberately absent: the current profile shows 22 production
 * photographs with no names, so there is nothing honest to put on that page
 * yet (Phase 0, VERIFY V6). It joins the menu when the owner supplies them.
 */

export interface NavItem {
  label: string;
  href: string;
}

export const primaryNavigation: readonly NavItem[] = [
  { label: "Our dogs", href: "/dogs" },
  { label: "Breedings", href: "/breedings" },
  { label: "Available dogs", href: "/available" },
  { label: "About", href: "/about" },
];

/** The single persistent call-to-action in the header (brief section 45). */
export const headerCta: NavItem = { label: "Inquire", href: "/contact" };

/** True when `pathname` is the item's route or a page beneath it. */
export function isCurrent(pathname: string, item: NavItem): boolean {
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

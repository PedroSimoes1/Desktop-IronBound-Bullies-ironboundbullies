"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";
import { Wordmark } from "@/components/ui/Wordmark";
import { headerCta, primaryNavigation } from "@/lib/navigation";
import styles from "./SiteHeader.module.css";

/**
 * Site header (brief sections 44–45).
 *
 * Desktop: wordmark left, links right, one CTA. Transparent over a hero;
 * becomes a compact charcoal bar with a hairline once the page scrolls.
 * Mobile: wordmark + menu button; the menu is a full-screen list with
 * large tap targets. Escape closes it, focus returns to the button, and the
 * page behind it does not scroll.
 */

interface SiteHeaderProps {
  /** Start transparent (the page has a full-bleed hero under the header). */
  overlay?: boolean;
}

const SCROLL_THRESHOLD = 24;

function subscribeToScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

/** True once the page has scrolled past the threshold. Server-rendered as false. */
function useScrolled(): boolean {
  return useSyncExternalStore(
    subscribeToScroll,
    () => window.scrollY > SCROLL_THRESHOLD,
    () => false,
  );
}

export function SiteHeader({ overlay = false }: SiteHeaderProps) {
  const pathname = usePathname();
  const scrolled = useScrolled();
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // The menu remembers which page it was opened on, so navigating closes it
  // without an effect: a new pathname simply no longer matches.
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const menuOpen = openedAt === pathname;
  const closeMenu = () => setOpenedAt(null);
  const toggleMenu = () => setOpenedAt(menuOpen ? null : pathname);

  // Lock page scroll and handle Escape while the menu is open.
  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const headerClass = [
    styles.header,
    overlay ? styles.overlay : "",
    scrolled || menuOpen ? styles.solid : "",
    menuOpen ? styles.menuOpen : "",
    scrolled ? styles.compact : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={headerClass}>
      <div className={styles.bar}>
        <Wordmark size="header" className={styles.wordmark} />

        <nav className={styles.desktopNav} aria-label="Primary">
          <ul role="list" className={styles.navList}>
            {primaryNavigation.map((item) => {
              const current = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link href={item.href} className={styles.navLink} aria-current={current ? "page" : undefined}>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className={styles.actions}>
          <Button href={headerCta.href} variant="secondary" size="compact" className={styles.cta}>
            {headerCta.label}
          </Button>
          <button
            ref={menuButtonRef}
            type="button"
            className={styles.menuButton}
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            onClick={toggleMenu}
          >
            <span className={styles.menuIcon} aria-hidden="true" />
            <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
          </button>
        </div>
      </div>

      <div id="site-menu" className={styles.menu} hidden={!menuOpen} role="dialog" aria-modal="true" aria-label="Menu">
        <nav aria-label="Primary (mobile)">
          <ul role="list" className={styles.menuList}>
            {primaryNavigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={["display-1", styles.menuLink].join(" ")}
                  aria-current={pathname === item.href ? "page" : undefined}
                  onClick={closeMenu}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}

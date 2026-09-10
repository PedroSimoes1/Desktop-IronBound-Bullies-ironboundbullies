"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Wordmark } from "@/components/ui/Wordmark";
import { headerCta, isCurrent, primaryNavigation } from "@/lib/navigation";
import styles from "./SiteHeader.module.css";

/**
 * Site header (brief sections 44 and 45).
 *
 * Desktop: wordmark left, links right, one CTA. Compacts into a blurred bar
 * once the page scrolls (detected with an IntersectionObserver sentinel, no
 * scroll listener).
 *
 * Mobile: the menu is a native <dialog> opened with showModal(), which gives
 * focus trapping, Escape-to-close, an inert page behind it, and focus
 * returning to the button that opened it, all from the browser. The dialog
 * draws its own top bar so the wordmark and the close control stay exactly
 * where the header's are.
 */

const SCROLL_THRESHOLD_PX = 24;

function useScrolled(sentinelRef: React.RefObject<HTMLDivElement | null>): boolean {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting), {
      rootMargin: `-${SCROLL_THRESHOLD_PX}px 0px 0px 0px`,
      threshold: 0,
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sentinelRef]);
  return scrolled;
}

export function SiteHeader() {
  const pathname = usePathname();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const scrolled = useScrolled(sentinelRef);

  // The menu remembers which page it was opened on: navigating closes it without an effect.
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const menuOpen = openedAt === pathname;
  const openMenu = () => setOpenedAt(pathname);
  const closeMenu = () => setOpenedAt(null);

  // Keep the native dialog in step with React state, and lock page scroll while it is open.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (menuOpen && !dialog.open) {
      dialog.showModal();
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previousOverflow;
        if (dialog.open) dialog.close();
      };
    }
  }, [menuOpen]);

  const headerClass = [styles.header, scrolled ? styles.solid : "", scrolled ? styles.compact : ""].filter(Boolean).join(" ");

  return (
    <>
      <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />
      <header className={headerClass}>
        <div className={styles.bar}>
          <Wordmark size="header" className={styles.wordmark} />

          <nav className={styles.desktopNav} aria-label="Primary">
            <ul role="list" className={styles.navList}>
              {primaryNavigation.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={styles.navLink} aria-current={isCurrent(pathname, item) ? "page" : undefined}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className={styles.actions}>
            <Button href={headerCta.href} variant="secondary" size="compact" className={styles.cta}>
              {headerCta.label}
            </Button>
            <button type="button" className={styles.menuButton} aria-expanded={menuOpen} aria-haspopup="dialog" onClick={openMenu}>
              <span className={styles.menuIcon} aria-hidden="true" />
              <span className="sr-only">Open menu</span>
            </button>
          </div>
        </div>
      </header>

      <dialog
        ref={dialogRef}
        className={styles.menu}
        aria-label="Menu"
        onClose={closeMenu}
        onCancel={(event) => {
          event.preventDefault();
          closeMenu();
        }}
      >
        <div className={styles.bar}>
          <Wordmark size="header" className={styles.wordmark} />
          <button type="button" className={styles.menuButton} onClick={closeMenu}>
            <span className={[styles.menuIcon, styles.menuIconClose].join(" ")} aria-hidden="true" />
            <span className="sr-only">Close menu</span>
          </button>
        </div>
        <nav aria-label="Primary" className={styles.menuNav}>
          <ul role="list" className={styles.menuList}>
            {primaryNavigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={["display-1", styles.menuLink].join(" ")}
                  aria-current={isCurrent(pathname, item) ? "page" : undefined}
                  onClick={closeMenu}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href={headerCta.href} className={["display-1", styles.menuLink].join(" ")} onClick={closeMenu}>
                {headerCta.label}
              </Link>
            </li>
          </ul>
        </nav>
      </dialog>
    </>
  );
}

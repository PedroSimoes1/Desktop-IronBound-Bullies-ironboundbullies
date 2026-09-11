"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Wordmark } from "@/components/ui/Wordmark";
import { headerCta, isCurrent, primaryNavigation } from "@/lib/navigation";
import { contact } from "@/lib/site";
import styles from "./SiteHeader.module.css";

/**
 * Site header (brief sections 44 and 45).
 *
 * The header is fixed and transparent at rest so the photography runs beneath
 * it; it becomes a blurred bar with a hairline once the page scrolls (detected
 * with an IntersectionObserver sentinel, never a scroll listener).
 *
 * Desktop: wordmark left, four links and one CTA right, always on one line.
 * Mobile: the menu is a native <dialog> opened with showModal(), which gives
 * focus trapping, Escape-to-close, an inert page behind it, and focus
 * returning to the button that opened it, all from the browser.
 */

/** How far the page must move before the header becomes a solid bar. */
const SCROLL_THRESHOLD_PX = 24;

/**
 * True once the page has scrolled past the threshold.
 *
 * The signal is a marker of exactly that height sitting at the top of the
 * document: while any of it is still in the viewport the page is at the top.
 * An IntersectionObserver watches it, so nothing runs on the scroll thread.
 */
function useScrolled(sentinelRef: React.RefObject<HTMLDivElement | null>): boolean {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting), { threshold: 0 });
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
      <div ref={sentinelRef} className={styles.sentinel} style={{ height: SCROLL_THRESHOLD_PX }} aria-hidden="true" />
      <header className={headerClass}>
        <div className={styles.bar}>
          <Wordmark size="header" className={styles.wordmark} />

          <div className={styles.actions}>
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

        <div className={styles.menuBody}>
          <nav aria-label="Primary">
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
                <Link href={headerCta.href} className={["display-1", styles.menuLink, styles.menuCta].join(" ")} onClick={closeMenu}>
                  {headerCta.label}
                </Link>
              </li>
            </ul>
          </nav>

          <div className={styles.menuContact}>
            <a href={contact.phone.href} className={["body-lg", styles.menuContactLink].join(" ")}>
              {contact.phone.display}
            </a>
            <a href={contact.instagram.href} className={["body-lg", styles.menuContactLink].join(" ")} target="_blank" rel="noopener noreferrer">
              {contact.instagram.display}
            </a>
          </div>
        </div>
      </dialog>
    </>
  );
}

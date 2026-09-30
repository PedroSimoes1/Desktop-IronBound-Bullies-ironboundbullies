"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./OwnerApp.module.css";

/**
 * The thumb-reachable tabs.
 *
 * A client component only because it has to know which page is current, which
 * is the smallest possible reason to be one.
 */
const NAV = [
  { href: "/owner", label: "Today" },
  { href: "/owner/dogs", label: "Dogs" },
  { href: "/owner/litters", label: "Litters" },
  { href: "/owner/inquiries", label: "Inquiries" },
];

export function OwnerNav() {
  const pathname = usePathname();
  return (
    <nav className={styles.nav} aria-label="Owner sections">
      <ul role="list" className={styles.navList}>
        {NAV.map((item) => {
          const current = item.href === "/owner" ? pathname === "/owner" : pathname.startsWith(item.href);
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
  );
}

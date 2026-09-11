import Link from "next/link";
import { Wordmark } from "@/components/ui/Wordmark";
import { headerCta, primaryNavigation } from "@/lib/navigation";
import { contact, site } from "@/lib/site";
import styles from "./SiteFooter.module.css";

/**
 * Business footer (brief section 46). Four things and nothing else: who the
 * kennel is, where to go, how to reach it, and the year.
 *
 * The contact details are the ones the business already publishes on its
 * current profile. VERIFY V10 and V11 before launch: confirm the number and
 * the address, decide whether the aol address is replaced by a domain
 * address, and add Facebook only if a business page exists.
 */

export function SiteFooter() {
  const year = new Date().getFullYear();
  const links = [...primaryNavigation, headerCta];

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Wordmark size="footer" />
          <p className={["body-sm", "muted", styles.tagline].join(" ")}>{site.tagline}</p>
        </div>

        <nav className={styles.column} aria-label="Footer">
          <h2 className={["label", styles.heading].join(" ")}>Site</h2>
          <ul role="list" className={styles.links}>
            {links.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={styles.link}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.column}>
          <h2 className={["label", styles.heading].join(" ")}>Contact</h2>
          <ul role="list" className={styles.links}>
            <li>
              <a href={contact.phone.href} className={styles.link}>
                {contact.phone.display}
              </a>
            </li>
            <li>
              <a href={contact.email.href} className={styles.link}>
                {contact.email.display}
              </a>
            </li>
            <li>
              <a href={contact.instagram.href} className={styles.link} target="_blank" rel="noopener noreferrer">
                {contact.instagram.display}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className={styles.legal}>
        <p className={["body-sm", "subtle"].join(" ")}>
          © {year} {site.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

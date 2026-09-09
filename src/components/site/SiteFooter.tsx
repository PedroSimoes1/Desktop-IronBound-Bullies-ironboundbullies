import Link from "next/link";
import { Wordmark } from "@/components/ui/Wordmark";
import { primaryNavigation } from "@/lib/navigation";
import { site } from "@/lib/site";
import styles from "./SiteFooter.module.css";

/**
 * Business footer (brief section 46). Contact details, social links, and
 * legal pages are added once the owner verifies them (audit V10, V11, V15) —
 * the layout already reserves the columns.
 */

export function SiteFooter() {
  const year = new Date().getFullYear();

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
            {primaryNavigation.map((item) => (
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
          <p className={["body-sm", "subtle"].join(" ")}>[TO BE PROVIDED]</p>
        </div>

        <div className={styles.column}>
          <h2 className={["label", styles.heading].join(" ")}>Follow</h2>
          <p className={["body-sm", "subtle"].join(" ")}>[TO BE PROVIDED]</p>
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

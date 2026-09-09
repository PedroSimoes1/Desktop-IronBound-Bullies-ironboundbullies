import Link from "next/link";
import { site } from "@/lib/site";
import styles from "./Wordmark.module.css";

/**
 * Typographic wordmark used until the owner supplies the logo (audit item V12).
 * Two weights of the display face: IRONBOUND heavy, BULLIES lighter.
 */

interface WordmarkProps {
  size?: "header" | "footer" | "hero";
  /** When false, renders plain text (for headings) instead of a link home. */
  linked?: boolean;
  className?: string;
}

export function Wordmark({ size = "header", linked = true, className }: WordmarkProps) {
  const inner = (
    <>
      <span className={styles.primary}>{site.wordmark.primary}</span>
      <span className={styles.secondary}>{site.wordmark.secondary}</span>
    </>
  );
  const cls = [styles.wordmark, styles[size], className ?? ""].filter(Boolean).join(" ");

  if (!linked) {
    return <span className={cls}>{inner}</span>;
  }
  return (
    <Link href="/" className={cls} aria-label={`${site.name} — home`}>
      {inner}
    </Link>
  );
}

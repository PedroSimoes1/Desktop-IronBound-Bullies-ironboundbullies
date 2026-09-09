import type { ReactNode } from "react";
import { Container } from "./Container";
import styles from "./Section.module.css";

/**
 * A page section with the system's vertical rhythm (--section-y top and bottom)
 * and an optional heading block: a small amber eyebrow label above a display title.
 */

interface SectionProps {
  id?: string;
  /** Small uppercase label above the title, e.g. "OUR DOGS". */
  eyebrow?: string;
  title?: string;
  /** Optional one-line introduction under the title. */
  lede?: string;
  width?: "text" | "standard" | "wide" | "full";
  /** Draws a hairline across the top of the section. */
  rule?: boolean;
  /** Heading level for the title. Defaults to h2. */
  headingLevel?: "h1" | "h2" | "h3";
  className?: string;
  children?: ReactNode;
}

export function Section({ id, eyebrow, title, lede, width = "standard", rule = false, headingLevel: Heading = "h2", className, children }: SectionProps) {
  return (
    <section id={id} className={[styles.section, rule ? styles.rule : "", className ?? ""].filter(Boolean).join(" ")}>
      <Container width={width}>
        {(eyebrow || title || lede) && (
          <header className={styles.header}>
            {eyebrow && <p className={["label", styles.eyebrow].join(" ")}>{eyebrow}</p>}
            {title && <Heading className="display-2">{title}</Heading>}
            {lede && <p className={["lede", styles.lede].join(" ")}>{lede}</p>}
          </header>
        )}
        {children}
      </Container>
    </section>
  );
}

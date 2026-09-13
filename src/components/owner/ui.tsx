import type { ReactNode } from "react";
import styles from "./ui.module.css";

/**
 * The handful of shapes every owner screen is built from. Deliberately few:
 * a title, a panel, a labelled figure, a note. Everything else comes from the
 * site's existing components and tokens.
 */

export function ScreenTitle({ title, lede, action }: { title: string; lede?: string; action?: ReactNode }) {
  return (
    <header className={styles.screenTitle}>
      <div className={styles.screenTitleRow}>
        <h1 className="display-2">{title}</h1>
        {action}
      </div>
      {lede && <p className={["body", "muted", styles.lede].join(" ")}>{lede}</p>}
    </header>
  );
}

export function Panel({ title, children, tone = "default" }: { title?: string; children: ReactNode; tone?: "default" | "quiet" }) {
  return (
    <section className={[styles.panel, tone === "quiet" ? styles.panelQuiet : ""].filter(Boolean).join(" ")}>
      {title && <h2 className={["label", styles.panelTitle].join(" ")}>{title}</h2>}
      {children}
    </section>
  );
}

/** A number that is actually backed by a record, with what it counts. */
export function Figure({ value, label }: { value: number | string; label: string }) {
  return (
    <div className={styles.figure}>
      <p className={["display-3", "numeric", styles.figureValue].join(" ")}>{value}</p>
      <p className={["body-sm", styles.figureLabel].join(" ")}>{label}</p>
    </div>
  );
}

/** Says plainly that something is missing, and why. */
export function Note({ children, tone = "quiet" }: { children: ReactNode; tone?: "quiet" | "attention" }) {
  return <p className={["body-sm", styles.note, tone === "attention" ? styles.noteAttention : ""].filter(Boolean).join(" ")}>{children}</p>;
}

/** Marks anything the public website never sees. */
export function PrivateMark() {
  return (
    <span className={["label", styles.privateMark].join(" ")}>
      Private
      <span className="sr-only">, never shown on the public website</span>
    </span>
  );
}

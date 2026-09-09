import { Button } from "@/components/ui/Button";
import { Wordmark } from "@/components/ui/Wordmark";
import { site } from "@/lib/site";
import styles from "./page.module.css";

/**
 * Stage 1 landing page. The cinematic hero replaces this once the photo
 * inventory is done and the owner has confirmed the featured dogs.
 */
export default function HomePage() {
  return (
    <section className={styles.stage}>
      <div className={styles.inner}>
        <p className={["label", styles.eyebrow].join(" ")}>{site.tagline}</p>
        <h1>
          <Wordmark size="hero" linked={false} />
        </h1>
        <p className={["lede", styles.lede].join(" ")}>
          A new home for the kennel is under construction. Stage 1 — the foundation and the design system — is ready
          for review.
        </p>
        <div className={styles.actions}>
          <Button href="/design-system">View design system</Button>
          <Button href="https://kenneldatabase.vercel.app/ironboundbullies" variant="secondary" external>
            Current profile
          </Button>
        </div>
      </div>
    </section>
  );
}

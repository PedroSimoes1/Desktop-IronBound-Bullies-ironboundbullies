import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import styles from "./not-found.module.css";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <section className={styles.notFound}>
      <Container width="standard">
        <p className={["label", styles.eyebrow].join(" ")}>404</p>
        <h1 className="display-1">That page doesn’t exist</h1>
        <p className={["lede", styles.lede].join(" ")}>
          The link may be out of date, or the dog you’re looking for may have a new page.
        </p>
        <div className={styles.actions}>
          <Button href="/">Back to home</Button>
        </div>
      </Container>
    </section>
  );
}

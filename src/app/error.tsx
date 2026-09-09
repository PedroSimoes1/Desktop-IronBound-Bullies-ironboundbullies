"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import styles from "./not-found.module.css";

/**
 * Application error boundary (brief section 49).
 * Visitors see a calm message and a retry; the details go to the server log,
 * never to the screen.
 */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Hosting platforms capture console output from the client; the digest links it to the server-side log.
    console.error("Unhandled application error", error.digest ?? error.message);
  }, [error]);

  return (
    <section className={styles.notFound}>
      <Container width="standard">
        <p className={["label", styles.eyebrow].join(" ")}>Something went wrong</p>
        <h1 className="display-1">We couldn’t load this page</h1>
        <p className={["lede", styles.lede].join(" ")}>Please try again. If it keeps happening, the problem is on our side, not yours.</p>
        <div className={styles.actions}>
          <Button onClick={reset}>Try again</Button>
          <Button href="/" variant="secondary">
            Back to home
          </Button>
        </div>
      </Container>
    </section>
  );
}

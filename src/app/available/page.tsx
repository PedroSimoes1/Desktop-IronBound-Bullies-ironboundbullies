import type { Metadata } from "next";
import { DogCard } from "@/components/dogs/DogCard";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { availableDogs } from "@/content/dogs";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Available dogs",
  description: "Puppies and adult Exotic Bullies currently available from Ironbound Bullies, Northern New Jersey.",
  alternates: { canonical: "/available" },
};

/**
 * Availability page (brief section 16). When nothing is verified as available,
 * the page says so plainly and points at the next useful thing. No countdowns,
 * no scarcity theatre, no placeholder listings.
 */
export default function AvailablePage() {
  const available = availableDogs();

  return (
    <div className={styles.page}>
      <Container width="wide">
        <header className={styles.header}>
          <h1 className="display-1">Available dogs</h1>
        </header>

        {available.length > 0 ? (
          <ul role="list" className={styles.grid}>
            {available.map((dog, i) => (
              <li key={dog.id}>
                <DogCard dog={dog} headingLevel="h2" priority={i < 2} sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw" />
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.empty}>
            <p className="lede">Nothing is listed as available right now.</p>
            <p className={["body-lg", "muted", styles.emptyBody].join(" ")}>
              Ask about an upcoming litter, or see the pairings the kennel has planned.
            </p>
            <div className={styles.emptyActions}>
              <Button href="/contact">Inquire</Button>
              <Button href="/breedings" variant="secondary">
                Breedings
              </Button>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}

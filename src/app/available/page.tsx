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
 * Availability page (brief section 16). When nothing is verified as
 * available, the page says so plainly and points to the next best action.
 * No countdowns, no scarcity theatre.
 */
export default function AvailablePage() {
  const available = availableDogs();

  return (
    <section className={styles.section}>
      <Container width="wide">
        <header className={styles.header}>
          <h1 className="display-1">Available dogs</h1>
        </header>

        {available.length > 0 ? (
          <ul role="list" className={styles.grid}>
            {available.map((dog, i) => (
              <li key={dog.id}>
                <DogCard dog={dog} priority={i < 2} />
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.empty}>
            <p className="lede">Nothing currently available. Ask about upcoming breedings.</p>
            <div className={styles.emptyActions}>
              <Button href="/contact">Inquire</Button>
              <Button href="/dogs" variant="secondary">
                Our dogs
              </Button>
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}

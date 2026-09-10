import { DogCard } from "@/components/dogs/DogCard";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import type { Dog } from "@/lib/domain/dog";
import styles from "./FeaturedDogs.module.css";

/**
 * Homepage "Featured dogs": one large frame and two smaller ones, never three
 * equal cards (Taste Skill audit, section 1.7). On phones the large frame
 * comes first at full width and the two smaller frames sit side by side.
 */

interface FeaturedDogsProps {
  dogs: Dog[];
}

export function FeaturedDogs({ dogs }: FeaturedDogsProps) {
  const [lead, ...rest] = dogs;
  if (!lead) return null;
  const supporting = rest.slice(0, 2);

  return (
    <section className={styles.section} aria-labelledby="featured-heading">
      <Container width="wide">
        <header className={styles.header}>
          <h2 id="featured-heading" className="display-2">
            Featured dogs
          </h2>
          <Button href="/dogs" variant="text">
            Our dogs
          </Button>
        </header>

        <div className={styles.grid}>
          <div className={styles.lead}>
            <DogCard dog={lead} size="large" sizes="(min-width: 1024px) 58vw, 100vw" />
          </div>
          {supporting.map((dog) => (
            <div key={dog.id} className={styles.small}>
              <DogCard dog={dog} sizes="(min-width: 1024px) 28vw, 50vw" />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

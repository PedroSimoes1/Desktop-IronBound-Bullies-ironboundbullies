import { FeaturedDogs } from "@/components/home/FeaturedDogs";
import { Hero, type HeroSlide } from "@/components/home/Hero";
import { AboutTeaser, ContactBand } from "@/components/home/HomeSections";
import { DogCard } from "@/components/dogs/DogCard";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { availableDogs, featuredDogs, getDogBySlug, heroSlides } from "@/content/dogs";
import { dogDescriptor } from "@/lib/domain/format";
import styles from "./page.module.css";

/**
 * Homepage story: cinematic hero → available now (only when something is
 * available) → featured dogs → who we are → how to ask.
 */
export default function HomePage() {
  const slides: HeroSlide[] = heroSlides.flatMap(({ slug, photo }) => {
    const dog = getDogBySlug(slug);
    return dog ? [{ slug, name: dog.name, descriptor: dogDescriptor(dog), photo }] : [];
  });
  const available = availableDogs();

  return (
    <>
      <Hero slides={slides} />

      {available.length > 0 && (
        <section className={styles.available} aria-labelledby="available-heading">
          <Container width="wide">
            <header className={styles.availableHeader}>
              <h2 id="available-heading" className="display-2">
                Available dogs
              </h2>
              <Button href="/available" variant="text">
                Available dogs
              </Button>
            </header>
            <ul role="list" className={styles.availableGrid}>
              {available.slice(0, 4).map((dog) => (
                <li key={dog.id}>
                  <DogCard dog={dog} />
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      <FeaturedDogs dogs={featuredDogs()} />
      <AboutTeaser />
      <ContactBand />
    </>
  );
}

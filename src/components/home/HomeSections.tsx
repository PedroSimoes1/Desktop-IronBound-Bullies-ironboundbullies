import Link from "next/link";
import Image from "next/image";
import { DogCard } from "@/components/dogs/DogCard";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

import { parentsOf, type Breeding } from "@/lib/domain/breeding";
import type { Dog } from "@/lib/domain/dog";
import type { Photo } from "@/lib/domain/photo";
import { focalFor, focalToObjectPosition } from "@/lib/images/focal";
import { contact, site } from "@/lib/site";
import styles from "./HomeSections.module.css";

/**
 * The homepage sections that are not the carousel.
 *
 * Each one uses a different layout family, so the page has rhythm instead of
 * four identical card rows: an indented statement, a pair of typographic
 * pairing plates, a photograph beside a roster, and a closing band.
 *
 * Every sentence here is the kennel's own, taken from the current public
 * profile. Nothing about the dogs, the breedings, or the business is invented.
 */

/** The page's h1. Indented into the right two thirds on desktop: the empty
 *  third is the point, not an accident. */
export function KennelStatement() {
  return (
    <section className={styles.statement} aria-labelledby="statement-heading">
      <Container width="wide">
        <div className={styles.statementInner}>
          <h1 id="statement-heading" className="display-1">
            A small Exotic Bully kennel in Northern New Jersey
          </h1>
          <p className="lede">Our focus is to produce quality Exotic Bullies.</p>
          <Button href="/about" variant="text">
            About
          </Button>
        </div>
      </Container>
    </section>
  );
}

interface BreedingsPreviewProps {
  breedings: Breeding[];
  /** Used to turn a pairing's parent ids into names and profile links. */
  dogs: Dog[];
}

/** Two pairings, set as type. Bully culture reads bloodlines, so the names and
 *  the owner's own bloodline headline carry the section without a photograph. */
export function BreedingsPreview({ breedings, dogs }: BreedingsPreviewProps) {
  const plates = breedings.filter((breeding) => breeding.featured);
  if (plates.length === 0) return null;

  return (
    <section className={styles.breedings} aria-labelledby="breedings-heading">
      <Container width="wide">
        <div className={styles.breedingsHeader}>
          <h2 id="breedings-heading" className="display-2">
            Breedings
          </h2>
        </div>
        <ul role="list" className={styles.plates}>
          {plates.map((breeding) => {
            const parents = parentsOf(breeding, dogs);
            if (!parents) return null;
            return (
              <li key={breeding.id}>
                <Link href="/breedings" className={styles.plate}>
                  <span className={styles.pairing}>
                    <span className="display-1">{parents.sireName}</span>
                    <span className={["display-2", styles.cross].join(" ")} aria-hidden="true">
                      ×
                    </span>
                    <span className="sr-only">bred to</span>
                    <span className="display-1">{parents.damName}</span>
                  </span>
                  {breeding.headline && <span className={["body-lg", styles.headline].join(" ")}>{breeding.headline}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}

interface FemalesPreviewProps {
  females: Dog[];
  photo: Photo;
}

/** The other half of the program: one photograph and the roster of females. */
export function FemalesPreview({ females, photo }: FemalesPreviewProps) {
  if (females.length === 0) return null;

  return (
    <section className={styles.females} aria-labelledby="females-heading">
      <Container width="wide">
        <div className={styles.femalesGrid}>
          <div className={styles.femalesMedia}>
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="(min-width: 1024px) 42vw, 100vw"
              placeholder={photo.blurDataUrl ? "blur" : "empty"}
              blurDataURL={photo.blurDataUrl}
              className={styles.femalesImage}
              style={{ objectPosition: focalToObjectPosition(focalFor(photo, "portrait")) }}
            />
          </div>

          <div className={styles.femalesBody}>
            <h2 id="females-heading" className="display-2">
              The females
            </h2>
            <ul role="list" className={styles.roster}>
              {females.map((dog) => (
                <li key={dog.id}>
                  <Link href={`/dogs/${dog.slug}`} className={styles.rosterEntry}>
                    <span className={["display-3", styles.rosterName].join(" ")}>{dog.name}</span>
                    {dog.color && <span className={["label", styles.rosterMeta].join(" ")}>{dog.color}</span>}
                  </Link>
                </li>
              ))}
            </ul>
            <Button href="/dogs" variant="text">
              Our dogs
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}

interface ClosingBandProps {
  available: Dog[];
}

/** Closing band: what is available right now, and the one way to ask. */
export function ClosingBand({ available }: ClosingBandProps) {
  const hasAvailable = available.length > 0;

  return (
    <section className={styles.closing} aria-labelledby="closing-heading">
      <Container width="wide">
        <div className={styles.closingHead}>
          <div className={styles.closingCopy}>
            <h2 id="closing-heading" className="display-1">
              {hasAvailable ? "Available now" : "Ask about a dog"}
            </h2>
            <p className={["body-lg", "muted", styles.closingLede].join(" ")}>
              {hasAvailable
                ? `Current opportunities at ${site.name}. Every listing carries the dog's details and a direct inquiry.`
                : "Nothing is listed as available right now. Tell us which dog, stud, or breeding you have in mind."}
            </p>
          </div>
          <div className={styles.closingActions}>
            <div className={styles.closingButtons}>
              <Button href="/contact">Inquire</Button>
              {hasAvailable && (
                <Button href="/available" variant="secondary">
                  Available dogs
                </Button>
              )}
            </div>
            <p className={["body", "subtle", styles.closingPhone].join(" ")}>
              Or call{" "}
              <a href={contact.phone.href} className={styles.phoneLink}>
                {contact.phone.display}
              </a>
              .
            </p>
          </div>
        </div>

        {hasAvailable && (
          <ul role="list" className={styles.closingGrid}>
            {available.slice(0, 3).map((dog) => (
              <li key={dog.id}>
                <DogCard dog={dog} sizes="(min-width: 1024px) 32vw, 100vw" />
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  );
}

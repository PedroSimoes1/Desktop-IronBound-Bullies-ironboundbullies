import Link from "next/link";
import { DogCard } from "@/components/dogs/DogCard";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import type { Dog } from "@/lib/domain/dog";
import styles from "./DogCollection.module.css";

/**
 * The "Our dogs" collection (brief section 13): a row of text filters and a
 * square-photo grid. Filters are real links to canonical URLs (/dogs,
 * /dogs/studs, /dogs/females) so each view is indexable and works without
 * JavaScript; the page is server-rendered, so switching is a single fast
 * navigation, not a full reload.
 */

export type CollectionFilter = "all" | "studs" | "females";

const FILTERS: { key: CollectionFilter; label: string; href: string }[] = [
  { key: "all", label: "All", href: "/dogs" },
  { key: "studs", label: "Studs", href: "/dogs/studs" },
  { key: "females", label: "Females", href: "/dogs/females" },
];

interface DogCollectionProps {
  title: string;
  lede?: string;
  filter: CollectionFilter;
  dogs: Dog[];
}

export function DogCollection({ title, lede, filter, dogs }: DogCollectionProps) {
  return (
    <section className={styles.section}>
      <Container width="wide">
        <header className={styles.header}>
          <h1 className="display-1">{title}</h1>
          {lede && <p className={["lede", styles.lede].join(" ")}>{lede}</p>}
          <nav aria-label="Filter dogs" className={styles.filters}>
            <ul role="list" className={styles.filterList}>
              {FILTERS.map((item) => (
                <li key={item.key}>
                  <Link href={item.href} className={["label-lg", styles.filter].join(" ")} aria-current={item.key === filter ? "page" : undefined}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        {dogs.length > 0 ? (
          <ul role="list" className={styles.grid}>
            {dogs.map((dog, i) => (
              <li key={dog.id}>
                <DogCard dog={dog} priority={i < 2} />
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.empty}>
            <p className="lede">No dogs in this group yet.</p>
            <Button href="/dogs" variant="text">
              Our dogs
            </Button>
          </div>
        )}
      </Container>
    </section>
  );
}

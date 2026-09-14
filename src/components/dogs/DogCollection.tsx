import Link from "next/link";
import { DogCard } from "@/components/dogs/DogCard";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { splitByPhoto, type Dog } from "@/lib/domain/dog";
import { dogMeta } from "@/lib/domain/format";
import styles from "./DogCollection.module.css";

/**
 * The "Our dogs" collection (brief section 13).
 *
 * Two blocks, not one grid. Dogs we hold photographs of become picture cards;
 * the rest become a typographic roster. A grid of empty "photo coming" frames
 * would tell a visitor the site is unfinished, which is both untrue and the
 * fastest way to lose a premium impression. Every dog is still here, still
 * named, still linked to its profile.
 *
 * Filters are real links to canonical URLs (/dogs, /dogs/studs, /dogs/females)
 * so each view is indexable and works without JavaScript.
 */

export type CollectionFilter = "all" | "studs" | "females";

const FILTERS: { key: CollectionFilter; label: string; href: string }[] = [
  { key: "all", label: "All", href: "/dogs" },
  { key: "studs", label: "Studs", href: "/dogs/studs" },
  { key: "females", label: "Females", href: "/dogs/females" },
];

const MAX_COLUMNS = 3;
/** At or above this width-to-height ratio a photograph reads well in a 3:2 frame. */
const LANDSCAPE_ASPECT = 1.15;

interface DogCollectionProps {
  title: string;
  lede?: string;
  filter: CollectionFilter;
  dogs: Dog[];
}

export function DogCollection({ title, lede, filter, dogs }: DogCollectionProps) {
  const { photographed, listed } = splitByPhoto(dogs);

  // With fewer photographs than columns the grid narrows instead of stretching
  // one card across the page, so a short collection still reads as a grid.
  const columns = Math.min(MAX_COLUMNS, Math.max(1, photographed.length)) as 1 | 2 | 3;
  const gridClass = [styles.grid, styles[`cols${columns}`]].join(" ");

  // A last row with one or two cards would leave a hole. When every photograph
  // in that row was shot landscape, those cards widen to fill it: the frames
  // suit the pictures better and the grid closes. A poster, whose composited
  // lettering a 3:2 crop would cut, never widens.
  const trailing = columns === MAX_COLUMNS ? photographed.length % MAX_COLUMNS : 0;
  const firstTrailing = photographed.length - trailing;
  const widenTrailing =
    trailing > 0 &&
    photographed
      .slice(firstTrailing)
      .every((dog) => dog.mainPhoto !== undefined && dog.mainPhoto.width / dog.mainPhoto.height >= LANDSCAPE_ASPECT);
  const trailingSpan = trailing === 1 ? 6 : 3;

  return (
    <div className={styles.page}>
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

        {photographed.length > 0 && (
          <ul role="list" className={gridClass}>
            {photographed.map((dog, i) => {
              const widened = widenTrailing && i >= firstTrailing;
              const desktopWidth = widened ? Math.round((trailingSpan / 6) * 90) : Math.round(90 / columns);
              return (
                <li key={dog.id} data-span={widened ? trailingSpan : undefined}>
                  <DogCard
                    dog={dog}
                    headingLevel="h2"
                    priority={i < 2}
                    ratio={widened ? "wide" : "square"}
                    sizes={`(min-width: 1024px) ${desktopWidth}vw, (min-width: 640px) 50vw, 100vw`}
                  />
                </li>
              );
            })}
          </ul>
        )}

        {listed.length > 0 && (
          <section className={styles.roster} aria-labelledby="roster-heading">
            <h2 id="roster-heading" className={["display-3", styles.rosterTitle].join(" ")}>
              Also in the program
            </h2>
            <ul role="list" className={styles.rosterList}>
              {listed.map((dog) => {
                const meta = dogMeta(dog);
                return (
                  <li key={dog.id}>
                    <Link href={`/dogs/${dog.slug}`} className={styles.rosterEntry}>
                      <span className={["display-3", styles.rosterName].join(" ")}>{dog.name}</span>
                      {meta && <span className={["label", styles.rosterMeta].join(" ")}>{meta}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {photographed.length === 0 && listed.length === 0 && (
          <div className={styles.empty}>
            <p className="lede">No dogs in this group yet.</p>
            <Button href="/dogs" variant="text">
              Our dogs
            </Button>
          </div>
        )}
      </Container>
    </div>
  );
}

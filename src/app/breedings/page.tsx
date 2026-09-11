import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { breedings, parentsOf } from "@/content/breedings";
import { getDogBySlug } from "@/content/dogs";
import type { Photo } from "@/lib/domain/photo";
import { focalFor, focalToObjectPosition } from "@/lib/images/focal";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Breedings",
  description: "Current Exotic Bully pairings at Ironbound Bullies, Northern New Jersey.",
  alternates: { canonical: "/breedings" },
};

/**
 * Breedings (brief section 14).
 *
 * The current profile states a sire, a dam, and a bloodline headline for each
 * pairing, and nothing else: no dates, no litter information, no status. This
 * page shows exactly that and asks the visitor to get in touch for the rest.
 * Nothing reproductive is ever assumed.
 *
 * Each pairing carries a different photograph of the sire, so the page never
 * prints the same frame twice.
 */
export default function BreedingsPage() {
  return (
    <div className={styles.page}>
      <Container width="wide">
        <header className={styles.header}>
          <h1 className="display-1">Breedings</h1>
          <p className={["lede", styles.lede].join(" ")}>
            Sire and dam for each pairing, in the kennel&rsquo;s own words. Ask about a breeding for dates and availability.
          </p>
        </header>

        <ul role="list" className={styles.list}>
          {breedings.map((breeding, index) => {
            const parents = parentsOf(breeding);
            if (!parents) return null;
            const sire = breeding.sireId ? getDogBySlug(breeding.sireId) : undefined;
            const gallery = sire?.gallery ?? [];
            const photo: Photo | undefined = gallery.length > 0 ? gallery[index % gallery.length] : sire?.mainPhoto;

            return (
              <li key={breeding.id} className={styles.item}>
                <article className={styles.breeding}>
                  {photo && (
                    <div className={styles.media}>
                      <Image
                        src={photo.src}
                        alt={photo.alt}
                        fill
                        sizes="(min-width: 1024px) 38vw, 100vw"
                        priority={index === 0}
                        placeholder={photo.blurDataUrl ? "blur" : "empty"}
                        blurDataURL={photo.blurDataUrl}
                        className={styles.image}
                        style={{ objectPosition: focalToObjectPosition(focalFor(photo, "portrait")) }}
                      />
                    </div>
                  )}

                  <div className={styles.body}>
                    <h2 className={styles.pairing}>
                      <span className="display-1">
                        {parents.sireHref ? (
                          <Link href={parents.sireHref} className={styles.parentLink}>
                            {parents.sireName}
                          </Link>
                        ) : (
                          parents.sireName
                        )}
                      </span>
                      <span className={["display-2", styles.cross].join(" ")} aria-hidden="true">
                        ×
                      </span>
                      <span className="sr-only">bred to</span>
                      <span className="display-1">
                        {parents.damHref ? (
                          <Link href={parents.damHref} className={styles.parentLink}>
                            {parents.damName}
                          </Link>
                        ) : (
                          parents.damName
                        )}
                      </span>
                    </h2>

                    {breeding.headline && <p className={["lede", styles.headline].join(" ")}>{breeding.headline}</p>}
                    {breeding.status && <StatusLabel kind="breeding" status={breeding.status} />}

                    <div className={styles.actions}>
                      <Button href={`/contact?type=breeding&breeding=${breeding.slug}`}>Inquire</Button>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      </Container>
    </div>
  );
}

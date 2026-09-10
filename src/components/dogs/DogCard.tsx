import Image from "next/image";
import Link from "next/link";
import type { Dog } from "@/lib/domain/dog";
import { dogMeta, isCardStatus } from "@/lib/domain/format";
import { focalFor, focalToObjectPosition } from "@/lib/images/focal";
import { StatusLabel } from "@/components/ui/StatusLabel";
import styles from "./DogCard.module.css";

/**
 * Collection card (brief section 13). Photography first: a square photograph,
 * then the name in display type, one line of meta, and the status when it
 * means something (a live opportunity or a change of state). No box, no
 * shadow. The whole card is one link to the profile.
 *
 * The frame is square rather than 4:5 because most of the photographs are
 * finished posters with lettering that a taller crop would cut through.
 */

interface DogCardProps {
  dog: Dog;
  /** Passed to next/image so the browser downloads the right size for the grid. */
  sizes?: string;
  /** Marks the image as high priority (above-the-fold cards only). */
  priority?: boolean;
  /** Larger name for the featured frame. */
  size?: "default" | "large";
  /** Heading level for the name, so the card fits its section's outline. */
  headingLevel?: "h2" | "h3";
}

export function DogCard({
  dog,
  sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw",
  priority = false,
  size = "default",
  headingLevel: Heading = "h3",
}: DogCardProps) {
  const meta = dogMeta(dog);
  const cardStatus = isCardStatus(dog.status) ? dog.status : undefined;

  return (
    <Link href={`/dogs/${dog.slug}`} className={[styles.card, size === "large" ? styles.large : ""].filter(Boolean).join(" ")}>
      <div className={styles.frame}>
        {dog.mainPhoto ? (
          <Image
            src={dog.mainPhoto.src}
            alt={dog.mainPhoto.alt}
            fill
            sizes={sizes}
            priority={priority}
            placeholder={dog.mainPhoto.blurDataUrl ? "blur" : "empty"}
            blurDataURL={dog.mainPhoto.blurDataUrl}
            className={styles.image}
            style={{ objectPosition: focalToObjectPosition(focalFor(dog.mainPhoto, "portrait")) }}
          />
        ) : (
          <div className={styles.placeholder} aria-hidden="true">
            <span className="label">Photo coming</span>
          </div>
        )}
      </div>
      <div className={styles.body}>
        <Heading className={[size === "large" ? "display-2" : "display-3", styles.name].join(" ")}>{dog.name}</Heading>
        {meta && <p className={["label", styles.meta].join(" ")}>{meta}</p>}
        {cardStatus && <StatusLabel status={cardStatus} className={styles.status} />}
        <span className={styles.rule} aria-hidden="true" />
      </div>
    </Link>
  );
}

import Image from "next/image";
import Link from "next/link";
import type { Dog } from "@/lib/domain/dog";
import { dogCardMeta, isCardStatus } from "@/lib/domain/format";
import { focalFor, focalToObjectPosition } from "@/lib/images/focal";
import { StatusLabel } from "@/components/ui/StatusLabel";
import styles from "./DogCard.module.css";

/**
 * Collection card (brief section 13). Photography first: the photograph, then
 * the name in display type, one line of meta, and the status when it means
 * something. No box, no shadow. The whole card is one link to the profile.
 *
 * Frames are square by default because most of the photographs are finished
 * posters whose lettering a taller crop would cut through. `ratio="wide"` is
 * for the two frames that were shot landscape and read better at 3:2.
 */

interface DogCardProps {
  dog: Dog;
  /** Passed to next/image so the browser downloads the right size for the grid. */
  sizes?: string;
  /** Marks the image as high priority (above-the-fold cards only). */
  priority?: boolean;
  /** Larger name for a lead frame. */
  size?: "default" | "large";
  /** Frame shape. Square protects composited lettering; wide suits landscape frames. */
  ratio?: "square" | "wide";
  /** Heading level for the name, so the card fits its section's outline. */
  headingLevel?: "h2" | "h3";
}

export function DogCard({
  dog,
  sizes = "(min-width: 1024px) 32vw, (min-width: 640px) 50vw, 100vw",
  priority = false,
  size = "default",
  ratio = "square",
  headingLevel: Heading = "h3",
}: DogCardProps) {
  const meta = dogCardMeta(dog);
  const cardStatus = isCardStatus(dog.status) ? dog.status : undefined;
  const orientation = ratio === "wide" ? "landscape" : "portrait";

  return (
    <Link
      href={`/dogs/${dog.slug}`}
      className={[styles.card, size === "large" ? styles.large : "", ratio === "wide" ? styles.wide : ""].filter(Boolean).join(" ")}
    >
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
            style={{ objectPosition: focalToObjectPosition(focalFor(dog.mainPhoto, orientation)) }}
          />
        ) : (
          <div className={styles.placeholder} aria-hidden="true" />
        )}
      </div>
      <div className={styles.body}>
        <Heading className={[size === "large" ? "display-2" : "display-3", styles.name].join(" ")}>{dog.name}</Heading>
        <div className={styles.metaRow}>
          {meta && <p className={["label", styles.meta].join(" ")}>{meta}</p>}
          {cardStatus && <StatusLabel status={cardStatus} />}
        </div>
        <span className={styles.rule} aria-hidden="true" />
      </div>
    </Link>
  );
}

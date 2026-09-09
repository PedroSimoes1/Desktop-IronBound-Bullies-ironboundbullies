import Image from "next/image";
import Link from "next/link";
import { formatSex, type Dog } from "@/lib/domain/dog";
import { focalFor, focalToObjectPosition } from "@/lib/images/focal";
import { StatusLabel } from "@/components/ui/StatusLabel";
import styles from "./DogCard.module.css";

/**
 * Collection card (brief section 13). Photography first: a 4:5 photograph,
 * then the name in display type, one line of small-caps meta, and the status.
 * No box, no shadow. The whole card is one link to the profile.
 */

interface DogCardProps {
  dog: Dog;
  /** Passed to next/image so the browser downloads the right size for the grid. */
  sizes?: string;
  /** Marks the image as high priority (above-the-fold cards only). */
  priority?: boolean;
}

const ROLE_LABEL: Record<Dog["role"], string> = {
  stud: "Stud",
  female: "Female",
  production: "Production",
  puppy: "Puppy",
};

export function DogCard({ dog, sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw", priority = false }: DogCardProps) {
  const meta = [dog.role === "stud" || dog.role === "female" ? ROLE_LABEL[dog.role] : formatSex(dog.sex), dog.color]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link href={`/dogs/${dog.slug}`} className={styles.card}>
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
            <span className="label">Photo pending</span>
          </div>
        )}
      </div>
      <div className={styles.body}>
        <h3 className={["display-3", styles.name].join(" ")}>{dog.name}</h3>
        {meta && <p className={["label", styles.meta].join(" ")}>{meta}</p>}
        {dog.status && <StatusLabel status={dog.status} className={styles.status} />}
        <span className={styles.rule} aria-hidden="true" />
      </div>
    </Link>
  );
}

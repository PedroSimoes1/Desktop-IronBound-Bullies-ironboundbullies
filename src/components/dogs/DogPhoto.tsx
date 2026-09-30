import Image from "next/image";
import type { Photo } from "@/lib/domain/photo";
import { focalFor, focalToObjectPosition } from "@/lib/images/focal";
import styles from "./DogPhoto.module.css";

/**
 * A dog's photograph, or the kennel's logo when there is no photograph yet.
 *
 * This is the one place that decides between the two, so every frame on the
 * public site and in the owner area behaves the same way:
 *
 *   photograph present → the photograph, cropped by its focal point
 *   no photograph      → the logo, centred, contained, never cropped
 *
 * The logo is not data. It is never written to the database and never counted
 * as one of the dog's photographs; it is simply what an empty frame shows. So
 * the owner never has to remove it: the first upload makes `photo` defined and
 * the logo disappears on the next render, and deleting the last photograph
 * makes it `undefined` again and the logo returns.
 *
 * Two layouts, matching the two ways the site already shows photographs:
 *
 *   "fill"      The parent is a sized, positioned frame (cards, thumbnails).
 *               The photograph fills it; the logo sits inside it.
 *   "intrinsic" The photograph sets its own height from its aspect ratio (the
 *               profile, the owner preview). With no photograph there is no
 *               ratio to borrow, so the logo gets a square frame of its own.
 *
 * Either way the space is reserved before anything downloads, so swapping one
 * for the other never shifts the page.
 */

export const PLACEHOLDER_LOGO_SRC = "/images/ironbound-placeholder-logo.png";

interface DogPhotoProps {
  /** The dog's main photograph, if it has one. */
  photo?: Photo | null;
  /** Used only for the placeholder's alt text when `describePlaceholder` is set. */
  dogName: string;
  /** Passed to next/image so the browser downloads the right size. */
  sizes: string;
  layout?: "fill" | "intrinsic";
  /** Which focal point a "fill" frame crops around. */
  orientation?: "landscape" | "portrait";
  /** Above-the-fold photographs only. The logo never takes priority. */
  priority?: boolean;
  /** Class for the photograph itself (hover zoom, width rules). Not applied to the logo. */
  className?: string;
  /**
   * Overrides the photograph's alt text. Pass "" where the dog's name is
   * already written beside the image and the picture would only repeat it.
   */
  alt?: string;
  /**
   * The logo is decorative by default, because every frame on the site has
   * the dog's name next to it. Set this where the frame is the only thing that
   * says which dog this is, and it is announced as "Photo coming soon for …".
   */
  describePlaceholder?: boolean;
}

/** A photograph the page can actually draw: a source and a real size. */
function isUsable(photo: Photo | null | undefined): photo is Photo {
  return Boolean(photo && photo.src && photo.width > 0 && photo.height > 0);
}

export function DogPhoto({
  photo,
  dogName,
  sizes,
  layout = "fill",
  orientation = "portrait",
  priority = false,
  className,
  alt,
  describePlaceholder = false,
}: DogPhotoProps) {
  if (isUsable(photo)) {
    const description = alt ?? photo.alt;
    const common = {
      src: photo.src,
      sizes,
      priority,
      placeholder: photo.blurDataUrl ? ("blur" as const) : ("empty" as const),
      blurDataURL: photo.blurDataUrl,
      className,
    };
    return layout === "fill" ? (
      <Image {...common} alt={description} fill style={{ objectPosition: focalToObjectPosition(focalFor(photo, orientation)) }} />
    ) : (
      <Image {...common} alt={description} width={photo.width} height={photo.height} />
    );
  }

  return (
    <span className={[styles.placeholder, layout === "intrinsic" ? styles.intrinsic : ""].filter(Boolean).join(" ")}>
      <span className={styles.logo}>
        <Image
          src={PLACEHOLDER_LOGO_SRC}
          alt={describePlaceholder ? `Photo coming soon for ${dogName}` : ""}
          fill
          sizes={sizes}
          className={styles.logoImage}
        />
      </span>
    </span>
  );
}

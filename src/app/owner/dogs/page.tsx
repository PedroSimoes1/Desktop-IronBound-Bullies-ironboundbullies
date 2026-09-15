import Image from "next/image";
import Link from "next/link";
import { ScreenTitle } from "@/components/owner/ui";
import { listDogsForOwner } from "@/db/queries/owner";
import { currentKennelId, requireUser } from "@/lib/auth/guard";
import { DOG_STATUS_LABELS } from "@/lib/domain/dog";
import { focalFor, focalToObjectPosition } from "@/lib/images/focal";
import { DogSearch } from "./DogSearch";
import styles from "./dogs.module.css";

/**
 * The dogs list.
 *
 * A photograph, the name, and the one fact the owner is usually here to
 * change. A dog with an unpublished edit says so in amber.
 */
export const dynamic = "force-dynamic";

export default async function OwnerDogsPage() {
  const user = await requireUser("/owner/dogs");
  const kennelId = await currentKennelId(user);
  const dogs = await listDogsForOwner(kennelId);

  return (
    <>
      <ScreenTitle title="Dogs" lede="Tap a dog to change what the website shows." />
      <DogSearch total={dogs.length}>
        {dogs.map((dog) => (
          <li key={dog.id} data-search={`${dog.name} ${dog.color ?? ""}`.toLowerCase()}>
            <Link href={`/owner/dogs/${dog.id}`} className={styles.row}>
              <span className={styles.thumb}>
                {dog.thumbnail ? (
                  <Image
                    src={dog.thumbnail.src}
                    alt=""
                    fill
                    sizes="72px"
                    placeholder={dog.thumbnail.blurDataUrl ? "blur" : "empty"}
                    blurDataURL={dog.thumbnail.blurDataUrl}
                    className={styles.thumbImage}
                    style={{ objectPosition: focalToObjectPosition(focalFor(dog.thumbnail, "portrait")) }}
                  />
                ) : (
                  <span className={["label", styles.thumbEmpty].join(" ")} aria-hidden="true">
                    No photo
                  </span>
                )}
              </span>

              <span className={styles.rowBody}>
                <span className={styles.rowName}>{dog.name}</span>
                <span className={["body-sm", styles.rowMeta].join(" ")}>
                  {dog.publishedStatus ? DOG_STATUS_LABELS[dog.publishedStatus] : "No availability set"}
                </span>
                {dog.hasDraft && <span className={["label", styles.rowPending].join(" ")}>Not published</span>}
              </span>

              <span className={styles.chevron} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </DogSearch>
    </>
  );
}

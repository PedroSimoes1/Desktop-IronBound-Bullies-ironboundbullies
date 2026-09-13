"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Note, ScreenTitle } from "@/components/owner/ui";
import { Field } from "@/components/ui/form/Field";
import { Input } from "@/components/ui/form/controls";
import { DOG_STATUS_LABELS } from "@/lib/domain/dog";
import { focalFor, focalToObjectPosition } from "@/lib/images/focal";
import { hasChanges } from "@/lib/owner/demo";
import { useOwnerStore } from "@/lib/owner/store";
import styles from "./dogs.module.css";

/**
 * The dogs list.
 *
 * A photograph, the name, and the one fact the owner is usually here to check
 * or change: availability. A dog with an edit waiting says so in amber, because
 * "I changed this and forgot to publish it" is the mistake this screen exists
 * to prevent.
 */
export default function OwnerDogsPage() {
  const { dogs } = useOwnerStore();
  const [query, setQuery] = useState("");

  const matches = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return dogs;
    return dogs.filter((dog) => `${dog.name} ${dog.color ?? ""} ${dog.breed ?? ""}`.toLowerCase().includes(term));
  }, [dogs, query]);

  return (
    <>
      <ScreenTitle title="Dogs" lede="Tap a dog to change what the website shows." />

      <div className={styles.search}>
        <Field label="Search by name or colour" requirement="none">
          {(ids) => (
            <Input
              {...ids}
              type="search"
              inputMode="search"
              autoComplete="off"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Voodoo, blue tri"
            />
          )}
        </Field>
      </div>

      {matches.length === 0 ? (
        <div className={styles.empty}>
          <Note>No dog matches &ldquo;{query.trim()}&rdquo;. Check the spelling, or clear the search to see all {dogs.length}.</Note>
        </div>
      ) : (
        <ul role="list" className={styles.list}>
          {matches.map((dog) => {
            const pending = hasChanges(dog);
            const status = dog.published.status;
            return (
              <li key={dog.id}>
                <Link href={`/owner/dogs/${dog.id}`} className={styles.row}>
                  <span className={styles.thumb}>
                    {dog.photo ? (
                      <Image
                        src={dog.photo.src}
                        alt=""
                        fill
                        sizes="72px"
                        placeholder={dog.photo.blurDataUrl ? "blur" : "empty"}
                        blurDataURL={dog.photo.blurDataUrl}
                        className={styles.thumbImage}
                        style={{ objectPosition: focalToObjectPosition(focalFor(dog.photo, "portrait")) }}
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
                      {status ? DOG_STATUS_LABELS[status] : "No availability set"}
                    </span>
                    {pending && <span className={["label", styles.rowPending].join(" ")}>Not published</span>}
                  </span>

                  <span className={styles.chevron} aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

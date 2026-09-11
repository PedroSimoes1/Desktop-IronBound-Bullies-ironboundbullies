"use client";

import { useEffect, useRef } from "react";
import { DogCard } from "@/components/dogs/DogCard";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { Button } from "@/components/ui/Button";
import { formatMoney, type Dog } from "@/lib/domain/dog";
import { effectiveFields, type OwnerDog } from "@/lib/owner/demo";
import styles from "./PreviewSheet.module.css";

/**
 * Preview: the same components the public website uses, fed the edited values.
 *
 * This is not a drawing of the website. The card below is the real DogCard and
 * the status is the real StatusLabel, so what the owner sees here is what a
 * customer gets. The whole preview is inert: it is for looking at, and a stray
 * tap cannot navigate out of the dashboard.
 */

export function PreviewSheet({ dog, open, onClose }: { dog: OwnerDog; open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      const previous = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previous;
        if (dialog.open) dialog.close();
      };
    }
  }, [open]);

  const fields = effectiveFields(dog);
  const isStud = dog.role === "stud";

  // The shape the public components expect, built from the edited values.
  const asPublicDog: Dog = {
    id: dog.id,
    slug: dog.slug,
    name: dog.name,
    role: dog.role,
    breed: dog.breed,
    color: dog.color,
    status: fields.status,
    summary: fields.summary,
    price: fields.price,
    contactForPrice: fields.contactForPrice,
    studFee: fields.studFee,
    lockInFee: fields.lockInFee,
    mainPhoto: dog.photo,
  };

  return (
    <dialog
      ref={ref}
      className={styles.sheet}
      aria-label={`Preview of ${dog.name} on the website`}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className={styles.bar}>
        <p className={["label", styles.barTitle].join(" ")}>Preview</p>
        <button type="button" className={styles.close} onClick={onClose}>
          <span className={styles.closeIcon} aria-hidden="true" />
          <span className="sr-only">Close preview</span>
        </button>
      </div>

      <div className={styles.body}>
        <p className={["body-sm", styles.intro].join(" ")}>
          This is how {dog.name} will look once you publish. Nothing on your website has changed yet.
        </p>

        <section className={styles.block} aria-label="On the Our dogs page">
          <h3 className={["label", styles.blockTitle].join(" ")}>On the Our dogs page</h3>
          <div className={styles.cardFrame} inert aria-hidden="true">
            <DogCard dog={asPublicDog} sizes="(min-width: 640px) 20rem, 80vw" />
          </div>
        </section>

        <section className={styles.block} aria-label="On the dog's own page">
          <h3 className={["label", styles.blockTitle].join(" ")}>On {dog.name}&rsquo;s own page</h3>
          <div className={styles.profileBits}>
            <p className={["display-2", styles.profileName].join(" ")}>{dog.name}</p>
            {fields.status && <StatusLabel status={fields.status} />}
            {fields.summary && <p className={["body", styles.profileSummary].join(" ")}>{fields.summary}</p>}
            {isStud && fields.studFee !== undefined && (
              <p className={["body", "muted"].join(" ")}>
                Stud fee {formatMoney(fields.studFee)}
                {fields.lockInFee !== undefined ? `, ${formatMoney(fields.lockInFee)} lock-in` : ""}
              </p>
            )}
            {!isStud && fields.price !== undefined && <p className={["body", "muted"].join(" ")}>{formatMoney(fields.price)}</p>}
            {!isStud && fields.price === undefined && fields.contactForPrice && (
              <p className={["body", "muted"].join(" ")}>Contact for pricing</p>
            )}
          </div>
        </section>
      </div>

      <div className={styles.footer}>
        <Button variant="secondary" fullWidth onClick={onClose}>
          Back to editing
        </Button>
      </div>
    </dialog>
  );
}

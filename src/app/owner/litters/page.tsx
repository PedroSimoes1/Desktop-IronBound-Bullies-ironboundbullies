"use client";

import { Note, Panel, ScreenTitle } from "@/components/owner/ui";
import { Button } from "@/components/ui/Button";
import { useOwnerStore } from "@/lib/owner/store";
import styles from "./litters.module.css";

/**
 * Litters.
 *
 * The kennel's records hold two pairings and no litters: no birth dates, no
 * puppy counts, nothing. So this screen shows the pairings that exist and says
 * plainly that no litter has been recorded against either, rather than inventing
 * a litter to make the screen look busy.
 *
 * Anything more than "which pairing, how many puppies, are they available" is
 * out of scope for the first version.
 */
export default function OwnerLittersPage() {
  const { litters } = useOwnerStore();

  return (
    <>
      <ScreenTitle title="Litters" lede="Pairings, and the puppies that came from them." />

      {litters.length === 0 ? (
        <Panel>
          <Note>No pairings recorded yet.</Note>
        </Panel>
      ) : (
        litters.map((litter) => (
          <Panel key={litter.id}>
            <p className={styles.pairing}>
              <span className={styles.parent}>{litter.sireName}</span>
              <span className={styles.cross} aria-hidden="true">
                ×
              </span>
              <span className="sr-only">bred to</span>
              <span className={styles.parent}>{litter.damName}</span>
            </p>
            {litter.headline && <p className={["body", "muted", styles.headline].join(" ")}>{litter.headline}</p>}
            <p className={["body-sm", styles.count].join(" ")}>
              {litter.puppyCount === 0 ? "No litter recorded yet." : `${litter.puppyCount} puppies`}
            </p>
            <div className={styles.action}>
              <Button variant="secondary" disabled>
                Record a litter
              </Button>
            </div>
          </Panel>
        ))
      )}

      <Panel tone="quiet">
        <Note>
          Recording a litter needs somewhere permanent to keep it, so it is switched off in this prototype. The design question for you
          is whether these two pairings are the right starting point, and what you would want to type in when a litter arrives.
        </Note>
      </Panel>
    </>
  );
}

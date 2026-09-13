"use client";

import Link from "next/link";
import { Figure, Note, Panel, ScreenTitle } from "@/components/owner/ui";
import { Button } from "@/components/ui/Button";
import { hasChanges } from "@/lib/owner/demo";
import { useOwnerStore } from "@/lib/owner/store";
import styles from "./today.module.css";

/**
 * Today.
 *
 * Only counts that a real record stands behind. There is no chart here and no
 * invented business statistic: a kennel with twelve dogs does not need a graph,
 * and a number nobody can trace is worse than no number.
 *
 * Inquiries are the honest exception. The website does not collect any yet, so
 * this screen says that instead of showing a zero that looks like quiet week.
 */
export default function OwnerTodayPage() {
  const { dogs } = useOwnerStore();

  const withPhotographs = dogs.filter((dog) => dog.photo).length;
  const standingAtStud = dogs.filter((dog) => dog.published.status === "stud_available").length;
  const availableNow = dogs.filter((dog) => dog.published.status === "available").length;
  const unpublished = dogs.filter(hasChanges);

  return (
    <>
      <ScreenTitle title="Today" lede="What the website is showing right now." />

      {unpublished.length > 0 ? (
        <Panel title="Waiting to be published">
          <ul role="list" className={styles.pending}>
            {unpublished.map((dog) => (
              <li key={dog.id}>
                <Link href={`/owner/dogs/${dog.id}`} className={styles.pendingLink}>
                  <span className={styles.pendingName}>{dog.name}</span>
                  <span className={["body-sm", styles.pendingHint].join(" ")}>Edited, not published yet</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      ) : (
        <Panel title="Waiting to be published">
          <Note>Nothing. Every change you have made is live on the website.</Note>
        </Panel>
      )}

      <Panel title="Your dogs">
        <div className={styles.figures}>
          <Figure value={dogs.length} label="Dogs on the website" />
          <Figure value={withPhotographs} label="With photographs" />
          <Figure value={standingAtStud} label="Standing at stud" />
          <Figure value={availableNow} label="Available now" />
        </div>
        <div className={styles.panelAction}>
          <Button href="/owner/dogs" variant="secondary">
            Manage dogs
          </Button>
        </div>
      </Panel>

      <Panel title="Inquiries">
        <Note tone="attention">
          The inquiry form on your website is not connected yet, so nothing is arriving here. Until it is, people reach you by phone or
          Instagram. Connecting it is the first job after this design is approved.
        </Note>
        <div className={styles.panelAction}>
          <Button href="/owner/inquiries" variant="text">
            See the inbox design
          </Button>
        </div>
      </Panel>

      <Panel title="The public website" tone="quiet">
        <Note>Open your website in a new tab to see exactly what a customer sees.</Note>
        <div className={styles.panelAction}>
          <Button href="/" variant="text">
            Open the website
          </Button>
        </div>
      </Panel>
    </>
  );
}

import Link from "next/link";
import { dogsWithUnpublishedChanges, kennelOverview } from "@/db/queries/owner";
import { Button } from "@/components/ui/Button";
import { Figure, Note, Panel, ScreenTitle } from "@/components/owner/ui";
import { currentKennelId, requireUser } from "@/lib/auth/guard";
import styles from "./today.module.css";

/**
 * Today.
 *
 * Answers the one question worth asking on opening the app: is anything of
 * mine unpublished? Then four counts, every one of them a real record.
 *
 * Dynamic on purpose. An owner needs to see what is true now, not what was
 * true when the site was last built, and this page is seen by one person.
 */
export const dynamic = "force-dynamic";

export default async function OwnerTodayPage() {
  const user = await requireUser("/owner");
  const kennelId = await currentKennelId(user);
  const [counts, pending] = await Promise.all([kennelOverview(kennelId), dogsWithUnpublishedChanges(kennelId)]);

  return (
    <>
      <ScreenTitle title="Today" lede="What the website is showing right now." />

      <Panel title="Waiting to be published">
        {pending.length === 0 ? (
          <p className="body">Nothing. Every change you have made is live on the website.</p>
        ) : (
          <ul role="list" className={styles.pendingList}>
            {pending.map((dog) => (
              <li key={dog.id}>
                <Link href={`/owner/dogs/${dog.id}`} className={styles.pendingLink}>
                  <span className={styles.pendingName}>{dog.name}</span>
                  <span className={["body-sm", styles.pendingWhen].join(" ")}>edited, not published</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Your dogs">
        <div className={styles.figures}>
          <Figure value={counts.dogs} label="Dogs on the website" />
          <Figure value={counts.withPhotographs} label="With photographs" />
          <Figure value={counts.standingAtStud} label="Standing at stud" />
          <Figure value={counts.availableNow} label="Available now" />
        </div>
        <div className={styles.action}>
          <Button href="/owner/dogs" variant="secondary">
            Manage dogs
          </Button>
        </div>
      </Panel>

      <Panel title="Inquiries">
        <Note>
          The inquiry form on your website is not connected yet, so nothing is arriving here. Until it is, people reach you by phone or
          Instagram.
        </Note>
        <div className={styles.action}>
          <Button href="/owner/inquiries" variant="text">
            See the inbox design
          </Button>
        </div>
      </Panel>

      <Panel title="The public website">
        <p className="body">Open your website in a new tab to see exactly what a customer sees.</p>
        <div className={styles.action}>
          <Button href="/" variant="text">
            Open the website
          </Button>
        </div>
      </Panel>
    </>
  );
}

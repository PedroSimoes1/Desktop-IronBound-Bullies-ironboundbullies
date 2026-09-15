import { Note, Panel, ScreenTitle } from "@/components/owner/ui";
import { db } from "@/db/client";
import { breedings } from "@/db/schema";
import { currentKennelId, requireUser } from "@/lib/auth/guard";
import { eq, asc } from "drizzle-orm";
import styles from "./litters.module.css";

/**
 * The pairings already on the website.
 *
 * Read only for now. The records hold a sire, a dam and the owner's own
 * bloodline headline and nothing else, because that is all the old profile
 * stated, and nothing reproductive is ever assumed.
 */
export const dynamic = "force-dynamic";

export default async function OwnerLittersPage() {
  const user = await requireUser("/owner/litters");
  const kennelId = await currentKennelId(user);

  const pairings = await db
    .select({
      id: breedings.id,
      sireName: breedings.sireName,
      damName: breedings.damName,
      sireId: breedings.sireId,
      damId: breedings.damId,
      headline: breedings.headline,
      status: breedings.status,
    })
    .from(breedings)
    .where(eq(breedings.kennelId, kennelId))
    .orderBy(asc(breedings.sortOrder));

  return (
    <>
      <ScreenTitle title="Litters" lede="Pairings, and the puppies that came from them." />

      {pairings.length === 0 ? (
        <Panel>
          <Note>No pairings recorded yet.</Note>
        </Panel>
      ) : (
        pairings.map((pairing) => (
          <Panel key={pairing.id}>
            <p className={["display-3", styles.pairing].join(" ")}>
              {pairing.sireId ?? pairing.sireName} <span className={styles.times}>&times;</span> {pairing.damId ?? pairing.damName}
            </p>
            {pairing.headline && <p className={["body", styles.headline].join(" ")}>{pairing.headline}</p>}
            <Note>No litter recorded yet. Recording litters is the next thing to build here.</Note>
          </Panel>
        ))
      )}
    </>
  );
}

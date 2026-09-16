import Link from "next/link";
import { notFound } from "next/navigation";
import { Panel } from "@/components/owner/ui";
import { getDogForOwner } from "@/db/queries/owner";
import { currentKennelId, requireUser } from "@/lib/auth/guard";
import { EditDogForm } from "./EditDogForm";
import { PhotoManager } from "./PhotoManager";
import styles from "./edit.module.css";

/**
 * Edit a dog.
 *
 * Ordered by how often the owner needs each thing: availability first, because
 * that is what changes when a dog is reserved or sold; then the words the
 * website shows; then photographs; then his own notes, which the website never
 * sees.
 *
 * Every edit goes into a draft. The public site keeps showing the published
 * values until Publish is pressed.
 */
export const dynamic = "force-dynamic";

export default async function OwnerEditDogPage({ params }: PageProps<"/owner/dogs/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/owner/dogs/${id}`);
  const kennelId = await currentKennelId(user);

  // Scoped to this person's kennel. Another kennel's id is simply not found,
  // which is also what a made-up id gets, so this reveals nothing either way.
  const dog = await getDogForOwner(kennelId, id);
  if (!dog) notFound();

  return (
    <>
      <Link href="/owner/dogs" className={["body-sm", styles.back].join(" ")}>
        Dogs
      </Link>

      <EditDogForm dog={dog} />

      {/* Notes live inside the form above, so they save with everything else.
          Photographs save on their own: an upload is its own action. */}
      <Panel title="Photographs">
        <PhotoManager dogId={dog.id} photos={dog.photos} />
      </Panel>
    </>
  );
}

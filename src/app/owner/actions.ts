"use server";

import { randomUUID } from "node:crypto";
import { asc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { dogDrafts, dogNotes, dogs, photos } from "@/db/schema";
import type { EditableFields } from "@/db/queries/owner";
import { assertCanEditDog, assertCanEditPhoto, currentKennelId, NotAllowed, requireUserForAction } from "@/lib/auth/guard";
import { signIn as doSignIn, signOut as doSignOut } from "@/lib/auth/session";
import { DOG_STATUS_LABELS, type DogStatus } from "@/lib/domain/dog";
import { deletePhotoFile, storePhotoFile } from "@/lib/storage";

/**
 * Everything the owner can change.
 *
 * These are Server Actions: they run only on the server, and Next checks the
 * request's origin before one will run, which is what stops another website
 * from submitting these on a signed-in owner's behalf.
 *
 * Every one of them starts the same way. Find out who is asking, find out
 * which kennel owns the row they named, and refuse if those do not match. The
 * id in the form is only ever used to look a row up; the row's own kennel is
 * what decides. Passing another kennel's id gets the same answer as passing a
 * made-up one, so this cannot be used to discover what exists either.
 */

export type ActionResult =
  /** draftExists tells the form whether there is now anything left to publish. */
  { ok: true; message?: string; draftExists?: boolean } | { ok: false; message: string; field?: string };

/** Turns a thrown NotAllowed into an answer the form can show. */
async function guarded(work: () => Promise<ActionResult>): Promise<ActionResult> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof NotAllowed) return { ok: false, message: error.message };
    // Anything else is a fault on our side. The owner gets a useful sentence;
    // the detail goes to the server log, not to the browser.
    console.error("owner action failed:", error);
    return { ok: false, message: "Something went wrong saving that. Nothing was lost. Try again." };
  }
}

/* ---------------------------------------------------------------------------
   SIGNING IN AND OUT
   -------------------------------------------------------------------------- */

export async function signInAction(_previous: ActionResult | null, form: FormData): Promise<ActionResult> {
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  if (!email.trim() || !password) return { ok: false, message: "Enter your email address and password." };

  const result = await doSignIn(email, password);
  if (!result.ok) return { ok: false, message: result.message };

  const next = String(form.get("next") ?? "/owner");
  // Only ever return to a path inside this site.
  redirect(next.startsWith("/owner") ? next : "/owner");
}

export async function signOutAction(): Promise<void> {
  await doSignOut();
  redirect("/owner/login");
}

/* ---------------------------------------------------------------------------
   EDITING A DOG

   An edit writes to the draft, never to the dog. The public site keeps showing
   the published values until Publish is pressed, which is the whole point.
   -------------------------------------------------------------------------- */

const SUMMARY_LIMIT = 180;

/** Dollars typed by a person into whole cents. */
function parseMoney(input: string): { cents: number | null } | { error: string } {
  const trimmed = input.trim().replace(/^\$/, "").replace(/,/g, "");
  if (trimmed === "") return { cents: null };
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(trimmed)) return { error: "Use numbers only, for example 2000 or 2000.50" };
  return { cents: Math.round(Number(trimmed) * 100) };
}

function validStatus(value: string): value is DogStatus {
  return value in DOG_STATUS_LABELS;
}

export async function saveDraftAction(_previous: ActionResult | null, form: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const user = await requireUserForAction();
    const dogId = String(form.get("dogId") ?? "");
    const dog = await assertCanEditDog(user, dogId);

    const fields: EditableFields = {};

    const status = String(form.get("status") ?? "");
    if (status) {
      if (!validStatus(status)) return { ok: false, message: "That is not a valid availability.", field: "status" };
      fields.status = status;
    }

    const summary = String(form.get("summary") ?? "");
    if (summary.length > SUMMARY_LIMIT) {
      return { ok: false, message: `The description is ${summary.length - SUMMARY_LIMIT} characters too long.`, field: "summary" };
    }
    fields.summary = summary.trim() === "" ? null : summary;

    const isStud = String(form.get("isStud") ?? "") === "true";
    const money = parseMoney(String(form.get("money") ?? ""));
    if ("error" in money) return { ok: false, message: money.error, field: "money" };
    if (isStud) fields.studFeeCents = money.cents;
    else fields.priceCents = money.cents;

    if (!isStud) fields.contactForPrice = form.get("contactForPrice") === "on";

    // Private notes are not part of the draft: they are never published, so
    // they save straight away and the owner does not have to publish to keep them.
    const notes = String(form.get("privateNotes") ?? "");
    await db
      .insert(dogNotes)
      .values({ dogId: dog.id, body: notes })
      .onConflictDoUpdate({ target: dogNotes.dogId, set: { body: notes, updatedAt: new Date() } });

    // If the edit puts everything back to what is published, there is no draft.
    const [current] = await db
      .select({
        status: dogs.status,
        summary: dogs.summary,
        priceCents: dogs.priceCents,
        studFeeCents: dogs.studFeeCents,
        contactForPrice: dogs.contactForPrice,
      })
      .from(dogs)
      .where(eq(dogs.id, dog.id))
      .limit(1);

    const unchanged =
      current &&
      (fields.status ?? null) === current.status &&
      (fields.summary ?? null) === current.summary &&
      (isStud ? (fields.studFeeCents ?? null) === current.studFeeCents : (fields.priceCents ?? null) === current.priceCents) &&
      (isStud || (fields.contactForPrice ?? false) === current.contactForPrice);

    if (unchanged) {
      await db.delete(dogDrafts).where(eq(dogDrafts.dogId, dog.id));
      revalidatePath("/owner");
      revalidatePath(`/owner/dogs/${dog.id}`);
      return { ok: true, message: "Back to what the website is showing. Nothing left to publish.", draftExists: false };
    }

    await db
      .insert(dogDrafts)
      .values({ dogId: dog.id, fields: fields as Record<string, unknown>, updatedBy: user.id })
      .onConflictDoUpdate({
        target: dogDrafts.dogId,
        set: { fields: fields as Record<string, unknown>, updatedBy: user.id, updatedAt: new Date() },
      });

    revalidatePath("/owner");
    revalidatePath(`/owner/dogs/${dog.id}`);
    return { ok: true, message: "Saved as a draft. The website has not changed yet.", draftExists: true };
  });
}

export async function discardDraftAction(_previous: ActionResult | null, form: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const user = await requireUserForAction();
    const dog = await assertCanEditDog(user, String(form.get("dogId") ?? ""));
    await db.delete(dogDrafts).where(eq(dogDrafts.dogId, dog.id));
    revalidatePath("/owner");
    revalidatePath(`/owner/dogs/${dog.id}`);
    return { ok: true, message: "Draft thrown away." };
  });
}

/**
 * Publish: the draft becomes what the website shows.
 *
 * One transaction, so a failure halfway leaves the dog exactly as it was with
 * the draft still there, rather than half-published.
 */
export async function publishAction(_previous: ActionResult | null, form: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const user = await requireUserForAction();
    const dog = await assertCanEditDog(user, String(form.get("dogId") ?? ""));

    const [draft] = await db.select({ fields: dogDrafts.fields }).from(dogDrafts).where(eq(dogDrafts.dogId, dog.id)).limit(1);
    if (!draft) return { ok: false, message: "There is nothing waiting to be published." };

    const fields = draft.fields as EditableFields;

    await db.transaction(async (tx) => {
      await tx
        .update(dogs)
        .set({
          ...(fields.status !== undefined ? { status: fields.status } : {}),
          ...(fields.summary !== undefined ? { summary: fields.summary } : {}),
          ...(fields.priceCents !== undefined ? { priceCents: fields.priceCents } : {}),
          ...(fields.studFeeCents !== undefined ? { studFeeCents: fields.studFeeCents } : {}),
          ...(fields.contactForPrice !== undefined ? { contactForPrice: fields.contactForPrice } : {}),
          updatedAt: new Date(),
        })
        .where(eq(dogs.id, dog.id));
      await tx.delete(dogDrafts).where(eq(dogDrafts.dogId, dog.id));
    });

    refreshPublicPages(dog.slug);
    return { ok: true, message: "Published. The website is showing it now." };
  });
}

/**
 * Rebuild the public pages this dog appears on.
 *
 * The site is prerendered, so a visitor never waits on a query. The cost of
 * that is that a change has to say which pages it affects, and this is the
 * list: the dog's own page, every collection it can appear in, and the
 * homepage, which shows featured dogs and what is available.
 */
function refreshPublicPages(slug: string): void {
  revalidatePath("/");
  revalidatePath("/dogs");
  revalidatePath("/dogs/studs");
  revalidatePath("/dogs/females");
  revalidatePath("/available");
  revalidatePath(`/dogs/${slug}`);
  revalidatePath("/owner");
  revalidatePath("/owner/dogs");
}

/* ---------------------------------------------------------------------------
   PHOTOGRAPHS
   -------------------------------------------------------------------------- */

export async function uploadPhotoAction(_previous: ActionResult | null, form: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const user = await requireUserForAction();
    const dog = await assertCanEditDog(user, String(form.get("dogId") ?? ""));
    const kennelId = await currentKennelId(user);

    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Choose a photograph first." };

    const alt = String(form.get("alt") ?? "").trim();
    if (alt.length < 4) {
      return {
        ok: false,
        message: "Describe the photograph in a few words. Someone using a screen reader hears this instead of seeing it.",
        field: "alt",
      };
    }

    const stored = await storePhotoFile(file, dog.kennelId);
    if ("error" in stored) return { ok: false, message: stored.error, field: "file" };

    const [{ next }] = await db
      .select({ next: sql<number>`coalesce(max(${photos.sortOrder}), -1) + 1` })
      .from(photos)
      .where(eq(photos.dogId, dog.id));

    const [{ existing }] = await db
      .select({ existing: sql<number>`count(*)::int` })
      .from(photos)
      .where(eq(photos.dogId, dog.id));

    await db.insert(photos).values({
      id: randomUUID(),
      kennelId,
      dogId: dog.id,
      source: "blob",
      src: stored.url,
      storageKey: stored.key,
      width: stored.width,
      height: stored.height,
      alt,
      focalX: "0.5",
      focalY: "0.5",
      hasEmbeddedText: false,
      sortOrder: next,
      // The first photograph a dog has becomes its main one automatically.
      isMain: existing === 0,
    });

    revalidatePath(`/owner/dogs/${dog.id}`);
    refreshPublicPages(dog.slug);
    return { ok: true, message: "Photograph added." };
  });
}

export async function reorderPhotoAction(_previous: ActionResult | null, form: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const user = await requireUserForAction();
    const photo = await assertCanEditPhoto(user, String(form.get("photoId") ?? ""));
    const direction = String(form.get("direction") ?? "");
    if (!photo.dogId) return { ok: false, message: "That photograph is not attached to a dog." };
    const dog = await assertCanEditDog(user, photo.dogId);

    const list = await db
      .select({ id: photos.id, sortOrder: photos.sortOrder })
      .from(photos)
      .where(eq(photos.dogId, photo.dogId))
      .orderBy(asc(photos.sortOrder));

    const index = list.findIndex((p) => p.id === photo.id);
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || swapWith < 0 || swapWith >= list.length) return { ok: true };

    await db.transaction(async (tx) => {
      await tx.update(photos).set({ sortOrder: list[swapWith].sortOrder }).where(eq(photos.id, list[index].id));
      await tx.update(photos).set({ sortOrder: list[index].sortOrder }).where(eq(photos.id, list[swapWith].id));
    });

    revalidatePath(`/owner/dogs/${dog.id}`);
    refreshPublicPages(dog.slug);
    return { ok: true };
  });
}

export async function setMainPhotoAction(_previous: ActionResult | null, form: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const user = await requireUserForAction();
    const photo = await assertCanEditPhoto(user, String(form.get("photoId") ?? ""));
    if (!photo.dogId) return { ok: false, message: "That photograph is not attached to a dog." };
    const dog = await assertCanEditDog(user, photo.dogId);

    await db.transaction(async (tx) => {
      await tx.update(photos).set({ isMain: false }).where(eq(photos.dogId, photo.dogId!));
      await tx.update(photos).set({ isMain: true }).where(eq(photos.id, photo.id));
    });

    revalidatePath(`/owner/dogs/${dog.id}`);
    refreshPublicPages(dog.slug);
    return { ok: true, message: "That is the main photograph now." };
  });
}

export async function deletePhotoAction(_previous: ActionResult | null, form: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const user = await requireUserForAction();
    const photo = await assertCanEditPhoto(user, String(form.get("photoId") ?? ""));
    const dogId = photo.dogId;
    const dog = dogId ? await assertCanEditDog(user, dogId) : undefined;

    // A repository photograph's file is committed to the project and is not
    // ours to delete from here; only the uploaded ones own their file.
    if (photo.source === "repo") {
      return { ok: false, message: "That photograph came with the original website and cannot be removed here." };
    }

    const wasMain = await db.select({ isMain: photos.isMain }).from(photos).where(eq(photos.id, photo.id)).limit(1);

    await db.delete(photos).where(eq(photos.id, photo.id));
    if (photo.storageKey) await deletePhotoFile(photo.storageKey);

    // If the main photograph went, the first remaining one takes over, so a dog
    // is never left with photographs but no card image.
    if (wasMain[0]?.isMain && dogId) {
      const [first] = await db
        .select({ id: photos.id })
        .from(photos)
        .where(eq(photos.dogId, dogId))
        .orderBy(asc(photos.sortOrder))
        .limit(1);
      if (first) await db.update(photos).set({ isMain: true }).where(eq(photos.id, first.id));
    }

    if (dog) {
      revalidatePath(`/owner/dogs/${dog.id}`);
      refreshPublicPages(dog.slug);
    }
    return { ok: true, message: "Photograph removed." };
  });
}

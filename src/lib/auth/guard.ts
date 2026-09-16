import "server-only";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { dogs, photos } from "@/db/schema";
import { getSignedInUser, type SignedInUser } from "./session";

/**
 * The one place permission is decided.
 *
 * Every private read, every edit, every upload and every delete calls into
 * this file. Middleware is not enough on its own: it matches paths, and the
 * moment somebody adds a route that does not match the pattern, the door is
 * open. So nothing here trusts that a request got past the door. It asks
 * again, at the point where the data is actually touched.
 *
 * The question is always the same one: is this person a member of the kennel
 * that owns this row? Because the check takes the ROW and not the URL, an
 * owner cannot reach another kennel by editing an address bar, a hidden form
 * field or a request body. The id in the request is only ever used to look the
 * row up; the row's own kennelId is what decides.
 */

export const LOGIN_PATH = "/owner/login";

export class NotAllowed extends Error {
  constructor(message = "You do not have access to that.") {
    super(message);
    this.name = "NotAllowed";
  }
}

/* ---------------------------------------------------------------------------
   WHO IS ASKING
   -------------------------------------------------------------------------- */

/** For a page: send a signed-out visitor to the sign-in screen. */
export async function requireUser(returnTo?: string): Promise<SignedInUser> {
  const user = await getSignedInUser();
  if (!user) {
    redirect(returnTo ? `${LOGIN_PATH}?next=${encodeURIComponent(returnTo)}` : LOGIN_PATH);
  }
  return user;
}

/** For an action: throw rather than redirect, so the caller can answer properly. */
export async function requireUserForAction(): Promise<SignedInUser> {
  const user = await getSignedInUser();
  if (!user) throw new NotAllowed("You are signed out. Sign in again and repeat that.");
  return user;
}

export function isAdmin(user: SignedInUser): boolean {
  return user.memberships.some((m) => m.role === "admin");
}

/* ---------------------------------------------------------------------------
   WHICH KENNEL
   -------------------------------------------------------------------------- */

/**
 * Confirms this person may act on this kennel.
 *
 * An administrator may act on any kennel. Anyone else must hold a membership
 * of that exact kennel. There is no third case, and no "unless" branch.
 */
export function assertKennelAccess(user: SignedInUser, kennelId: string): void {
  if (isAdmin(user)) return;
  const member = user.memberships.some((m) => m.kennelId === kennelId);
  if (!member) throw new NotAllowed("That belongs to a different kennel.");
}

/**
 * The kennel an owner works on.
 *
 * The dashboard does not take a kennel from the URL at all: it asks who is
 * signed in and works out the answer, so there is no id to tamper with.
 */
export async function currentKennelId(user: SignedInUser): Promise<string> {
  const owned = user.memberships.find((m) => m.role === "owner") ?? user.memberships[0];
  if (!owned) throw new NotAllowed("This account is not attached to a kennel yet.");
  return owned.kennelId;
}

/* ---------------------------------------------------------------------------
   AUTHORISING A SPECIFIC ROW

   Each of these looks the row up FIRST and checks the row's own owner. Passing
   somebody else's id gets the same answer as passing one that does not exist,
   so the endpoint cannot be used to find out what exists either.
   -------------------------------------------------------------------------- */

export async function assertCanEditDog(user: SignedInUser, dogId: string): Promise<{ id: string; kennelId: string; slug: string }> {
  const [dog] = await db.select({ id: dogs.id, kennelId: dogs.kennelId, slug: dogs.slug }).from(dogs).where(eq(dogs.id, dogId)).limit(1);
  if (!dog) throw new NotAllowed("That dog does not exist, or belongs to a different kennel.");
  try {
    assertKennelAccess(user, dog.kennelId);
  } catch {
    throw new NotAllowed("That dog does not exist, or belongs to a different kennel.");
  }
  return dog;
}

export async function assertCanEditPhoto(
  user: SignedInUser,
  photoId: string,
): Promise<{ id: string; kennelId: string; dogId: string | null; storageKey: string | null; source: "repo" | "blob" }> {
  const [photo] = await db
    .select({ id: photos.id, kennelId: photos.kennelId, dogId: photos.dogId, storageKey: photos.storageKey, source: photos.source })
    .from(photos)
    .where(eq(photos.id, photoId))
    .limit(1);
  if (!photo) throw new NotAllowed("That photograph does not exist, or belongs to a different kennel.");
  try {
    assertKennelAccess(user, photo.kennelId);
  } catch {
    throw new NotAllowed("That photograph does not exist, or belongs to a different kennel.");
  }
  return photo;
}

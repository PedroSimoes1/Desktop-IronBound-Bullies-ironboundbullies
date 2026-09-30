import "server-only";

import { createHash, randomBytes, randomUUID } from "node:crypto";
import { and, desc, eq, gt, lt, sql } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { db } from "@/db/client";
import { memberships, sessions, signInAttempts, users } from "@/db/schema";
import { deployment } from "@/lib/env";
import { verifyPassword } from "./password";

/**
 * Sessions.
 *
 * The browser is given a long random token in an HTTP-only cookie. The
 * database stores only the SHA-256 of that token, so somebody who reads the
 * sessions table cannot sign in as anybody: they hold the hash, and the hash
 * is not what the cookie has to contain.
 *
 * Sessions are rows rather than self-contained tokens on purpose. Signing out,
 * disabling an account, or changing a password has to take effect NOW, not
 * whenever a token would have expired on its own.
 */

const COOKIE = "ib_session";
const SESSION_DAYS = 30;
/** Past this, the session is extended on use, so an active owner stays in. */
const REFRESH_AFTER_HOURS = 24;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export interface SignedInUser {
  id: string;
  email: string;
  name: string | null;
  /** The kennels this person may act on, and as what. */
  memberships: { kennelId: string; role: "admin" | "owner" }[];
}

/* ---------------------------------------------------------------------------
   READING THE CURRENT SESSION
   -------------------------------------------------------------------------- */

/**
 * Who is signed in, or undefined.
 *
 * Everything private in the application goes through this. It re-reads the
 * database on every call rather than trusting anything the browser sent, which
 * is the whole reason a disabled account stops working immediately.
 */
export async function getSignedInUser(): Promise<SignedInUser | undefined> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return undefined;

  const [row] = await db
    .select({
      sessionId: sessions.id,
      expiresAt: sessions.expiresAt,
      lastSeenAt: sessions.lastSeenAt,
      sessionPasswordVersion: sessions.passwordVersion,
      userId: users.id,
      email: users.email,
      name: users.name,
      disabled: users.disabled,
      passwordVersion: users.passwordVersion,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);

  if (!row) return undefined;
  // A password change invalidates every session issued before it.
  if (row.disabled || row.sessionPasswordVersion !== row.passwordVersion) {
    await db.delete(sessions).where(eq(sessions.id, row.sessionId));
    return undefined;
  }

  // Keep an active session alive without rewriting the row on every request.
  const staleAfter = Date.now() - REFRESH_AFTER_HOURS * 60 * 60 * 1000;
  if (row.lastSeenAt.getTime() < staleAfter) {
    await db
      .update(sessions)
      .set({ lastSeenAt: new Date(), expiresAt: expiryFromNow() })
      .where(eq(sessions.id, row.sessionId));
  }

  const rows = await db
    .select({ kennelId: memberships.kennelId, role: memberships.role })
    .from(memberships)
    .where(eq(memberships.userId, row.userId));

  return { id: row.userId, email: row.email, name: row.name, memberships: rows };
}

const expiryFromNow = () => new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

/* ---------------------------------------------------------------------------
   SIGNING IN
   -------------------------------------------------------------------------- */

export type SignInResult = { ok: true } | { ok: false; message: string };

/** How many failures before an email or an address is made to wait. */
const MAX_FAILURES = 8;
const WINDOW_MINUTES = 15;

async function recentFailures(column: "email" | "ip", value: string): Promise<number> {
  const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(signInAttempts)
    .where(
      and(
        eq(column === "email" ? signInAttempts.email : signInAttempts.ip, value),
        eq(signInAttempts.succeeded, false),
        gt(signInAttempts.at, since),
      ),
    );
  return row?.n ?? 0;
}

/**
 * Checks an email and password and, if they are right, starts a session.
 *
 * Every failure says the same thing. Telling somebody "no account with that
 * email" is a free way to find out which addresses are worth attacking.
 */
export async function signIn(rawEmail: string, password: string): Promise<SignInResult> {
  const email = rawEmail.trim().toLowerCase();
  const head = await headers();
  const ip = head.get("x-forwarded-for")?.split(",")[0]?.trim() || head.get("x-real-ip") || "unknown";

  const SAME_ANSWER = "That email address and password do not match an account.";

  const [byEmail, byIp] = await Promise.all([recentFailures("email", email), recentFailures("ip", ip)]);
  if (byEmail >= MAX_FAILURES || byIp >= MAX_FAILURES) {
    return { ok: false, message: `Too many attempts. Wait ${WINDOW_MINUTES} minutes and try again.` };
  }

  const record = async (succeeded: boolean) => {
    await db.insert(signInAttempts).values({ id: randomUUID(), email, ip, succeeded });
  };

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      passwordHash: users.passwordHash,
      passwordSalt: users.passwordSalt,
      passwordVersion: users.passwordVersion,
      disabled: users.disabled,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user || user.disabled) {
    // Hash anyway. Returning instantly for an unknown address is itself a
    // signal: the fast answers are the addresses that do not exist.
    await verifyPassword(password, { hash: "", salt: "" });
    await record(false);
    return { ok: false, message: SAME_ANSWER };
  }

  const correct = await verifyPassword(password, { hash: user.passwordHash, salt: user.passwordSalt });
  if (!correct) {
    await record(false);
    return { ok: false, message: SAME_ANSWER };
  }

  await record(true);
  await startSession(user.id, user.passwordVersion);
  await db.update(users).set({ lastSignInAt: new Date() }).where(eq(users.id, user.id));
  return { ok: true };
}

async function startSession(userId: string, passwordVersion: number): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const head = await headers();

  await db.insert(sessions).values({
    id: randomUUID(),
    tokenHash: hashToken(token),
    userId,
    passwordVersion,
    expiresAt: expiryFromNow(),
    userAgent: head.get("user-agent")?.slice(0, 500) ?? null,
  });

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true, // JavaScript on the page cannot read it, so a script injection cannot steal it
    secure: deployment !== "development", // never sent over plain http in production
    sameSite: "lax", // not attached to requests started by another site
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });

  // Housekeeping: drop this user's expired rows so the table cannot grow forever.
  await db.delete(sessions).where(and(eq(sessions.userId, userId), lt(sessions.expiresAt, new Date())));
}

export async function signOut(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
  jar.delete(COOKIE);
}

/** Every device this account is signed in on, for the account screen. */
export async function listSessions(userId: string) {
  return db
    .select({ id: sessions.id, createdAt: sessions.createdAt, lastSeenAt: sessions.lastSeenAt, userAgent: sessions.userAgent })
    .from(sessions)
    .where(and(eq(sessions.userId, userId), gt(sessions.expiresAt, new Date())))
    .orderBy(desc(sessions.lastSeenAt));
}

import "server-only";

import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

/** promisify loses scrypt's with-options overload, so it is declared here. */
const scrypt = promisify(scryptCallback) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

/**
 * Password hashing.
 *
 * scrypt, from Node's own crypto module. It is deliberately slow and
 * memory-hungry, which is the point: an attacker holding a stolen database
 * cannot try billions of guesses per second on a graphics card, because each
 * guess costs real memory as well as time.
 *
 * The parameters below are the OWASP recommendation for scrypt. They cost
 * roughly a tenth of a second per attempt here, which nobody notices when
 * signing in once and which makes bulk guessing hopeless.
 *
 * No dependency: adding a package to call a function that ships with Node
 * would be one more thing to keep patched for no benefit.
 */

const COST = 16384; // N: 2^14, the work factor
const BLOCK_SIZE = 8; // r
const PARALLELISM = 1; // p
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

export interface StoredPassword {
  hash: string;
  salt: string;
}

export async function hashPassword(password: string): Promise<StoredPassword> {
  const salt = randomBytes(SALT_LENGTH);
  const derived = (await scrypt(password.normalize("NFKC"), salt, KEY_LENGTH, {
    N: COST,
    r: BLOCK_SIZE,
    p: PARALLELISM,
    // scrypt needs headroom above N*r*128 bytes or Node refuses to run it.
    maxmem: 64 * 1024 * 1024,
  })) as Buffer;
  return { hash: derived.toString("base64"), salt: salt.toString("base64") };
}

/**
 * Checks a password against a stored hash.
 *
 * The comparison is timing-safe. A normal string comparison stops at the first
 * wrong byte, and the microseconds it took to stop leak how much of the hash
 * was right, which is enough to reconstruct it one byte at a time.
 */
export async function verifyPassword(password: string, stored: StoredPassword): Promise<boolean> {
  let expected: Buffer;
  try {
    expected = Buffer.from(stored.hash, "base64");
  } catch {
    return false;
  }
  if (expected.length !== KEY_LENGTH) return false;

  const derived = (await scrypt(password.normalize("NFKC"), Buffer.from(stored.salt, "base64"), KEY_LENGTH, {
    N: COST,
    r: BLOCK_SIZE,
    p: PARALLELISM,
    maxmem: 64 * 1024 * 1024,
  })) as Buffer;

  return timingSafeEqual(derived, expected);
}

/**
 * What the owner is told when a password is too weak.
 *
 * Length is what actually matters, so the rule is a floor on length rather
 * than a demand for a symbol and a digit, which mostly produces Password1!
 * and a sticky note. The blocklist catches the handful of passwords that
 * appear in every breach corpus.
 */
const OBVIOUS = new Set([
  "password",
  "password1",
  "password123",
  "12345678",
  "123456789",
  "qwertyui",
  "iloveyou",
  "letmein1",
  "ironbound",
  "ironboundbullies",
]);

export function passwordProblem(password: string): string | undefined {
  if (password.length < 12) return "Use at least 12 characters. Length matters more than symbols.";
  if (password.length > 200) return "That is longer than 200 characters.";
  if (OBVIOUS.has(password.toLowerCase().replace(/\s+/g, ""))) return "That password appears in every list attackers try. Pick another.";
  if (/^(.)\1+$/.test(password)) return "That is the same character repeated.";
  return undefined;
}

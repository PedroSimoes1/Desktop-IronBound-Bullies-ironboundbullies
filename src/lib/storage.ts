import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { storageDriver, supabaseStorage } from "@/lib/env";

/**
 * Where uploaded photographs go.
 *
 * One small interface with two drivers behind it. This is not two competing
 * implementations of the feature: it is one feature that can write to a disk
 * or to a bucket, which is the only way to develop and test an upload without
 * an account, and the only way to swap storage providers later without
 * touching the upload screen.
 *
 *   local     writes into .uploads/ and serves the file back through a route.
 *             Development only: a deployed server's filesystem is wiped
 *             between requests, so this would lose the owner's photographs.
 *             src/lib/env.ts refuses to allow it outside development.
 *   supabase  writes to a Supabase Storage bucket over its REST API. No SDK:
 *             an upload and a delete are one HTTP request each, and a
 *             dependency to build two fetch calls is not worth the weight.
 */

export interface StoredFile {
  /** The URL the site will use in an <img>. */
  url: string;
  /** The object key, which is what a delete needs. */
  key: string;
  width: number;
  height: number;
}

const MAX_BYTES = 12 * 1024 * 1024;
const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

/* ---------------------------------------------------------------------------
   READING IMAGE DIMENSIONS

   Stored on the row so a page can reserve the right space before the picture
   arrives, which is what stops the layout jumping. Parsed here rather than
   trusted from the browser, which can say anything.
   -------------------------------------------------------------------------- */

function imageSize(buf: Buffer): { width: number; height: number } | undefined {
  // JPEG: walk the markers to the start-of-frame, which carries the real size.
  if (buf.length > 4 && buf.readUInt16BE(0) === 0xffd8) {
    let offset = 2;
    while (offset < buf.length - 9) {
      if (buf[offset] !== 0xff) break;
      const marker = buf[offset + 1];
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { height: buf.readUInt16BE(offset + 5), width: buf.readUInt16BE(offset + 7) };
      }
      const length = buf.readUInt16BE(offset + 2);
      if (length < 2) break;
      offset += 2 + length;
    }
    return undefined;
  }
  // PNG: the IHDR chunk is always first and always in the same place.
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  // WebP: RIFF container, VP8/VP8L/VP8X each store the size differently.
  if (buf.length > 30 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    const kind = buf.toString("ascii", 12, 16);
    if (kind === "VP8X") return { width: (buf.readUIntLE(24, 3) & 0xffffff) + 1, height: (buf.readUIntLE(27, 3) & 0xffffff) + 1 };
    if (kind === "VP8 ") return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
    if (kind === "VP8L") {
      const bits = buf.readUInt32LE(21);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
  }
  return undefined;
}

/**
 * Checks a file is what it claims to be.
 *
 * The type the browser reports is a hint, not a fact: it is trivially changed.
 * So the bytes are read and the size is parsed from them. A file that does not
 * parse as a real image is refused, whatever it says it is, which also rules
 * out the classic trick of uploading a script named picture.jpg.
 */
export async function storePhotoFile(file: File, kennelId: string): Promise<StoredFile | { error: string }> {
  if (file.size > MAX_BYTES) {
    return { error: `That photograph is ${(file.size / 1024 / 1024).toFixed(1)}MB. The limit is ${MAX_BYTES / 1024 / 1024}MB.` };
  }
  const extension = ALLOWED.get(file.type);
  if (!extension) return { error: "Photographs must be JPEG, PNG or WebP." };

  const buf = Buffer.from(await file.arrayBuffer());
  const size = imageSize(buf);
  if (!size || size.width < 200 || size.height < 200) {
    return { error: "That file is not a photograph we can read, or it is very small. Try a JPEG straight from the camera." };
  }

  // The key never contains anything the person uploading chose. A name they
  // control is a path-traversal problem waiting to happen, and two people
  // uploading IMG_1234.jpg must not collide.
  const key = `${kennelId}/${new Date().getFullYear()}/${randomUUID()}.${extension}`;

  const stored = storageDriver() === "local" ? await writeLocal(key, buf) : await writeSupabase(key, buf, file.type);
  if ("error" in stored) return stored;
  return { ...stored, ...size };
}

export async function deletePhotoFile(key: string): Promise<void> {
  try {
    if (storageDriver() === "local") {
      await unlink(path.join(localRoot(), key));
    } else {
      const { url, serviceKey, bucket } = supabaseStorage();
      await fetch(`${url}/storage/v1/object/${bucket}/${key}`, {
        method: "DELETE",
        headers: supabaseHeaders(serviceKey),
      });
    }
  } catch (error) {
    // A file that will not delete must not stop the row from being removed:
    // an orphaned object costs pennies, a photograph the owner cannot remove
    // from the website is a real problem.
    console.error("could not delete stored photograph", key, error);
  }
}

/* ---------------------------------------------------------------------------
   DRIVERS
   -------------------------------------------------------------------------- */

const localRoot = () => path.join(process.cwd(), ".uploads");

async function writeLocal(key: string, buf: Buffer): Promise<{ url: string; key: string } | { error: string }> {
  const full = path.join(localRoot(), key);
  // Belt and braces: the key is generated, but resolve it anyway and refuse
  // anything that lands outside the uploads directory.
  if (!full.startsWith(localRoot() + path.sep)) return { error: "Refused an unsafe storage path." };
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, buf);
  return { url: `/uploads/${key}`, key };
}

/**
 * Both headers, deliberately.
 *
 * Supabase puts an API gateway in front of Storage. The gateway routes on
 * `apikey` and Storage itself authorises on `Authorization`, so sending only
 * one of them produces a 401 from whichever layer did not get what it wanted,
 * with a message that does not say which. Supabase's own client sends both.
 */
const supabaseHeaders = (serviceKey: string) => ({
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
});

async function writeSupabase(key: string, buf: Buffer, contentType: string): Promise<{ url: string; key: string } | { error: string }> {
  const { url, serviceKey, bucket } = supabaseStorage();
  const response = await fetch(`${url}/storage/v1/object/${bucket}/${key}`, {
    method: "POST",
    headers: {
      ...supabaseHeaders(serviceKey),
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
    body: new Uint8Array(buf),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("supabase storage upload failed", response.status, detail);
    if (response.status === 404) {
      return { error: `The storage bucket "${bucket}" does not exist yet. Create it in Supabase under Storage, and tick Public bucket.` };
    }
    if (response.status === 401 || response.status === 403) {
      return { error: "Storage refused the upload. SUPABASE_SERVICE_ROLE_KEY is wrong or belongs to another project." };
    }
    return { error: "The photograph could not be stored. Nothing was changed. Try again." };
  }

  // This is the URL a public bucket serves. If the bucket was made private,
  // it returns 400 and the picture silently never appears, so the bucket has
  // to be public. The objects in it are photographs meant for the website.
  return { url: `${url}/storage/v1/object/public/${bucket}/${key}`, key };
}

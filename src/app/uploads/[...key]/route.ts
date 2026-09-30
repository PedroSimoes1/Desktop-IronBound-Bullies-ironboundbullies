import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { type NextRequest } from "next/server";
import { storageDriver } from "@/lib/env";

/**
 * Serves photographs uploaded during local development.
 *
 * Only exists for the "local" storage driver. A deployment uses Supabase
 * Storage, which serves its own files from its own domain, so this route
 * refuses to do anything outside development rather than becoming a way to
 * read files off a production server.
 */

const TYPES: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

export async function GET(_request: NextRequest, { params }: { params: Promise<{ key: string[] }> }) {
  if (storageDriver() !== "local") return new Response("Not found", { status: 404 });

  const { key } = await params;
  const root = path.join(process.cwd(), ".uploads");
  const full = path.join(root, ...key);

  // The URL segments are attacker-controlled. Resolve first, then confirm the
  // result is still inside the uploads directory, so ".." cannot walk out of it.
  if (!path.resolve(full).startsWith(root + path.sep)) return new Response("Not found", { status: 404 });

  const extension = path.extname(full).toLowerCase();
  const contentType = TYPES[extension];
  if (!contentType) return new Response("Not found", { status: 404 });

  try {
    const info = await stat(full);
    if (!info.isFile()) return new Response("Not found", { status: 404 });
    const stream = createReadStream(full) as unknown as ReadableStream;
    return new Response(stream, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(info.size),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

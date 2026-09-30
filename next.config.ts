import type { NextConfig } from "next";

/**
 * Where photographs are allowed to come from.
 *
 * Photographs in the repository are imported as files and served from this
 * site, so they need no permission. Photographs the owner uploads live in a
 * Supabase bucket on a different host, and next/image refuses to optimise a
 * remote host that has not been named here. Without this the first photograph
 * the owner uploads would break the dog's page, and the error would arrive on
 * a customer's screen rather than in a build log.
 *
 * The host is read from SUPABASE_URL rather than written down, so a different
 * Supabase project needs no code change. The path is narrowed to this bucket's
 * public objects: an allowance wider than it needs to be turns our image
 * optimiser into a free one for the whole internet.
 */
function uploadedPhotoHosts(): URL[] {
  const supabase = process.env.SUPABASE_URL?.trim();
  if (!supabase) return [];
  try {
    const { protocol, hostname } = new URL(supabase);
    const bucket = process.env.SUPABASE_STORAGE_BUCKET?.trim() || "dog-photos";
    return [new URL(`${protocol}//${hostname}/storage/v1/object/public/${bucket}/**`)];
  } catch {
    // A malformed SUPABASE_URL is reported properly by src/lib/env.ts when the
    // application starts. Failing the build here would hide that message.
    return [];
  }
}

const nextConfig: NextConfig = {
  images: {
    // Serve AVIF where the browser accepts it, WebP otherwise; JPEG is the last resort.
    formats: ["image/avif", "image/webp"],
    remotePatterns: uploadedPhotoHosts(),
  },
};

export default nextConfig;

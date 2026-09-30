import type { StaticImageData } from "next/image";
import type { FocalPoint, Photo } from "@/lib/domain/photo";

import voodoo01 from "@/photos/voodoo-01.jpg";
import voodoo02 from "@/photos/voodoo-02.jpg";
import knuckles01 from "@/photos/knuckles-01.jpg";
import knuckles02 from "@/photos/knuckles-02.jpg";
import shadow01 from "@/photos/shadow-01.jpg";
import shadow02 from "@/photos/shadow-02.jpg";
import minnie01 from "@/photos/minnie-01.jpg";
import minnie02 from "@/photos/minnie-02.jpg";
import missy01 from "@/photos/missy-01.jpg";
import missy02 from "@/photos/missy-02.jpg";

/**
 * The photograph library for Stage 2.
 *
 * NO LONGER THE SOURCE OF TRUTH. The website reads these records from
 * Postgres (src/db/queries/public.ts). This file is kept for two reasons:
 * `npm run db:import` reads it to seed a fresh database, and the owner
 * prototype still uses it for demo data until the real editing screens
 * replace it. Editing it changes neither the live site nor the preview.

 *
 * Every entry is a real Ironbound Bullies photograph; identities come from the
 * name printed in the image (see docs/image-inventory.md). Focal points were
 * set by hand from the inventory and checked with crop simulations:
 *   focal          anchors wide (landscape) crops on the dog's face
 *   focalPortrait  anchors square/tall crops so the face AND the embedded
 *                  lettering both stay in frame
 *
 * Static imports give next/image the intrinsic size and a blur placeholder at
 * build time. When the admin exists, the same shape is filled from the database.
 */

function photo(
  id: string,
  image: StaticImageData,
  alt: string,
  focal: FocalPoint,
  focalPortrait: FocalPoint,
  options: { hasEmbeddedText?: boolean } = {},
): Photo {
  return {
    id,
    src: image.src,
    width: image.width,
    height: image.height,
    blurDataUrl: image.blurDataURL,
    alt,
    focal,
    focalPortrait,
    hasEmbeddedText: options.hasEmbeddedText ?? true,
  };
}

export const photos = {
  voodoo01: photo("voodoo-01", voodoo01, "Voodoo, a chocolate tri Exotic Bully, standing in profile on a mulch bed", { x: 0.3, y: 0.66 }, { x: 0.35, y: 0.62 }),
  voodoo02: photo("voodoo-02", voodoo02, "Voodoo facing the camera beside a tree at the water's edge", { x: 0.45, y: 0.58 }, { x: 0.45, y: 0.58 }),
  knuckles01: photo("knuckles-01", knuckles01, "Knuckles, a blue tri Exotic Bully, in profile in front of a pond", { x: 0.6, y: 0.68 }, { x: 0.58, y: 0.68 }),
  knuckles02: photo("knuckles-02", knuckles02, "Knuckles facing the camera on a mulch bank by the water", { x: 0.54, y: 0.6 }, { x: 0.5, y: 0.6 }),
  shadow01: photo("shadow-01", shadow01, "Shadow, a blue tri Exotic Bully, facing the camera in front of daffodils", { x: 0.47, y: 0.62 }, { x: 0.47, y: 0.62 }),
  shadow02: photo("shadow-02", shadow02, "Shadow in profile on grass with daffodils behind", { x: 0.35, y: 0.68 }, { x: 0.45, y: 0.66 }),
  minnie01: photo("minnie-01", minnie01, "Minnie, a blue tri Exotic Bully, standing on a leash by the water", { x: 0.45, y: 0.6 }, { x: 0.45, y: 0.62 }),
  // The portrait anchor sits well right of centre on purpose: the handler's
  // legs occupy the left of this frame and a square crop must start past them.
  minnie02: photo("minnie-02", minnie02, "Minnie in profile beside a tree at the lake", { x: 0.55, y: 0.56 }, { x: 0.66, y: 0.55 }),
  missy01: photo("missy-01", missy01, "Missy standing on grass, tongue out, looking at the camera", { x: 0.42, y: 0.55 }, { x: 0.45, y: 0.55 }),
  missy02: photo("missy-02", missy02, "Missy standing on grass in sunlight, looking at the camera", { x: 0.4, y: 0.52 }, { x: 0.45, y: 0.52 }),
} as const;

export type PhotoKey = keyof typeof photos;

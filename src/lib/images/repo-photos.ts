import type { StaticImageData } from "next/image";

import knuckles01 from "@/photos/knuckles-01.jpg";
import knuckles02 from "@/photos/knuckles-02.jpg";
import minnie01 from "@/photos/minnie-01.jpg";
import minnie02 from "@/photos/minnie-02.jpg";
import missy01 from "@/photos/missy-01.jpg";
import missy02 from "@/photos/missy-02.jpg";
import shadow01 from "@/photos/shadow-01.jpg";
import shadow02 from "@/photos/shadow-02.jpg";
import unidentified01 from "@/photos/unidentified-01.jpg";
import unidentified02 from "@/photos/unidentified-02.jpg";
import voodoo01 from "@/photos/voodoo-01.jpg";
import voodoo02 from "@/photos/voodoo-02.jpg";

/**
 * The photographs that live in the repository.
 *
 * These twelve files are committed, so Next can process them at build time:
 * it produces the resized variants, the AVIF and WebP versions, and the tiny
 * blurred placeholder shown while the real picture loads. None of that is
 * possible for a file the build has never seen.
 *
 * That is why the database stores an import key like "voodoo-01" for these
 * rather than a URL. The row carries what the owner can change (alt text,
 * focal point, order, which one is the main picture); this map supplies what
 * only the build can know. Photographs the owner uploads later are stored as
 * ordinary URLs instead, and the two kinds meet again in `toPhoto`.
 */
export const repoImages: Record<string, StaticImageData> = {
  "voodoo-01": voodoo01,
  "voodoo-02": voodoo02,
  "knuckles-01": knuckles01,
  "knuckles-02": knuckles02,
  "shadow-01": shadow01,
  "shadow-02": shadow02,
  "minnie-01": minnie01,
  "minnie-02": minnie02,
  "missy-01": missy01,
  "missy-02": missy02,
  "unidentified-01": unidentified01,
  "unidentified-02": unidentified02,
};

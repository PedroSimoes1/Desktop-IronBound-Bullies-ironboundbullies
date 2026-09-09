import { DEFAULT_FOCAL_POINT, type FocalPoint, type Photo } from "@/lib/domain/photo";

/**
 * Turns a focal point into a CSS `object-position` value.
 *
 * With `object-fit: cover`, the browser scales the image to fill its box and
 * then positions it. `object-position: 42% 35%` aligns the point 42 % across /
 * 35 % down the *image* with the point 42 % across / 35 % down the *box* — which
 * is exactly "keep the dog's face here when cropping".
 */
export function focalToObjectPosition(focal: FocalPoint = DEFAULT_FOCAL_POINT): string {
  return `${toPercent(focal.x)} ${toPercent(focal.y)}`;
}

/**
 * Picks the right focal point for a container shape.
 * Portrait containers (phones, tall cards) use `focalPortrait` when the photo defines one.
 */
export function focalFor(photo: Pick<Photo, "focal" | "focalPortrait">, orientation: "landscape" | "portrait"): FocalPoint {
  if (orientation === "portrait" && photo.focalPortrait) {
    return photo.focalPortrait;
  }
  return photo.focal ?? DEFAULT_FOCAL_POINT;
}

function toPercent(fraction: number): string {
  const clamped = Math.min(1, Math.max(0, fraction));
  return `${(clamped * 100).toFixed(2).replace(/\.?0+$/, "")}%`;
}

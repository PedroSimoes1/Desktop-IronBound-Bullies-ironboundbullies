/**
 * Photography model — including the focal-point system from the brief (section 8).
 *
 * A focal point is the spot in the image that must stay visible when the
 * image is cropped to fit a container. It is stored as fractions of the
 * image's width and height (0 = left/top, 1 = right/bottom), so it is
 * independent of the pixel size we happen to serve.
 *
 * Every photo has a default focal point. A photo may also define a separate
 * focal point for portrait (phone) crops, because the composition that works
 * on a wide desktop hero often needs a different anchor on a 9:19 screen.
 */

export interface FocalPoint {
  /** 0 → left edge, 1 → right edge */
  x: number;
  /** 0 → top edge, 1 → bottom edge */
  y: number;
}

export interface Photo {
  id: string;
  /** Absolute URL or /public path of the master web version. */
  src: string;
  /** Intrinsic pixel size of `src` — required so the browser can reserve space (no layout shift). */
  width: number;
  height: number;
  /** Descriptive alt text. Empty string is allowed only for purely decorative images. */
  alt: string;
  focal: FocalPoint;
  /** Optional override used when the container is taller than it is wide. */
  focalPortrait?: FocalPoint;
  /** Base64 tiny image shown while the real one loads. */
  blurDataUrl?: string;
  /** True when the photograph itself already contains the dog's name or a graphic. */
  hasEmbeddedText?: boolean;
  caption?: string;
  /** Display order inside a gallery (lower first). */
  order?: number;
}

/** Center of the image — used only when a photo has not been assigned a focal point yet. */
export const DEFAULT_FOCAL_POINT: FocalPoint = { x: 0.5, y: 0.5 };

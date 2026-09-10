#!/usr/bin/env python3
"""
Prepare web master images from the owner's original photographs.

For each entry in MANIFEST:
  * open the original (path relative to the folder passed as --source)
  * apply EXIF orientation, drop ALL metadata (privacy: no camera or location data ships)
  * downscale so the long edge is at most 2560px (enough for any screen we serve)
  * save as a progressive JPEG (quality 86) into src/photos/<slug>.jpg

next/image then generates the AVIF/WebP sizes the browser actually needs.
The originals are never modified and never committed.

Run from the repository root:

    python3 tools/photos/prepare_photos.py --source "/path/to/Pictures of Dog (09-09-2026)"

Requires: pip install pillow
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from PIL import Image, ImageOps

REPO_ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = REPO_ROOT / "src" / "photos"
MAX_LONG_EDGE = 2560
JPEG_QUALITY = 86

# original file name -> web master name. Identities come from text embedded in the
# photographs themselves (see docs/image-inventory.md). Unidentified dogs keep a
# neutral name until the owner confirms who they are.
MANIFEST: dict[str, str] = {
    "IMG_3588.JPG": "voodoo-01.jpg",
    "IMG_3589.JPG": "voodoo-02.jpg",
    "IMG_3590.JPG": "unidentified-01.jpg",
    "IMG_3591.JPG": "unidentified-02.jpg",
    "IMG_3592.JPG": "knuckles-01.jpg",
    "IMG_3593.JPG": "shadow-01.jpg",
    "IMG_3594.JPG": "missy-01.jpg",
    "IMG_3595.JPG": "minnie-01.jpg",
    "IMG_3596.JPG": "shadow-02.jpg",
    "IMG_3597.JPG": "knuckles-02.jpg",
    "IMG_3598.JPG": "minnie-02.jpg",
    "IMG_3599.JPG": "missy-02.jpg",
}


def prepare(source: Path, destination: Path) -> tuple[int, int, int]:
    with Image.open(source) as original:
        image = ImageOps.exif_transpose(original).convert("RGB")
    width, height = image.size
    long_edge = max(width, height)
    if long_edge > MAX_LONG_EDGE:
        scale = MAX_LONG_EDGE / long_edge
        image = image.resize((round(width * scale), round(height * scale)), Image.Resampling.LANCZOS)
    # No exif=, no icc_profile=: nothing but pixels is written.
    image.save(destination, "JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)
    return image.size[0], image.size[1], destination.stat().st_size


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--source", required=True, help="folder containing the original IMG_*.JPG files")
    args = parser.parse_args()

    source_dir = Path(args.source)
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    for original_name, master_name in MANIFEST.items():
        source = source_dir / original_name
        if not source.exists():
            print(f"missing   {source}", file=sys.stderr)
            return 1
        width, height, size = prepare(source, OUT_DIR / master_name)
        print(f"wrote     src/photos/{master_name}  {width}x{height}  {size // 1024} KB")
    return 0


if __name__ == "__main__":
    sys.exit(main())

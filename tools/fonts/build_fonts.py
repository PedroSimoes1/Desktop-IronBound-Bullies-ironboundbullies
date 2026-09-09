#!/usr/bin/env python3
"""
Build the self-hosted web fonts for Ironbound Bullies.

What this does
--------------
1. Downloads the variable TTF sources from the Google Fonts repository
   (both families are licensed under the SIL Open Font License 1.1).
2. Converts each TTF to WOFF2 (roughly 30 % of the TTF size).
3. Writes the .woff2 files plus the OFL license texts into src/fonts/.

The web app never talks to Google at build or run time: next/font/local
serves these files from our own domain, which is better for privacy,
performance, and reproducibility.

Run from the repository root:

    python3 tools/fonts/build_fonts.py

Requires:  pip install fonttools brotli
"""

from __future__ import annotations

import sys
import urllib.request
from pathlib import Path

from fontTools.subset import Options, Subsetter, parse_unicodes
from fontTools.ttLib import TTFont

REPO_ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = REPO_ROOT / "src" / "fonts"
GOOGLE_FONTS_RAW = "https://raw.githubusercontent.com/google/fonts/main"

# (source path in google/fonts, output file name)
FONT_SOURCES: list[tuple[str, str]] = [
    # Display face — dog names, page titles. Weights 100–900 in one file.
    ("ofl/bigshouldersdisplay/BigShouldersDisplay[wght].ttf", "big-shoulders-display-variable.woff2"),
    # Text face — everything else. Weights 100–900, upright + italic.
    ("ofl/hankengrotesk/HankenGrotesk[wght].ttf", "hanken-grotesk-variable.woff2"),
    ("ofl/hankengrotesk/HankenGrotesk-Italic[wght].ttf", "hanken-grotesk-italic-variable.woff2"),
]

LICENSES: list[tuple[str, str]] = [
    ("ofl/bigshouldersdisplay/OFL.txt", "LICENSE-big-shoulders-display.txt"),
    ("ofl/hankengrotesk/OFL.txt", "LICENSE-hanken-grotesk.txt"),
]


def fetch(path: str) -> bytes:
    url = f"{GOOGLE_FONTS_RAW}/{urllib.request.quote(path)}"
    with urllib.request.urlopen(url, timeout=60) as response:  # noqa: S310 (fixed, trusted host)
        return response.read()


# The site is English-language. Keeping Basic Latin, Latin-1 Supplement and the
# common punctuation/currency range roughly halves each file versus the full
# Google build, while still covering accented names (e.g. "Moreira", "Café").
SUBSET_UNICODES = "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2212,U+00D7"


def ttf_to_woff2(ttf_bytes: bytes, destination: Path) -> None:
    tmp = destination.with_suffix(".ttf.tmp")
    tmp.write_bytes(ttf_bytes)
    try:
        font = TTFont(tmp)
        options = Options()
        options.flavor = "woff2"
        options.layout_features = ["*"]  # keep kerning, ligatures, tabular figures, etc.
        options.name_IDs = ["*"]
        subsetter = Subsetter(options=options)
        subsetter.populate(unicodes=parse_unicodes(SUBSET_UNICODES))
        subsetter.subset(font)
        font.flavor = "woff2"
        font.save(destination)
    finally:
        tmp.unlink(missing_ok=True)


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    for source, output_name in FONT_SOURCES:
        destination = OUT_DIR / output_name
        print(f"fetching  {source}")
        ttf_to_woff2(fetch(source), destination)
        print(f"wrote     {destination.relative_to(REPO_ROOT)}  ({destination.stat().st_size // 1024} KB)")

    for source, output_name in LICENSES:
        destination = OUT_DIR / output_name
        destination.write_bytes(fetch(source))
        print(f"wrote     {destination.relative_to(REPO_ROOT)}")

    return 0


if __name__ == "__main__":
    sys.exit(main())

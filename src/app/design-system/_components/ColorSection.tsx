import { Section } from "@/components/ui/Section";
import { contrastRatio, wcagLevel } from "@/lib/color/contrast";
import { paletteSpecimens } from "../_lib/specimens";
import styles from "./sections.module.css";

const BACKGROUND = "#080808";

export function ColorSection() {
  return (
    <Section
      id="color"
      eyebrow="Color"
      title="Two colors do the work"
      lede="Black, near-black, and a warm off-white. The dogs supply the color. One amber accent for markers, hairlines, and the active state, never for surfaces. Contrast is computed against the page ground, not assumed."
      rule
    >
      <ul role="list" className={styles.swatches}>
        {paletteSpecimens.map((swatch) => {
          const ratio = contrastRatio(swatch.hex, BACKGROUND);
          return (
            <li key={swatch.token} className={styles.swatch}>
              <div className={styles.swatchChip} style={{ backgroundColor: swatch.hex }} aria-hidden="true" />
              <code className={styles.code}>{swatch.token}</code>
              <p className={["body-sm", "numeric"].join(" ")}>{swatch.hex}</p>
              <p className={["body-sm", "muted"].join(" ")}>{swatch.role}</p>
              {swatch.usedAsText && (
                <p className={["label", styles.contrast].join(" ")}>
                  {ratio.toFixed(1)} : 1 · {wcagLevel(ratio)}
                </p>
              )}
            </li>
          );
        })}
      </ul>
      <p className={["body-sm", "subtle", styles.footnote].join(" ")}>
        Ratios are shown only for colors used as text, measured against the page ground. --color-accent is drawn as a
        1px line or a 6px marker, where text contrast rules do not apply; whenever amber is used as text,
        --color-accent-fg is used instead.
      </p>
    </Section>
  );
}

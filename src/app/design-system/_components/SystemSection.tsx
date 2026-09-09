import { Section } from "@/components/ui/Section";
import { layoutSpecimens, motionSpecimens, spacingSteps } from "../_lib/specimens";
import { SpecimenTable } from "./SpecimenTable";
import styles from "./sections.module.css";

export function SpacingSection() {
  return (
    <Section
      id="spacing"
      eyebrow="07 — Spacing & layout"
      title="One rhythm, one grid"
      lede="A 4px base with eleven steps. Every section uses the same top and bottom padding; every container shares the same gutter, so headlines, cards, and footer columns sit on one left edge."
      rule
    >
      <ul role="list" className={styles.spacingList}>
        {spacingSteps.map(([token, px]) => (
          <li key={token} className={styles.spacingRow}>
            <code className={styles.code}>{token}</code>
            <span className={styles.spacingBar} style={{ width: `${px}px` }} aria-hidden="true" />
            <span className={["body-sm", "numeric", "muted"].join(" ")}>{px}px</span>
          </li>
        ))}
      </ul>
      <SpecimenTable caption="Layout tokens" headers={["Token", "Value", "Use"]} rows={layoutSpecimens} />
    </Section>
  );
}

export function MotionSection() {
  return (
    <Section
      id="motion"
      eyebrow="08 — Motion"
      title="The dogs move. The interface doesn’t."
      lede="Interface transitions run 150–250ms on a single easing curve. Only the hero photography is allowed to be slow. When a visitor's system asks for reduced motion, the hero cuts instead of drifting and nothing animates on scroll."
      rule
    >
      <SpecimenTable caption="Motion tokens" headers={["Token", "Value", "Use"]} rows={motionSpecimens} />
      <div className={styles.motionDemo}>
        <div className={styles.motionCard}>
          <span className="label">Hover me</span>
          <span className={["body-sm", "muted"].join(" ")}>250ms ease-out lift, 1px amber line</span>
        </div>
      </div>
    </Section>
  );
}

import { Section } from "@/components/ui/Section";
import { typeScale } from "../_lib/specimens";
import { SpecimenTable } from "./SpecimenTable";
import styles from "./sections.module.css";

export function TypeSection() {
  return (
    <Section
      id="typography"
      eyebrow="Typography"
      title="Two families. The name is the loudest thing on the page."
      lede="Big Shoulders Display for dog names and titles: heavy, condensed, uppercase. Hanken Grotesk for everything a person reads. Both are self-hosted variable fonts, so every weight costs nothing extra."
      rule
    >
      <div className={styles.stack}>
        <figure className={styles.specimen}>
          <p className="display-hero">Voodoo</p>
          <figcaption className={["label", "subtle"].join(" ")}>display-hero, Big Shoulders Display 900, fluid 72 to 160px</figcaption>
        </figure>

        <figure className={styles.specimen}>
          <p className="display-1">Knuckles</p>
          <figcaption className={["label", "subtle"].join(" ")}>display-1 · page titles</figcaption>
        </figure>

        <figure className={styles.specimen}>
          <p className="display-2">Available now</p>
          <figcaption className={["label", "subtle"].join(" ")}>display-2 · section titles</figcaption>
        </figure>

        <figure className={styles.specimen}>
          <p className="display-3">Shadow</p>
          <figcaption className={["label", "subtle"].join(" ")}>display-3 · card names</figcaption>
        </figure>

        <figure className={styles.specimen}>
          <p className="label">Stud · Blue Tri</p>
          <figcaption className={["label", "subtle"].join(" ")}>label · small-caps meta, 0.14em tracking</figcaption>
        </figure>

        <figure className={styles.specimen}>
          <p className="lede">
            A small kennel in Northern New Jersey focused on producing quality Exotic Bullies.
          </p>
          <figcaption className={["label", "subtle"].join(" ")}>lede · 22px, muted</figcaption>
        </figure>

        <figure className={styles.specimen}>
          <p className={["body", "prose"].join(" ")}>
            Body text is Hanken Grotesk at 16px with a 1.5 line height, held to roughly 65 characters per line so it stays
            readable on a phone in daylight and on a large monitor at night. It is the only place on the site where
            sentences run longer than one line.
          </p>
          <figcaption className={["label", "subtle"].join(" ")}>body · 16px / 1.5</figcaption>
        </figure>

        <figure className={styles.specimen}>
          <p className={["display-2", "numeric"].join(" ")}>$2,000</p>
          <p className={["label", "muted"].join(" ")}>Stud fee · $500 lock-in</p>
          <figcaption className={["label", "subtle"].join(" ")}>numeric · tabular figures for fees and measurements</figcaption>
        </figure>
      </div>

      <SpecimenTable caption="Type scale tokens" headers={["Token", "Pixels", "Use"]} rows={typeScale.map(([token, px]) => [token, px, ""])} />
    </Section>
  );
}

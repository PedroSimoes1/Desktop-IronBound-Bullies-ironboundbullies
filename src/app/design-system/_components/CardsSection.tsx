import { DogCard } from "@/components/dogs/DogCard";
import { Section } from "@/components/ui/Section";
import { specimenDogs } from "../_lib/specimens";
import styles from "./sections.module.css";

export function CardsSection() {
  return (
    <Section
      id="cards"
      eyebrow="06 — Cards"
      title="Photography first"
      lede="A 4:5 photograph, the name in display type, one line of meta, the status. No box, no shadow — on hover the image scales 2% and an amber hairline draws in. Photographs are placeholders until the image inventory assigns them."
      width="wide"
      rule
    >
      <ul role="list" className={styles.cardGrid}>
        {specimenDogs.map((dog) => (
          <li key={dog.id}>
            <DogCard dog={dog} />
          </li>
        ))}
      </ul>
      <p className={["body-sm", "subtle", styles.footnote].join(" ")}>
        Names, colors, and statuses shown here were read from the current public profile and are pending owner
        verification (audit items V4 and V7). Card links point to profile routes that are built in a later stage.
      </p>
    </Section>
  );
}

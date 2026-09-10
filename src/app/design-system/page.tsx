import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { CardsSection } from "./_components/CardsSection";
import { ColorSection } from "./_components/ColorSection";
import { ButtonsSection, FormsSection, StatusSection } from "./_components/ControlsSection";
import { MotionSection, SpacingSection } from "./_components/SystemSection";
import { TypeSection } from "./_components/TypeSection";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Design system",
  description: "Living style sheet for Ironbound Bullies 2.0: Concept B, Iron.",
  // Internal reference page: never indexed, in any environment.
  robots: { index: false, follow: false },
};

const SECTIONS = [
  ["#color", "Color"],
  ["#typography", "Typography"],
  ["#buttons", "Buttons"],
  ["#status", "Status"],
  ["#forms", "Forms"],
  ["#cards", "Cards"],
  ["#spacing", "Spacing"],
  ["#motion", "Motion"],
] as const;

/**
 * The living style sheet. Every token, control, and treatment on the site,
 * rendered by the real components — so what is approved here is what ships.
 */
export default function DesignSystemPage() {
  return (
    <>
      <header className={styles.hero}>
        <Container width="standard">
          <p className={["label", styles.eyebrow].join(" ")}>Ironbound Bullies 2.0 · Stage 1</p>
          <h1 className="display-1">Design system</h1>
          <p className={["lede", styles.lede].join(" ")}>
            Concept B, “Iron”. Black ground, heavy condensed type, one amber accent, and an interface that stays out of
            the photography’s way. Everything below is built from the same tokens the site uses.
          </p>
          <nav aria-label="On this page" className={styles.toc}>
            <ul role="list" className={styles.tocList}>
              {SECTIONS.map(([href, label]) => (
                <li key={href}>
                  <a href={href} className={["label", styles.tocLink].join(" ")}>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </Container>
      </header>

      <ColorSection />
      <TypeSection />
      <ButtonsSection />
      <StatusSection />
      <FormsSection />
      <CardsSection />
      <SpacingSection />
      <MotionSection />
    </>
  );
}

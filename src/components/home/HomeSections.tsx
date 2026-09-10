import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { site } from "@/lib/site";
import styles from "./HomeSections.module.css";

/**
 * The quieter homepage sections. Copy is the kennel's own statement from the
 * current public profile (VERIFY V9); nothing is invented.
 */

export function AboutTeaser() {
  return (
    <section className={styles.about} aria-labelledby="about-heading">
      <Container width="standard">
        <div className={styles.aboutInner}>
          <h2 id="about-heading" className="display-2">
            A small kennel in Northern New Jersey
          </h2>
          <p className="lede">{site.description}</p>
          <div className={styles.aboutActions}>
            <Button href="/dogs" variant="secondary">
              Our dogs
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}

export function ContactBand() {
  return (
    <section className={styles.contact} aria-labelledby="contact-heading">
      <Container width="standard">
        <div className={styles.contactInner}>
          <div className={styles.contactCopy}>
            <h2 id="contact-heading" className="display-2">
              Ask about a dog
            </h2>
            <p className={["body-lg", "muted"].join(" ")}>Tell us which dog, stud, or breeding you have in mind and how you prefer to be reached.</p>
          </div>
          <div className={styles.contactActions}>
            <Button href="/contact">Inquire</Button>
            <Button href="/available" variant="secondary">
              Available dogs
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}

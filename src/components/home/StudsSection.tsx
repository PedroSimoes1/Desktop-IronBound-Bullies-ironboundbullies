import { DogCard } from "@/components/dogs/DogCard";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { formatMoney, type Dog } from "@/lib/domain/dog";
import styles from "./StudsSection.module.css";

/**
 * The studs: the kennel's three headline dogs and the terms they stand at.
 *
 * Composition is a deliberate two-to-one stagger, never three equal cards. The
 * lead frame is twice the width of the supporting pair, the supporting column
 * starts lower, and the terms block fills the space beneath the lead, so both
 * columns finish within a few pixels of each other at any desktop width.
 *
 * Fees come from the current public profile and are identical for all three
 * studs (VERIFY V7), so they are stated once for the section rather than
 * repeated on every card.
 */

interface StudsSectionProps {
  dogs: Dog[];
  studFee?: number;
  lockInFee?: number;
}

export function StudsSection({ dogs, studFee, lockInFee }: StudsSectionProps) {
  const [lead, ...rest] = dogs;
  if (!lead) return null;
  const supporting = rest.slice(0, 2);

  return (
    <section className={styles.section} aria-labelledby="studs-heading">
      <Container width="wide">
        <h2 id="studs-heading" className={["display-2", styles.title].join(" ")}>
          The studs
        </h2>

        <div className={styles.grid}>
          <div className={styles.lead}>
            <DogCard dog={lead} size="large" headingLevel="h3" sizes="(min-width: 1024px) 55vw, 100vw" />
          </div>

          <div className={styles.support}>
            {supporting.map((dog) => (
              <DogCard key={dog.id} dog={dog} headingLevel="h3" sizes="(min-width: 1024px) 28vw, 50vw" />
            ))}
          </div>

          {studFee !== undefined && (
            <div className={styles.terms}>
              <p className={["display-2", "numeric", styles.fee].join(" ")}>{formatMoney(studFee)}</p>
              <p className={["label", styles.feeLabel].join(" ")}>
                Stud fee{lockInFee !== undefined ? ` · ${formatMoney(lockInFee)} lock-in` : ""}
              </p>
              <p className={["body", "muted", styles.feeNote].join(" ")}>The same terms for all three.</p>
              <div className={styles.termsAction}>
                <Button href="/contact?type=stud">Stud service</Button>
              </div>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}

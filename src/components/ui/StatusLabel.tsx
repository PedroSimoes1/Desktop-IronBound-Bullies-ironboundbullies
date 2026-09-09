import { ACTIVE_DOG_STATUSES, DOG_STATUS_LABELS, type DogStatus } from "@/lib/domain/dog";
import { BREEDING_STATUS_LABELS, type BreedingStatus } from "@/lib/domain/breeding";
import styles from "./StatusLabel.module.css";

/**
 * Status is a word, not a badge (design-system §STATUS).
 * A 6px square marker precedes small-caps text. The marker is amber for a
 * live opportunity (Available, Stud available, Upcoming) and muted otherwise.
 */

type StatusLabelProps =
  | { kind?: "dog"; status: DogStatus; className?: string }
  | { kind: "breeding"; status: BreedingStatus; className?: string };

export function StatusLabel(props: StatusLabelProps) {
  const isBreeding = props.kind === "breeding";
  const label = isBreeding ? BREEDING_STATUS_LABELS[props.status] : DOG_STATUS_LABELS[props.status];
  const active = isBreeding
    ? props.status !== "completed"
    : ACTIVE_DOG_STATUSES.has(props.status);
  const struck = !isBreeding && props.status === "sold";

  return (
    <span
      className={[styles.status, "label", active ? styles.active : "", struck ? styles.struck : "", props.className ?? ""]
        .filter(Boolean)
        .join(" ")}
    >
      <span className={styles.marker} aria-hidden="true" />
      {label}
    </span>
  );
}

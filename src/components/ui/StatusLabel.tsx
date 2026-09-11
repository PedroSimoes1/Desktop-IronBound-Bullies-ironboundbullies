import { ACTIVE_DOG_STATUSES, DOG_STATUS_LABELS, type DogStatus } from "@/lib/domain/dog";
import { BREEDING_STATUS_LABELS, type BreedingStatus } from "@/lib/domain/breeding";
import styles from "./StatusLabel.module.css";

/**
 * Status is a word, not a badge (design-system §STATUS).
 *
 * Small-caps text only. A live opportunity (Available, Stud available,
 * Upcoming) is set in amber; everything else is muted. The word itself always
 * carries the meaning, so colour is reinforcement and never the only signal.
 * There is no coloured dot: a marker in front of every status is the single
 * most common decoration tell, and the type is stronger without it.
 */

type StatusLabelProps =
  | { kind?: "dog"; status: DogStatus; className?: string }
  | { kind: "breeding"; status: BreedingStatus; className?: string };

export function StatusLabel(props: StatusLabelProps) {
  const isBreeding = props.kind === "breeding";
  const label = isBreeding ? BREEDING_STATUS_LABELS[props.status] : DOG_STATUS_LABELS[props.status];
  const active = isBreeding ? props.status !== "completed" : ACTIVE_DOG_STATUSES.has(props.status);

  return (
    <span className={[styles.status, "label", active ? styles.active : "", props.className ?? ""].filter(Boolean).join(" ")}>
      {label}
    </span>
  );
}

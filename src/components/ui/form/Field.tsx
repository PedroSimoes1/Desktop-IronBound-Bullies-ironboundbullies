import { useId, type ReactNode } from "react";
import styles from "./Field.module.css";

/**
 * Wraps a form control with an always-visible label, optional hint, and
 * error message — wired together with aria-describedby so screen readers
 * announce them. Placeholders are never used as labels.
 *
 * Usage:
 *   <Field label="Email" required error={errors.email}>
 *     {(ids) => <Input type="email" name="email" {...ids} />}
 *   </Field>
 */

export interface FieldControlIds {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
  required?: boolean;
}

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: (ids: FieldControlIds) => ReactNode;
}

export function Field({ label, hint, error, required, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={[styles.field, error ? styles.hasError : ""].filter(Boolean).join(" ")}>
      <label htmlFor={id} className={["label", styles.label].join(" ")}>
        {label}
        {required ? (
          <span className={styles.required} aria-hidden="true">
            {" "}
            *
          </span>
        ) : (
          <span className={styles.optional}> · optional</span>
        )}
      </label>
      {children({
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
        required,
      })}
      {error && (
        <p id={errorId} className={["body-sm", styles.error].join(" ")} role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className={["body-sm", styles.hint].join(" ")}>
          {hint}
        </p>
      )}
    </div>
  );
}

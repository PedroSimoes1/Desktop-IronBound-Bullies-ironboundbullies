import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import styles from "./controls.module.css";

/**
 * Native form controls styled by the system. They stay native on purpose:
 * phones get their own keyboards and pickers, screen readers get real
 * semantics, and nothing needs JavaScript to work.
 */

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={[styles.control, className ?? ""].filter(Boolean).join(" ")} {...props} />;
}

export function Textarea({ className, rows = 5, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={rows} className={[styles.control, styles.textarea, className ?? ""].filter(Boolean).join(" ")} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className={styles.selectWrap}>
      <select className={[styles.control, styles.select, className ?? ""].filter(Boolean).join(" ")} {...props}>
        {children}
      </select>
      <span className={styles.chevron} aria-hidden="true" />
    </span>
  );
}

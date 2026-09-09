import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.css";

/**
 * The site has exactly three button treatments (design-system §BUTTONS):
 *
 *  primary    filled — the single most important action in a view
 *  secondary  outlined — the supporting action beside a primary
 *  text       an underlined link that behaves like a button
 *
 * Rule of the system: never two primaries in one view.
 * Pass `href` to render a link that looks like a button; otherwise a real <button>.
 */

type Variant = "primary" | "secondary" | "text";
type Size = "default" | "compact";

interface CommonProps {
  variant?: Variant;
  size?: Size;
  /** Stretch to the container width — used for forms on phones. */
  fullWidth?: boolean;
  children: ReactNode;
  className?: string;
}

type LinkButtonProps = CommonProps & {
  href: string;
  /** Opens in a new tab with the right rel attributes. */
  external?: boolean;
  onClick?: never;
  type?: never;
  disabled?: never;
};

type NativeButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
    href?: never;
    external?: never;
  };

export type ButtonProps = LinkButtonProps | NativeButtonProps;

function classes({ variant = "primary", size = "default", fullWidth, className }: CommonProps): string {
  return [styles.button, styles[variant], size === "compact" ? styles.compact : "", fullWidth ? styles.fullWidth : "", className ?? ""]
    .filter(Boolean)
    .join(" ");
}

export function Button(props: ButtonProps) {
  if ("href" in props && props.href !== undefined) {
    const { href, external, variant, size, fullWidth, className, children } = props;
    const cls = classes({ variant, size, fullWidth, className, children });
    if (external) {
      return (
        <a href={href} className={cls} target="_blank" rel="noopener noreferrer">
          <span className={styles.label}>{children}</span>
        </a>
      );
    }
    return (
      <Link href={href} className={cls}>
        <span className={styles.label}>{children}</span>
      </Link>
    );
  }

  const { variant, size, fullWidth, className, children, type = "button", ...rest } = props as NativeButtonProps;
  return (
    <button type={type} className={classes({ variant, size, fullWidth, className, children })} {...rest}>
      <span className={styles.label}>{children}</span>
    </button>
  );
}

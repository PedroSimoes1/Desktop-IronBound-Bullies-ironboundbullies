import type { ElementType, ReactNode } from "react";
import styles from "./Container.module.css";

/**
 * Horizontal layout container (design-system §LAYOUT).
 *
 *  text      72ch  — prose
 *  standard  1280  — default content
 *  wide      1600  — card grids, gallery
 *  full      —     — edge to edge, still padded by the gutter
 *
 * Every container shares the same gutter, so headings, cards, and footer
 * columns line up on the same left edge at every breakpoint.
 */

interface ContainerProps {
  width?: "text" | "standard" | "wide" | "full";
  as?: ElementType;
  className?: string;
  children: ReactNode;
}

export function Container({ width = "standard", as: Tag = "div", className, children }: ContainerProps) {
  return <Tag className={[styles.container, styles[width], className ?? ""].filter(Boolean).join(" ")}>{children}</Tag>;
}

"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Decides whether a page gets the public header and footer.
 *
 * The owner area is a different surface from the website: it has its own bar
 * and its own navigation, and showing the visitor menu above it would invite
 * the owner to tap "Inquire" on his own kennel. The header and footer are
 * passed in as already-rendered server components, so nothing about them moves
 * to the browser just because this decision happens there.
 *
 * The <main> landmark is opened here rather than in the layout, because the
 * owner area has to open its own: its bar and its tabs are page furniture, and
 * a <header> or <nav> nested inside <main> stops being a landmark a screen
 * reader can jump to.
 */
export function SiteChrome({
  header,
  footer,
  mainClassName,
  children,
}: {
  header: ReactNode;
  footer: ReactNode;
  mainClassName: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isOwnerArea = pathname === "/owner" || pathname.startsWith("/owner/");

  if (isOwnerArea) return <>{children}</>;

  return (
    <>
      {header}
      <main id="main" className={mainClassName}>
        {children}
      </main>
      {footer}
    </>
  );
}

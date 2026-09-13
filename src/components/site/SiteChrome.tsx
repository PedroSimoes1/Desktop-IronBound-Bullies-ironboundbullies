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
 */
export function SiteChrome({ header, footer, children }: { header: ReactNode; footer: ReactNode; children: ReactNode }) {
  const pathname = usePathname();
  const isOwnerArea = pathname === "/owner" || pathname.startsWith("/owner/");

  return (
    <>
      {!isOwnerArea && header}
      {children}
      {!isOwnerArea && footer}
    </>
  );
}

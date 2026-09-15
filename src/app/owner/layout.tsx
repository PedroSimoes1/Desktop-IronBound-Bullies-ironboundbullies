import type { Metadata } from "next";
import { OwnerShell } from "@/components/owner/OwnerShell";

/**
 * The owner area.
 *
 * This layout does NOT check the session. It cannot: the sign-in page lives
 * underneath it, and a layout that redirected everyone without a session would
 * redirect people away from the page they go to in order to get one.
 *
 * The check happens one level down, in the pages themselves, through
 * requireUser(). That is also the safer place for it: a check in a layout
 * protects whatever happens to sit under it today, while a check in the page
 * protects that page wherever it moves to.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function OwnerLayout({ children }: LayoutProps<"/owner">) {
  return <OwnerShell>{children}</OwnerShell>;
}

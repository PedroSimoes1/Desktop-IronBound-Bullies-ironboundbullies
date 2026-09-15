import Link from "next/link";
import type { ReactNode } from "react";
import { signOutAction } from "@/app/owner/actions";
import { getSignedInUser } from "@/lib/auth/session";
import { site } from "@/lib/site";
import { OwnerNav } from "./OwnerNav";
import styles from "./OwnerApp.module.css";

/**
 * The frame every owner screen sits in.
 *
 * A server component, so the top bar knows whether anybody is signed in
 * without shipping that decision to the browser. The sign-in screen renders
 * bare: no bar, no tabs, nothing to press until there is an account behind it.
 */
export async function OwnerShell({ children }: { children: ReactNode }) {
  const user = await getSignedInUser();

  if (!user) {
    return (
      <div className={styles.app}>
        <main id="main" className={styles.screen}>
          {children}
        </main>
      </div>
    );
  }

  return (
    <div data-owner-app className={styles.app}>
      <header className={styles.bar}>
        <Link href="/owner" className={styles.brand}>
          <span className={styles.brandName}>{site.wordmark.primary}</span>
          <span className={styles.brandRole}>Owner</span>
        </Link>
        <form action={signOutAction}>
          <button type="submit" className={["body-sm", styles.signOut].join(" ")}>
            Sign out
          </button>
        </form>
      </header>

      {/* The skip link at the top of the document lands here, past the bar and
          before the tabs, which is the only useful place for it. */}
      <main id="main" className={styles.screen}>
        {children}
      </main>

      <OwnerNav />
    </div>
  );
}

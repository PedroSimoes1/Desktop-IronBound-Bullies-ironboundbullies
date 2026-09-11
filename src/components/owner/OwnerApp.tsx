"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/form/Field";
import { Input } from "@/components/ui/form/controls";
import { OwnerStoreProvider, useOwnerStore } from "@/lib/owner/store";
import { site } from "@/lib/site";
import styles from "./OwnerApp.module.css";

/**
 * The shell every owner screen sits in: a slim bar at the top, the screen, and
 * a thumb-reachable bar at the bottom. Built for a phone held in one hand and
 * widened, not redesigned, for a laptop.
 */

const NAV = [
  { href: "/owner", label: "Today" },
  { href: "/owner/dogs", label: "Dogs" },
  { href: "/owner/litters", label: "Litters" },
  { href: "/owner/inquiries", label: "Inquiries" },
];

export function OwnerApp({ children }: { children: ReactNode }) {
  return (
    <OwnerStoreProvider>
      <Shell>{children}</Shell>
    </OwnerStoreProvider>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const { signedIn } = useOwnerStore();
  return (
    <div data-owner-app className={styles.app}>
      <PrototypeNotice />
      {signedIn ? (
        <>
          <TopBar />
          <div className={styles.screen}>{children}</div>
          <BottomNav />
        </>
      ) : (
        <SignIn />
      )}
    </div>
  );
}

/** Impossible to miss, on every screen, for as long as this is a prototype. */
function PrototypeNotice() {
  const { failNextSave, setFailNextSave, signedIn } = useOwnerStore();
  return (
    <div className={styles.notice}>
      <p className={["body-sm", styles.noticeText].join(" ")}>
        <strong className={styles.noticeStrong}>Prototype.</strong> Nothing is saved and nothing reaches the public website.
      </p>
      {signedIn && (
        <label className={["body-sm", styles.failToggle].join(" ")}>
          <input type="checkbox" checked={failNextSave} onChange={(event) => setFailNextSave(event.target.checked)} />
          Make the next save fail
        </label>
      )}
    </div>
  );
}

function TopBar() {
  const { signOut } = useOwnerStore();
  return (
    <header className={styles.bar}>
      <p className={styles.brand}>
        <span className={styles.brandName}>{site.wordmark.primary}</span>
        <span className={styles.brandRole}>Owner</span>
      </p>
      <button type="button" className={["body-sm", styles.signOut].join(" ")} onClick={signOut}>
        Sign out
      </button>
    </header>
  );
}

function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className={styles.nav} aria-label="Owner sections">
      <ul role="list" className={styles.navList}>
        {NAV.map((item) => {
          const current = item.href === "/owner" ? pathname === "/owner" : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link href={item.href} className={styles.navLink} aria-current={current ? "page" : undefined}>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * The sign-in screen, shown so its layout can be judged.
 *
 * The fields are deliberately disabled. A form that looks like a login but
 * checks nothing is a good way to have someone type a real password into a
 * prototype, so this one does not accept one. What the real screen will ask
 * for is described in the implementation plan.
 */
function SignIn() {
  const { signIn } = useOwnerStore();
  return (
    <div className={styles.signIn}>
      <div className={styles.signInInner}>
        <p className={styles.signInBrand}>
          <span className={styles.brandName}>{site.wordmark.primary}</span>
          <span className={styles.brandRole}>Owner</span>
        </p>
        <h1 className={["display-2", styles.signInTitle].join(" ")}>Sign in</h1>
        <p className={["body", "muted", styles.signInLede].join(" ")}>
          The finished version asks for your email address and password, and can send a code to your phone as a second step.
        </p>

        <div className={styles.signInForm}>
          <Field label="Email" requirement="none">{(ids) => <Input {...ids} type="email" autoComplete="off" disabled value="" readOnly />}</Field>
          <Field label="Password" requirement="none" hint="Disabled on purpose. This prototype cannot check a password, so it does not ask for one.">
            {(ids) => <Input {...ids} type="password" autoComplete="off" disabled value="" readOnly />}
          </Field>
        </div>

        <Button fullWidth onClick={signIn}>
          Sign in
        </Button>
      </div>
    </div>
  );
}

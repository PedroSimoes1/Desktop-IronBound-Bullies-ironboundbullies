import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSignedInUser } from "@/lib/auth/session";
import { site } from "@/lib/site";
import { SignInForm } from "./SignInForm";
import styles from "./login.module.css";

/**
 * The owner sign-in screen.
 *
 * Never indexed, and its title says nothing about what is behind it.
 */
export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function OwnerLoginPage({ searchParams }: PageProps<"/owner/login">) {
  // Already signed in? Then this page has nothing to offer.
  const user = await getSignedInUser();
  if (user) redirect("/owner");

  const params = await searchParams;
  const next = typeof params.next === "string" && params.next.startsWith("/owner") ? params.next : "/owner";

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <p className={styles.brand}>
          <span className={styles.brandName}>{site.wordmark.primary}</span>
          <span className={styles.brandRole}>Owner</span>
        </p>
        <h1 className={["display-2", styles.title].join(" ")}>Sign in</h1>
        <SignInForm next={next} />
      </div>
    </div>
  );
}

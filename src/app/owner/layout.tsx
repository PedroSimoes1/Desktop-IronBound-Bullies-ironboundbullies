import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OwnerApp } from "@/components/owner/OwnerApp";
import { isProduction } from "@/lib/site";

/**
 * The owner area, as a design prototype.
 *
 * Two deliberate guards while this is only a prototype:
 *
 *  1. It does not exist on the live website. If VERCEL_ENV is production this
 *     route returns 404, so a demo dashboard can never appear on the real
 *     domain even by accident.
 *  2. It is never indexed, on any deployment.
 *
 * Neither of these is access control and neither is pretending to be. Nothing
 * here reads or writes a record, so there is nothing yet to protect; the real
 * protection is described in the implementation plan and has to exist before a
 * single real field is saved.
 */

/**
 * On the live site this route is a 404, and a 404 should not announce what it
 * is hiding. Setting a static title meant the production 404 page still came
 * back titled "Owner · Ironbound Bullies", which tells anyone who tries the
 * path that there is an owner area there. Only the deployments where the
 * prototype actually renders name the page.
 */
export function generateMetadata(): Metadata {
  if (isProduction) return { robots: { index: false, follow: false } };
  return { title: "Owner", robots: { index: false, follow: false } };
}

export default function OwnerLayout({ children }: LayoutProps<"/owner">) {
  if (isProduction) notFound();
  return <OwnerApp>{children}</OwnerApp>;
}

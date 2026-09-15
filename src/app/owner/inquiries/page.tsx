import { Note, Panel, ScreenTitle } from "@/components/owner/ui";
import { db } from "@/db/client";
import { inquiries } from "@/db/schema";
import { requireUser } from "@/lib/auth/guard";
import { desc } from "drizzle-orm";

/**
 * The inbox.
 *
 * The contact form does not send anywhere yet, so this is genuinely empty
 * rather than filled with examples. When the form is connected, the rows
 * appear here; the customer's contact details live in their own table and are
 * joined only on this screen.
 */
export const dynamic = "force-dynamic";

export default async function OwnerInquiriesPage() {
  await requireUser("/owner/inquiries");
  const rows = await db.select({ id: inquiries.id }).from(inquiries).orderBy(desc(inquiries.createdAt)).limit(1);

  return (
    <>
      <ScreenTitle title="Inquiries" lede="People asking about a dog." />
      <Panel>
        <Note tone="attention">
          Your website is not collecting inquiries yet. The form on the contact page cannot be sent, so nothing arrives here. Until it is
          connected, customers reach you by phone or Instagram.
        </Note>
        {rows.length === 0 && <p className="body">Nothing in the inbox.</p>}
      </Panel>
    </>
  );
}

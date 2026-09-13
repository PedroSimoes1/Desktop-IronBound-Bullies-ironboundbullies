"use client";

import { Note, Panel, PrivateMark, ScreenTitle } from "@/components/owner/ui";
import { INQUIRY_STATE_LABELS, type InquiryState } from "@/lib/owner/demo";
import { useOwnerStore } from "@/lib/owner/store";
import styles from "./inquiries.module.css";

/**
 * Inquiries.
 *
 * The truth first: the form on the website is not connected, so no inquiry has
 * ever reached anywhere. The examples below exist so the list, the follow-up
 * states and the private notes can be judged, and every one of them is labelled
 * as an example. None of these people exist.
 */

const STATES: InquiryState[] = ["new", "replied", "closed"];

function formatReceived(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function OwnerInquiriesPage() {
  const { inquiries, setInquiryState } = useOwnerStore();

  return (
    <>
      <ScreenTitle title="Inquiries" lede="People asking about a dog." />

      <Panel>
        <Note tone="attention">
          Your website is not collecting inquiries yet. The form on the contact page cannot be sent, so nothing arrives here. Until it is
          connected, customers reach you by phone or Instagram, and this inbox stays empty.
        </Note>
      </Panel>

      <p className={["label", styles.exampleHeading].join(" ")}>Examples, so you can see the design</p>

      <ul role="list" className={styles.list}>
        {inquiries.map((inquiry) => (
          <li key={inquiry.id} className={styles.item}>
            <div className={styles.itemHead}>
              <p className={styles.name}>{inquiry.name}</p>
              <p className={["body-sm", styles.received].join(" ")}>{formatReceived(inquiry.receivedAt)}</p>
            </div>

            <p className={["body-sm", styles.about].join(" ")}>About {inquiry.about}</p>
            <p className={["body", styles.message].join(" ")}>{inquiry.message}</p>

            <div className={styles.contact}>
              <span className={["body-sm", styles.contactItem].join(" ")}>{inquiry.email}</span>
              {inquiry.phone && <span className={["body-sm", styles.contactItem].join(" ")}>{inquiry.phone}</span>}
            </div>

            <div className={styles.states} role="group" aria-label={`Follow-up for ${inquiry.name}`}>
              {STATES.map((state) => (
                <button
                  key={state}
                  type="button"
                  className={["label", styles.state].join(" ")}
                  aria-pressed={inquiry.state === state}
                  onClick={() => setInquiryState(inquiry.id, state)}
                >
                  {INQUIRY_STATE_LABELS[state]}
                </button>
              ))}
            </div>

            <div className={styles.notes}>
              <PrivateMark />
              <p className={["body-sm", styles.notesHint].join(" ")}>
                A note field sits here for what you want to remember about this person. It is yours, not theirs.
              </p>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

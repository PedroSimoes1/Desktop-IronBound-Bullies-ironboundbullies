import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Field } from "@/components/ui/form/Field";
import { Input, Select, Textarea } from "@/components/ui/form/controls";
import { breedings, parentsOf } from "@/content/breedings";
import { dogs, getDogBySlug } from "@/content/dogs";
import { CONTACT_METHOD_LABELS, INQUIRY_TYPE_LABELS, type InquiryType } from "@/lib/domain/inquiry";
import { pairingTitle } from "@/lib/domain/format";
import { contact, isProduction } from "@/lib/site";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Inquire",
  description: "Ask Ironbound Bullies about a dog, a stud, or an upcoming breeding.",
  alternates: { canonical: "/contact" },
};

const INQUIRY_TYPES = Object.keys(INQUIRY_TYPE_LABELS) as InquiryType[];

function inquiryTypeFromParam(value: string | undefined, fallback: InquiryType): InquiryType {
  if (!value) return fallback;
  if (value === "stud") return "stud_service";
  if (value === "breeding") return "existing_breeding";
  return INQUIRY_TYPES.includes(value as InquiryType) ? (value as InquiryType) : fallback;
}

/**
 * Inquiry page (brief section 17).
 *
 * The form already knows where the visitor came from: /contact?dog=voodoo
 * preselects Voodoo, and ?type=stud opens on Stud service. The direct channels
 * are always on the page, so a visitor who would rather call or send a message
 * on Instagram never has to hunt for them.
 *
 * Delivery (server validation, spam protection, the owner's inbox) is Stage 4.
 * Until then the form is shown for review and cannot be submitted, and the live
 * site shows the direct channels alone rather than a form that goes nowhere.
 */
export default async function ContactPage({ searchParams }: PageProps<"/contact">) {
  const { dog: dogParam, type: typeParam, breeding: breedingParam } = await searchParams;
  const preselected = typeof dogParam === "string" ? getDogBySlug(dogParam) : undefined;
  const defaultType = inquiryTypeFromParam(
    typeof typeParam === "string" ? typeParam : undefined,
    preselected?.role === "stud" ? "stud_service" : "general",
  );
  const preselectedBreeding = typeof breedingParam === "string" ? breedings.find((item) => item.slug === breedingParam) : undefined;
  const subject = preselected?.slug ?? preselectedBreeding?.slug ?? "";

  const heading = preselected
    ? `Inquire about ${preselected.name}`
    : preselectedBreeding
      ? "Inquire about a breeding"
      : "Inquire";

  return (
    <div className={styles.page}>
      <Container width="wide">
        <header className={styles.header}>
          <h1 className="display-1">{heading}</h1>
          <p className={["lede", styles.lede].join(" ")}>
            Tell us which dog, stud, or breeding you have in mind and how you prefer to be reached.
          </p>
        </header>

        <div className={styles.layout}>
          <div className={styles.formColumn}>
            {isProduction ? (
              <p className={["body-lg", "muted", styles.holding].join(" ")}>
                The inquiry form is being connected. In the meantime the fastest way to reach the kennel is by phone or Instagram.
              </p>
            ) : (
              <div className={styles.form} role="group" aria-label="Inquiry form (preview, not yet connected)">
                <Field label="Name" required>
                  {(ids) => <Input {...ids} name="name" autoComplete="name" />}
                </Field>
                <Field label="Email" required>
                  {(ids) => <Input {...ids} type="email" name="email" autoComplete="email" inputMode="email" />}
                </Field>
                <Field label="Phone" hint="Only needed if you prefer a call or a text.">
                  {(ids) => <Input {...ids} type="tel" name="phone" autoComplete="tel" inputMode="tel" />}
                </Field>
                <Field label="Preferred contact" required>
                  {(ids) => (
                    <Select {...ids} name="preferredContact" defaultValue="email">
                      {Object.entries(CONTACT_METHOD_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field label="Inquiry type" required>
                  {(ids) => (
                    <Select {...ids} name="type" defaultValue={defaultType}>
                      {Object.entries(INQUIRY_TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field label="Dog or breeding">
                  {(ids) => (
                    <Select {...ids} name="subject" defaultValue={subject}>
                      <option value="">Not about a specific dog</option>
                      <optgroup label="Dogs">
                        {dogs.map((dog) => (
                          <option key={dog.id} value={dog.slug}>
                            {dog.name}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Breedings">
                        {breedings.map((breeding) => {
                          const parents = parentsOf(breeding);
                          if (!parents) return null;
                          return (
                            <option key={breeding.id} value={breeding.slug}>
                              {pairingTitle(parents.sireName, parents.damName)}
                            </option>
                          );
                        })}
                      </optgroup>
                    </Select>
                  )}
                </Field>
                <div className={styles.full}>
                  <Field label="Message" required>
                    {(ids) => <Textarea {...ids} name="message" />}
                  </Field>
                </div>
                <div className={styles.full}>
                  <Button type="button" disabled>
                    Send inquiry
                  </Button>
                  <p className={["body-sm", "subtle", styles.note].join(" ")}>Preview only: sending is connected in the next stage.</p>
                </div>
              </div>
            )}
          </div>

          <aside className={styles.direct} aria-labelledby="direct-heading">
            <h2 id="direct-heading" className={["display-3", styles.directTitle].join(" ")}>
              Reach the kennel
            </h2>
            <ul role="list" className={styles.directList}>
              <li>
                <span className={["label", styles.directLabel].join(" ")}>Phone</span>
                <a href={contact.phone.href} className={["body-lg", styles.directLink].join(" ")}>
                  {contact.phone.display}
                </a>
              </li>
              <li>
                <span className={["label", styles.directLabel].join(" ")}>Email</span>
                <a href={contact.email.href} className={["body-lg", styles.directLink].join(" ")}>
                  {contact.email.display}
                </a>
              </li>
              <li>
                <span className={["label", styles.directLabel].join(" ")}>Instagram</span>
                <a href={contact.instagram.href} className={["body-lg", styles.directLink].join(" ")} target="_blank" rel="noopener noreferrer">
                  {contact.instagram.display}
                </a>
              </li>
            </ul>
          </aside>
        </div>
      </Container>
    </div>
  );
}

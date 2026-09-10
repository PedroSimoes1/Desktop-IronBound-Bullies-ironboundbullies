import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Field } from "@/components/ui/form/Field";
import { Input, Select, Textarea } from "@/components/ui/form/controls";
import { dogs, getDogBySlug } from "@/content/dogs";
import { CONTACT_METHOD_LABELS, INQUIRY_TYPE_LABELS, type InquiryType } from "@/lib/domain/inquiry";
import { isProduction } from "@/lib/site";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Inquire",
  description: "Ask Ironbound Bullies about a dog, a stud, or an upcoming breeding.",
  alternates: { canonical: "/contact" },
};

/**
 * Inquiry page (brief section 17). The form already knows which dog the
 * visitor came from (?dog=voodoo). Delivery (validation, spam protection,
 * the owner's inbox) is wired in the next stage; until then the form is shown
 * for review only and cannot be submitted, and production shows a holding
 * message rather than a form that goes nowhere.
 */
export default async function ContactPage({ searchParams }: PageProps<"/contact">) {
  const { dog: dogParam } = await searchParams;
  const preselected = typeof dogParam === "string" ? getDogBySlug(dogParam) : undefined;
  const defaultType: InquiryType = preselected?.role === "stud" ? "stud_service" : "general";

  return (
    <section className={styles.section}>
      <Container width="standard">
        <header className={styles.header}>
          <h1 className="display-1">{preselected ? `Inquire about ${preselected.name}` : "Inquire"}</h1>
          <p className={["lede", styles.lede].join(" ")}>Tell us which dog, stud, or breeding you have in mind and how you prefer to be reached.</p>
        </header>

        {isProduction ? (
          <p className={["body-lg", "muted"].join(" ")}>Contact details are being finalized. Please check back shortly.</p>
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
            <Field label="Dog or breeding">
              {(ids) => (
                <Select {...ids} name="dog" defaultValue={preselected?.slug ?? ""}>
                  <option value="">Not about a specific dog</option>
                  {dogs.map((dog) => (
                    <option key={dog.id} value={dog.slug}>
                      {dog.name}
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
            <div className={styles.full}>
              <Field label="Message" required>
                {(ids) => <Textarea {...ids} name="message" />}
              </Field>
            </div>
            <div className={styles.full}>
              <Button type="button" fullWidth disabled>
                Send inquiry
              </Button>
              <p className={["body-sm", "subtle", styles.note].join(" ")}>Preview only: sending is connected in the next stage.</p>
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}

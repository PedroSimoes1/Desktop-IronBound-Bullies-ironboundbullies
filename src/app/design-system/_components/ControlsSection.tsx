import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { Field } from "@/components/ui/form/Field";
import { Input, Select, Textarea } from "@/components/ui/form/controls";
import { BREEDING_STATUS_ORDER } from "@/lib/domain/breeding";
import { DOG_STATUS_LABELS, type DogStatus } from "@/lib/domain/dog";
import { INQUIRY_TYPE_LABELS } from "@/lib/domain/inquiry";
import styles from "./sections.module.css";

const DOG_STATUSES = Object.keys(DOG_STATUS_LABELS) as DogStatus[];

export function ButtonsSection() {
  return (
    <Section
      id="buttons"
      eyebrow="03 — Buttons & links"
      title="Three buttons, and only three"
      lede="A filled primary, an outlined secondary, and a text link that draws its underline. Never two primaries in one view. Hover inverts; nothing glows."
      rule
    >
      <div className={styles.row}>
        <Button>Inquire about Voodoo</Button>
        <Button variant="secondary">View pedigree</Button>
        <Button variant="text">All studs</Button>
      </div>
      <div className={styles.row}>
        <Button size="compact">Available</Button>
        <Button variant="secondary" size="compact">
          Contact
        </Button>
        <Button disabled>Reserved</Button>
      </div>
      <div className={styles.narrow}>
        <Button fullWidth>Send inquiry</Button>
        <p className={["body-sm", "subtle"].join(" ")}>Full-width variant — forms on phones.</p>
      </div>
    </Section>
  );
}

export function StatusSection() {
  return (
    <Section
      id="status"
      eyebrow="04 — Status"
      title="A word, not a badge"
      lede="Small-caps text with a 6px square marker. Amber marks a live opportunity; everything else is quiet. Sold is struck through on the price, not shouted in red. Specimen only — not live data."
      rule
    >
      <div className={styles.split}>
        <div>
          <h3 className={["label", "subtle", styles.subheading].join(" ")}>Dogs</h3>
          <ul role="list" className={styles.statusList}>
            {DOG_STATUSES.map((status) => (
              <li key={status}>
                <StatusLabel status={status} />
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className={["label", "subtle", styles.subheading].join(" ")}>Breedings</h3>
          <ul role="list" className={styles.statusList}>
            {BREEDING_STATUS_ORDER.map((status) => (
              <li key={status}>
                <StatusLabel kind="breeding" status={status} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}

export function FormsSection() {
  return (
    <Section
      id="forms"
      eyebrow="05 — Forms"
      title="Native controls, visible labels"
      lede="48px tall, 16px text so iPhones don’t zoom, labels always visible, errors announced. One column on phones, two at most on desktop. This is the inquiry form's vocabulary."
      rule
    >
      {/* A group, not a <form>: this specimen must never submit anywhere. */}
      <div className={styles.formGrid} role="group" aria-label="Specimen form (does not submit)">
        <Field label="Name" required>
          {(ids) => <Input {...ids} name="name" autoComplete="name" />}
        </Field>
        <Field label="Email" required error="Enter an email address like name@example.com">
          {(ids) => <Input {...ids} type="email" name="email" autoComplete="email" defaultValue="pedro@" />}
        </Field>
        <Field label="Phone" hint="Used only if you choose phone or text as your preferred contact.">
          {(ids) => <Input {...ids} type="tel" name="phone" autoComplete="tel" inputMode="tel" />}
        </Field>
        <Field label="Inquiry type" required>
          {(ids) => (
            <Select {...ids} name="type" defaultValue="stud_service">
              {Object.entries(INQUIRY_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <div className={styles.formFull}>
          <Field label="Message" required>
            {(ids) => <Textarea {...ids} name="message" />}
          </Field>
        </div>
        <div className={styles.formFull}>
          <Button type="button" fullWidth>
            Send inquiry
          </Button>
        </div>
      </div>
    </Section>
  );
}

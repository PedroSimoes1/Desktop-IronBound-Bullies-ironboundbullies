"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { discardDraftAction, publishAction, saveDraftAction, type ActionResult } from "@/app/owner/actions";
import { DogPhoto } from "@/components/dogs/DogPhoto";
import { PreviewSheet } from "@/components/owner/PreviewSheet";
import { PrivateMark } from "@/components/owner/ui";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/form/Field";
import { Input, Textarea } from "@/components/ui/form/controls";
import type { OwnerDogDetail } from "@/db/queries/owner";
import { DOG_STATUS_LABELS, type DogStatus } from "@/lib/domain/dog";
import styles from "./edit.module.css";

/**
 * The edit form.
 *
 * Client-side so it can show what has changed before anything is sent, warn
 * before an unsaved change is thrown away, and keep what was typed when a save
 * fails. The saving itself is a Server Action: this component never writes
 * anything, it only collects.
 */

const SUMMARY_LIMIT = 180;

const CHOICES: { value: DogStatus; help: string }[] = [
  { value: "available", help: "Shown on the Available dogs page." },
  { value: "reserved", help: "Listed, marked as taken." },
  { value: "sold", help: "Listed, marked as sold." },
  { value: "upcoming", help: "Coming soon, not yet ready." },
  { value: "stud_available", help: "Standing at stud." },
  { value: "not_for_sale", help: "Part of the program, not offered." },
  { value: "retired", help: "No longer breeding." },
];

const moneyToInput = (cents: number | null | undefined) => (cents === null || cents === undefined ? "" : String(cents / 100));

function PendingLabel({ idle, busy }: { idle: string; busy: string }) {
  const { pending } = useFormStatus();
  return <>{pending ? busy : idle}</>;
}

function SubmitButton({ idle, busy, disabled }: { idle: string; busy: string; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={disabled || pending}>
      <PendingLabel idle={idle} busy={busy} />
    </Button>
  );
}

/** Everything on this form that can be edited, as plain values. */
function valuesOf(source: OwnerDogDetail["effective"], notes: string, isStud: boolean) {
  return {
    status: (source.status ?? "") as DogStatus | "",
    summary: source.summary ?? "",
    money: moneyToInput(isStud ? source.studFeeCents : source.priceCents),
    contactForPrice: Boolean(source.contactForPrice),
    notes,
  };
}

export function EditDogForm({ dog }: { dog: OwnerDogDetail }) {
  const isStud = dog.role === "stud";
  const [previewOpen, setPreviewOpen] = useState(false);

  // What is in the form right now, starting from what Publish would make live.
  const start = valuesOf(dog.effective, dog.privateNotes, isStud);
  const [status, setStatus] = useState<DogStatus | "">(start.status);
  const [summary, setSummary] = useState(start.summary);
  const [money, setMoney] = useState(start.money);
  const [contactForPrice, setContactForPrice] = useState(start.contactForPrice);
  const [notes, setNotes] = useState(start.notes);

  /**
   * What was last saved, and whether an unpublished edit exists.
   *
   * Both are held in state rather than read back from the server between
   * presses. A Server Action does not reliably re-render this page with fresh
   * props, and the answer to "is there anything to publish" has to be right the
   * instant Save finishes, or the owner saves and then has nothing to press.
   */
  const [saved, setSaved] = useState(start);
  const [draftExists, setDraftExists] = useState(dog.draft !== null);

  const [saveState, saveAction] = useActionState<ActionResult | null, FormData>(async (previous, form) => {
    const result = await saveDraftAction(previous, form);
    if (result.ok) {
      // What was sent is now what is saved, taken from the submission itself.
      setSaved({
        status: String(form.get("status") ?? "") as DogStatus | "",
        summary: String(form.get("summary") ?? ""),
        money: String(form.get("money") ?? ""),
        contactForPrice: form.get("contactForPrice") !== null,
        notes: String(form.get("privateNotes") ?? ""),
      });
      setDraftExists(result.draftExists ?? true);
    }
    return result;
  }, null);

  const [publishState, publishSubmit] = useActionState<ActionResult | null, FormData>(async (previous, form) => {
    const result = await publishAction(previous, form);
    if (result.ok) setDraftExists(false);
    return result;
  }, null);

  const [discardState, discardSubmit] = useActionState<ActionResult | null, FormData>(async (previous, form) => {
    const result = await discardDraftAction(previous, form);
    if (result.ok) {
      // Throwing the draft away puts the form back to what the website shows,
      // rather than leaving the discarded words sitting in the boxes.
      const published = valuesOf(dog.published, notes, isStud);
      setStatus(published.status);
      setSummary(published.summary);
      setMoney(published.money);
      setContactForPrice(published.contactForPrice);
      setSaved(published);
      setDraftExists(false);
    }
    return result;
  }, null);

  const dirty =
    status !== saved.status ||
    summary !== saved.summary ||
    money !== saved.money ||
    contactForPrice !== saved.contactForPrice ||
    notes !== saved.notes;

  // Closing the tab mid-edit should ask first.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // The same photograph the public cards use: the one marked main, else the
  // first. Undefined when there are none, and the header shows the logo.
  const mainPhoto = dog.photos.find((p) => p.isMain) ?? dog.photos[0];
  const summaryOver = summary.length > SUMMARY_LIMIT;
  const moneyInvalid = money.trim() !== "" && !/^\$?\d{1,7}(,\d{3})*(\.\d{1,2})?$/.test(money.trim());
  const hasDraft = draftExists;
  const result = saveState ?? publishState ?? discardState;

  return (
    <>
      <header className={styles.head}>
        <div className={styles.headPhoto}>
          <DogPhoto photo={mainPhoto} dogName={dog.name} alt="" sizes="96px" className={styles.headImage} />
        </div>
        <div className={styles.headText}>
          <h1 className={["display-2", styles.headName].join(" ")}>{dog.name}</h1>
          <p className={["body-sm", styles.headMeta].join(" ")}>
            {[isStud ? "Stud" : dog.role === "female" ? "Female" : undefined, dog.color].filter(Boolean).join(" · ") || "No details yet"}
          </p>
          <p className={["body-sm", hasDraft || dirty ? styles.statePending : styles.stateLive].join(" ")}>
            {dirty ? "Unsaved changes" : hasDraft ? "Edited, not published" : "Live on the website"}
          </p>
        </div>
      </header>

      <form action={saveAction} id="edit-dog">
        <input type="hidden" name="dogId" value={dog.id} />
        <input type="hidden" name="isStud" value={String(isStud)} />

        <section className={styles.panel}>
          <h2 className={["label", styles.panelTitle].join(" ")}>Availability</h2>
          <fieldset className={styles.choices}>
            <legend className="sr-only">Availability for {dog.name}</legend>
            {CHOICES.map((choice) => {
              const checked = status === choice.value;
              return (
                <label key={choice.value} className={styles.choice}>
                  <input
                    type="radio"
                    name="status"
                    value={choice.value}
                    checked={checked}
                    onChange={() => setStatus(choice.value)}
                    className={styles.radio}
                    aria-describedby={checked ? `help-${choice.value}` : undefined}
                  />
                  <span className={styles.choiceBody}>
                    <span className={styles.choiceLabel}>{DOG_STATUS_LABELS[choice.value]}</span>
                    {checked && (
                      <span id={`help-${choice.value}`} className={["body-sm", styles.choiceHelp].join(" ")}>
                        {choice.help}
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
          </fieldset>
          {dog.published.status && (
            <p className={["body-sm", styles.currently].join(" ")}>
              The website is showing: <strong>{DOG_STATUS_LABELS[dog.published.status]}</strong>
            </p>
          )}
        </section>

        <section className={styles.panel}>
          <h2 className={["label", styles.panelTitle].join(" ")}>What the website says</h2>
          <Field
            requirement="none"
            label="Short description"
            hint={`${summary.length} of ${SUMMARY_LIMIT} characters. This appears under the name on the dog's page.`}
            error={summaryOver ? `Too long by ${summary.length - SUMMARY_LIMIT} characters. Shorten it before publishing.` : undefined}
          >
            {(ids) => <Textarea {...ids} name="summary" rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} />}
          </Field>

          <div className={styles.money}>
            <Field
              requirement="none"
              label={isStud ? "Stud fee" : "Price"}
              hint={isStud ? "In US dollars. Leave empty to show no fee." : "In US dollars. Leave empty to show no price."}
              error={moneyInvalid ? "Use numbers only, for example 2000 or 2000.50" : undefined}
            >
              {(ids) => (
                <Input {...ids} name="money" type="text" inputMode="decimal" value={money} onChange={(e) => setMoney(e.target.value)} />
              )}
            </Field>
            {!isStud && (
              <label className={["body", styles.checkbox].join(" ")}>
                <input
                  type="checkbox"
                  name="contactForPrice"
                  checked={contactForPrice}
                  onChange={(e) => setContactForPrice(e.target.checked)}
                />
                Show &ldquo;Contact for pricing&rdquo; instead of a number
              </label>
            )}
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.privateHead}>
            <PrivateMark />
            <p className={["body-sm", styles.privateHint].join(" ")}>Only you can see this. It never appears on the website.</p>
          </div>
          <Field requirement="none" label={`Notes about ${dog.name}`}>
            {(ids) => (
              <Textarea
                {...ids}
                name="privateNotes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Vet dates, who asked about him, anything you want to remember."
              />
            )}
          </Field>
        </section>
      </form>

      {result && (
        <div className={result.ok ? styles.saved : styles.failedBox} role="status">
          <p className="body-sm">{result.message}</p>
        </div>
      )}

      {(dirty || hasDraft) && (
        <div className={styles.actionBar} role="region" aria-label="Unpublished changes">
          <div className={styles.actionBarInner}>
            <div className={styles.actionStatus}>
              <p className={["body-sm", styles.actionHint].join(" ")}>
                {summaryOver || moneyInvalid ? "Fix the highlighted field first." : dirty ? "Not saved yet." : "Saved, not published."}
              </p>
            </div>
            <div className={styles.actionButtons}>
              {hasDraft && !dirty && (
                <form action={discardSubmit}>
                  <input type="hidden" name="dogId" value={dog.id} />
                  <Button type="submit" variant="text">
                    Discard
                  </Button>
                </form>
              )}
              <Button variant="secondary" onClick={() => setPreviewOpen(true)}>
                Preview
              </Button>
              {dirty ? (
                /* The bar sits outside the form, so the button reaches it by id. */
                <Button type="submit" form="edit-dog" disabled={summaryOver || moneyInvalid}>
                  Save
                </Button>
              ) : (
                <form action={publishSubmit}>
                  <input type="hidden" name="dogId" value={dog.id} />
                  <SubmitButton idle="Publish" busy="Publishing" />
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      <PreviewSheet
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        name={dog.name}
        slug={dog.slug}
        status={status || undefined}
        summary={summary}
        photo={mainPhoto}
        meta={[isStud ? "Stud" : dog.role === "female" ? "Female" : undefined, dog.color].filter(Boolean).join(" · ")}
      />
    </>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { PreviewSheet } from "@/components/owner/PreviewSheet";
import { Note, Panel, PrivateMark } from "@/components/owner/ui";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/form/Field";
import { Input, Textarea } from "@/components/ui/form/controls";
import { DOG_STATUS_LABELS, type DogStatus } from "@/lib/domain/dog";
import { focalFor, focalToObjectPosition } from "@/lib/images/focal";
import { AVAILABILITY_CHOICES, effectiveFields, hasChanges } from "@/lib/owner/demo";
import { useOwnerStore } from "@/lib/owner/store";
import styles from "./edit.module.css";

/**
 * Edit a dog.
 *
 * The screen is ordered by how often the owner needs each thing: availability
 * first, because that is what changes when a dog is reserved or sold; then the
 * words the website shows; then photographs; then his own notes, which the
 * website never sees.
 *
 * Nothing here writes to the website. Edits go into a draft, and the bar at the
 * bottom of the screen appears the moment there is something unpublished. The
 * owner can look at it, publish it, or throw it away, and until he publishes
 * the public site is exactly as it was.
 */

const SUMMARY_LIMIT = 180;

type Saving = "idle" | "saving" | "saved" | "failed";

/** Dollars typed by a human into whole cents, or null when it is not a number. */
function parseMoney(input: string): number | null | undefined {
  const trimmed = input.trim().replace(/^\$/, "").replace(/,/g, "");
  if (trimmed === "") return undefined; // cleared on purpose
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null; // not a number
  return Math.round(Number(trimmed) * 100);
}

function moneyToInput(cents: number | undefined): string {
  if (cents === undefined) return "";
  return String(cents / 100);
}

export default function OwnerEditDogPage() {
  const params = useParams<{ id: string }>();
  const { dogs, editDog, setPrivateNotes, discardDraft, publishDog } = useOwnerStore();
  const dog = dogs.find((item) => item.id === params.id);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [saving, setSaving] = useState<Saving>("idle");
  const [moneyText, setMoneyText] = useState<string | null>(null);
  const [moneyError, setMoneyError] = useState<string | undefined>(undefined);

  if (!dog) {
    return (
      <>
        <Link href="/owner/dogs" className={["body-sm", styles.back].join(" ")}>
          Dogs
        </Link>
        <Panel>
          <Note>That dog is not in the list. It may have been removed since this screen was opened.</Note>
        </Panel>
      </>
    );
  }

  const fields = effectiveFields(dog);
  const pending = hasChanges(dog);
  const isStud = dog.role === "stud";
  const summary = fields.summary ?? "";
  const summaryOver = summary.length > SUMMARY_LIMIT;
  const moneyValue = moneyText ?? moneyToInput(isStud ? fields.studFee : fields.price);
  const canPublish = pending && !summaryOver && !moneyError;

  const onAvailability = (status: DogStatus) => {
    setSaving("idle");
    editDog(dog.id, { status });
  };

  const onMoney = (raw: string) => {
    setMoneyText(raw);
    setSaving("idle");
    const parsed = parseMoney(raw);
    if (parsed === null) {
      setMoneyError("Use numbers only, for example 2000 or 2000.50");
      return;
    }
    setMoneyError(undefined);
    editDog(dog.id, isStud ? { studFee: parsed } : { price: parsed });
  };

  const onPublish = async () => {
    setSaving("saving");
    const ok = await publishDog(dog.id);
    setSaving(ok ? "saved" : "failed");
  };

  return (
    <>
      <Link href="/owner/dogs" className={["body-sm", styles.back].join(" ")}>
        Dogs
      </Link>

      <header className={styles.head}>
        <div className={styles.headPhoto}>
          {dog.photo ? (
            <Image
              src={dog.photo.src}
              alt=""
              fill
              sizes="96px"
              placeholder={dog.photo.blurDataUrl ? "blur" : "empty"}
              blurDataURL={dog.photo.blurDataUrl}
              className={styles.headImage}
              style={{ objectPosition: focalToObjectPosition(focalFor(dog.photo, "portrait")) }}
            />
          ) : (
            <span className={["label", styles.headEmpty].join(" ")}>No photo</span>
          )}
        </div>
        <div className={styles.headText}>
          <h1 className={["display-2", styles.headName].join(" ")}>{dog.name}</h1>
          <p className={["body-sm", styles.headMeta].join(" ")}>
            {[dog.role === "stud" ? "Stud" : dog.role === "female" ? "Female" : undefined, dog.color].filter(Boolean).join(" · ") ||
              "No details yet"}
          </p>
          <p className={["body-sm", pending ? styles.statePending : styles.stateLive].join(" ")}>
            {pending ? "Edited, not published" : "Live on the website"}
          </p>
        </div>
      </header>

      <Panel title="Availability">
        <fieldset className={styles.choices}>
          <legend className="sr-only">Availability for {dog.name}</legend>
          {/* The explanation belongs to the choice you have made. Printing all
              seven at once turns a quick tap into 590px of reading on a phone. */}
          {AVAILABILITY_CHOICES.map((choice) => {
            const checked = fields.status === choice.value;
            return (
              <label key={choice.value} className={styles.choice}>
                <input
                  type="radio"
                  name="availability"
                  value={choice.value}
                  checked={checked}
                  onChange={() => onAvailability(choice.value)}
                  className={styles.radio}
                  aria-describedby={checked ? `availability-help-${choice.value}` : undefined}
                />
                <span className={styles.choiceBody}>
                  <span className={styles.choiceLabel}>{choice.label}</span>
                  {checked && (
                    <span id={`availability-help-${choice.value}`} className={["body-sm", styles.choiceHelp].join(" ")}>
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
      </Panel>

      <Panel title="What the website says">
        <Field
          requirement="none"
          label="Short description"
          hint={`${summary.length} of ${SUMMARY_LIMIT} characters. This appears under the name on the dog's page.`}
          error={summaryOver ? `Too long by ${summary.length - SUMMARY_LIMIT} characters. Shorten it before publishing.` : undefined}
        >
          {(ids) => (
            <Textarea
              {...ids}
              rows={3}
              value={summary}
              onChange={(event) => {
                setSaving("idle");
                editDog(dog.id, { summary: event.target.value });
              }}
            />
          )}
        </Field>

        <div className={styles.money}>
          <Field
            requirement="none"
            label={isStud ? "Stud fee" : "Price"}
            hint={isStud ? "In dollars. Leave empty to show no fee." : "In dollars. Leave empty to show no price."}
            error={moneyError}
          >
            {(ids) => (
              <Input {...ids} type="text" inputMode="decimal" value={moneyValue} onChange={(event) => onMoney(event.target.value)} />
            )}
          </Field>
          {!isStud && (
            <label className={["body", styles.checkbox].join(" ")}>
              <input
                type="checkbox"
                checked={Boolean(fields.contactForPrice)}
                onChange={(event) => {
                  setSaving("idle");
                  editDog(dog.id, { contactForPrice: event.target.checked });
                }}
              />
              Show &ldquo;Contact for pricing&rdquo; instead of a number
            </label>
          )}
        </div>
      </Panel>

      <Panel title="Photographs">
        <p className={["body", styles.photoCount].join(" ")}>
          {dog.photoCount === 0
            ? "No photographs yet."
            : `${dog.photoCount} photograph${dog.photoCount === 1 ? "" : "s"}. The first one is used on the cards.`}
        </p>
        <Note>
          Adding photographs from your phone needs the picture storage described in the plan, so it is switched off in this prototype.
        </Note>
        <div className={styles.photoAction}>
          <Button variant="secondary" disabled>
            Add a photograph
          </Button>
        </div>
      </Panel>

      <Panel title="Your notes">
        <div className={styles.privateHead}>
          <PrivateMark />
          <p className={["body-sm", styles.privateHint].join(" ")}>Only you can see this. It never appears on the website.</p>
        </div>
        <Field label={`Notes about ${dog.name}`} requirement="none">
          {(ids) => (
            <Textarea
              {...ids}
              rows={3}
              value={dog.privateNotes}
              placeholder="Vet dates, who asked about him, anything you want to remember."
              onChange={(event) => setPrivateNotes(dog.id, event.target.value)}
            />
          )}
        </Field>
      </Panel>

      {/* The action bar only exists when there is something unpublished. */}
      {pending && (
        <div className={styles.actionBar} role="region" aria-label="Unpublished changes">
          <div className={styles.actionBarInner}>
            <div className={styles.actionStatus}>
              {saving === "failed" ? (
                <p className={["body-sm", styles.failed].join(" ")}>
                  Could not publish. Nothing was lost, your changes are still here. Try again.
                </p>
              ) : (
                <p className={["body-sm", styles.actionHint].join(" ")}>
                  {summaryOver || moneyError ? "Fix the highlighted field before publishing." : "Not published yet."}
                </p>
              )}
            </div>
            <div className={styles.actionButtons}>
              <Button variant="text" onClick={() => discardDraft(dog.id)}>
                Discard
              </Button>
              <Button variant="secondary" onClick={() => setPreviewOpen(true)}>
                Preview
              </Button>
              <Button onClick={onPublish} disabled={!canPublish || saving === "saving"}>
                {saving === "saving" ? "Publishing" : "Publish"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {saving === "saved" && !pending && (
        <div className={styles.saved} role="status">
          <p className="body-sm">
            Published in the prototype. On the finished version {dog.name} would now read{" "}
            <strong>{fields.status ? DOG_STATUS_LABELS[fields.status] : "no availability"}</strong> on the website. Your real website is
            unchanged.
          </p>
        </div>
      )}

      <PreviewSheet dog={dog} open={previewOpen} onClose={() => setPreviewOpen(false)} />
    </>
  );
}

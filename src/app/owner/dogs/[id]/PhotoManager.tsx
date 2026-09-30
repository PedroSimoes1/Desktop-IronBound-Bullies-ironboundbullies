"use client";

import Image from "next/image";
import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  deletePhotoAction,
  reorderPhotoAction,
  setMainPhotoAction,
  uploadPhotoAction,
  type ActionResult,
} from "@/app/owner/actions";
import { Note } from "@/components/owner/ui";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/form/Field";
import { Input } from "@/components/ui/form/controls";
import type { Photo } from "@/lib/domain/photo";
import { focalFor, focalToObjectPosition } from "@/lib/images/focal";
import styles from "./photos.module.css";

/**
 * Adding, ordering and removing photographs.
 *
 * The file input accepts images only and asks for the camera roll rather than
 * a file browser, which is what iPhone Safari and Android Chrome both want in
 * order to offer "Take Photo" and the gallery in one sheet.
 *
 * Reordering is two buttons rather than drag and drop. Dragging a thumbnail
 * with a thumb, on a scrolling page, is a fight; arrows are unambiguous, work
 * with a keyboard, and are announced properly by a screen reader.
 */

type ManagedPhoto = Photo & { isMain: boolean; source: "repo" | "blob" };

function Pending({ idle, busy }: { idle: string; busy: string }) {
  const { pending } = useFormStatus();
  return <>{pending ? busy : idle}</>;
}

export function PhotoManager({ dogId, photos }: { dogId: string; photos: ManagedPhoto[] }) {
  const [uploadState, upload] = useActionState<ActionResult | null, FormData>(uploadPhotoAction, null);
  const [rowState, rowAction] = useActionState<ActionResult | null, FormData>(
    async (_prev: ActionResult | null, form: FormData) => {
      const intent = String(form.get("intent"));
      if (intent === "reorder") return reorderPhotoAction(null, form);
      if (intent === "main") return setMainPhotoAction(null, form);
      if (intent === "delete") return deletePhotoAction(null, form);
      return { ok: false, message: "Unknown action." };
    },
    null,
  );
  const [fileName, setFileName] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const state = uploadState ?? rowState;

  return (
    <div className={styles.manager}>
      {photos.length === 0 ? (
        <Note>No photographs yet. The first one you add becomes the picture used on cards.</Note>
      ) : (
        <ul role="list" className={styles.grid}>
          {photos.map((photo, index) => (
            <li key={photo.id} className={styles.item}>
              <div className={styles.frame}>
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="160px"
                  placeholder={photo.blurDataUrl ? "blur" : "empty"}
                  blurDataURL={photo.blurDataUrl}
                  className={styles.image}
                  style={{ objectPosition: focalToObjectPosition(focalFor(photo, "portrait")) }}
                />
                {photo.isMain && <span className={["label", styles.mainFlag].join(" ")}>Main</span>}
              </div>

              <form action={rowAction} className={styles.controls}>
                <input type="hidden" name="photoId" value={photo.id} />

                <div className={styles.order}>
                  <button
                    type="submit"
                    name="intent"
                    value="reorder"
                    className={styles.control}
                    disabled={index === 0}
                    aria-label={`Move ${photo.alt} earlier`}
                    onClick={(e) => {
                      (e.currentTarget.form?.elements.namedItem("direction") as HTMLInputElement).value = "up";
                    }}
                  >
                    <span aria-hidden="true">&uarr;</span>
                  </button>
                  <button
                    type="submit"
                    name="intent"
                    value="reorder"
                    className={styles.control}
                    disabled={index === photos.length - 1}
                    aria-label={`Move ${photo.alt} later`}
                    onClick={(e) => {
                      (e.currentTarget.form?.elements.namedItem("direction") as HTMLInputElement).value = "down";
                    }}
                  >
                    <span aria-hidden="true">&darr;</span>
                  </button>
                  <input type="hidden" name="direction" defaultValue="up" />
                </div>

                {!photo.isMain && (
                  <button type="submit" name="intent" value="main" className={["body-sm", styles.textControl].join(" ")}>
                    Make main
                  </button>
                )}

                {photo.source === "blob" && (
                  <button
                    type="submit"
                    name="intent"
                    value="delete"
                    className={["body-sm", styles.textControl, styles.remove].join(" ")}
                  >
                    Remove
                  </button>
                )}
              </form>
            </li>
          ))}
        </ul>
      )}

      <form
        ref={formRef}
        action={(formData) => {
          upload(formData);
          formRef.current?.reset();
          setFileName("");
        }}
        className={styles.upload}
      >
        <input type="hidden" name="dogId" value={dogId} />

        <label className={styles.chooser}>
          <input
            type="file"
            name="file"
            /* The camera roll, not a file browser. Both phone browsers offer
               "Take Photo" and the library from one sheet when asked this way. */
            accept="image/jpeg,image/png,image/webp"
            className={styles.fileInput}
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
            required
          />
          <span className={styles.chooserLabel}>{fileName || "Choose a photograph"}</span>
        </label>

        <Field
          requirement="none"
          label="Describe it"
          hint="A few words. Someone using a screen reader hears this instead of seeing the picture."
        >
          {(ids) => <Input {...ids} name="alt" type="text" placeholder="Voodoo in profile on the grass" required minLength={4} />}
        </Field>

        <Button type="submit" variant="secondary">
          <Pending idle="Add photograph" busy="Uploading" />
        </Button>
      </form>

      {state && (
        <p className={["body-sm", state.ok ? styles.ok : styles.error].join(" ")} role="status">
          {state.message}
        </p>
      )}
    </div>
  );
}

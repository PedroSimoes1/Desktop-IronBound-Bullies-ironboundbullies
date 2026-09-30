"use client";

import { useEffect, useRef } from "react";
import { DogPhoto } from "@/components/dogs/DogPhoto";
import { Button } from "@/components/ui/Button";
import { StatusLabel } from "@/components/ui/StatusLabel";
import type { DogStatus } from "@/lib/domain/dog";
import type { Photo } from "@/lib/domain/photo";
import styles from "./PreviewSheet.module.css";

/**
 * What the dog will look like once this is published.
 *
 * Built from the same StatusLabel the public site uses, fed the values
 * currently in the form, so this is the real thing rather than a drawing of it.
 *
 * A native <dialog> opened with showModal(), which brings the focus trap,
 * Escape to close, the rest of the page made inert, and focus returned where
 * it came from, all without a line of code for any of it.
 */
interface PreviewSheetProps {
  open: boolean;
  onClose: () => void;
  name: string;
  slug: string;
  status?: DogStatus;
  summary: string;
  meta: string;
  photo?: Photo;
}

export function PreviewSheet({ open, onClose, name, slug, status, summary, meta, photo }: PreviewSheetProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={ref} className={styles.sheet} onClose={onClose} aria-label={`Preview of ${name}`}>
      <div className={styles.bar}>
        <span className={["label", styles.barTitle].join(" ")}>Preview</span>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Back to editing">
          <span className={styles.closeIcon} aria-hidden="true" />
        </button>
      </div>

      <div className={styles.body}>
        <p className={["body", styles.intro].join(" ")}>
          This is how {name} will look once you publish. Nothing on your website has changed yet.
        </p>

        <div className={styles.block}>
          <span className={["label", styles.blockTitle].join(" ")}>On the dog&rsquo;s page</span>
          <div className={styles.cardFrame}>
            <DogPhoto photo={photo} dogName={name} layout="intrinsic" sizes="(min-width: 640px) 20rem, 90vw" />
          </div>
          <div className={styles.profileBits}>
            <p className={["display-2", styles.profileName].join(" ")}>{name}</p>
            {meta && <p className="label">{meta}</p>}
            {status && <StatusLabel status={status} />}
            {summary && <p className={["body", "muted", styles.profileSummary].join(" ")}>{summary}</p>}
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <Button variant="secondary" fullWidth onClick={onClose}>
          Back to editing
        </Button>
        <p className={["body-sm", styles.footerNote].join(" ")}>
          It will be at <code>/dogs/{slug}</code>
        </p>
      </div>
    </dialog>
  );
}

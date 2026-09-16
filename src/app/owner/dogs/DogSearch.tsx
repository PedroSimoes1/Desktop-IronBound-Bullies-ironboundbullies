"use client";

import { useMemo, useState, type ReactElement } from "react";

type Row = ReactElement<{ "data-search"?: string }>;
import { Field } from "@/components/ui/form/Field";
import { Input } from "@/components/ui/form/controls";
import { Note } from "@/components/owner/ui";
import styles from "./dogs.module.css";

/**
 * Filters the list the server already rendered.
 *
 * The rows arrive from the server complete; this only decides which of them to
 * show. With twelve dogs a round trip per keystroke would be slower and would
 * fail on a bad signal, for no benefit.
 */
export function DogSearch({ children, total }: { children: Row[]; total: number }) {
  const [query, setQuery] = useState("");
  const term = query.trim().toLowerCase();

  const matches = useMemo(() => {
    if (!term) return children;
    return children.filter((child) => (child.props["data-search"] ?? "").includes(term));
  }, [children, term]);

  return (
    <>
      <div className={styles.search}>
        <Field label="Search by name or colour" requirement="none">
          {(ids) => (
            <Input
              {...ids}
              type="search"
              inputMode="search"
              autoComplete="off"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Voodoo, blue tri"
            />
          )}
        </Field>
      </div>

      {matches.length === 0 ? (
        <div className={styles.empty}>
          <Note>
            No dog matches &ldquo;{query.trim()}&rdquo;. Check the spelling, or clear the search to see all {total}.
          </Note>
        </div>
      ) : (
        <ul role="list" className={styles.list}>
          {matches}
        </ul>
      )}
    </>
  );
}

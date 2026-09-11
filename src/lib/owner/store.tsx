"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  hasChanges,
  seedDogs,
  seedInquiries,
  seedLitters,
  type DogFields,
  type InquiryState,
  type OwnerDog,
  type OwnerInquiry,
  type OwnerLitter,
} from "./demo";

/**
 * The prototype's memory.
 *
 * One React state object for the whole owner experience, held in the browser.
 * "Saving" waits, then writes to this object. Nothing is sent anywhere and
 * nothing survives a reload, which is exactly what a design review needs: the
 * screens, the states and the workflow are real, the persistence is not.
 *
 * The shape here is also the proposal for the real thing. A dog carries what
 * the website is showing (`published`) and, separately, what the owner has
 * changed but not yet published (`draft`). Availability lives inside those
 * fields; whether an edit is published is a different question and is tracked
 * on its own. Private notes sit outside both and never travel to a public page.
 */

export type SaveState = "idle" | "saving" | "saved" | "failed";

interface OwnerStore {
  signedIn: boolean;
  signIn: () => void;
  signOut: () => void;

  dogs: OwnerDog[];
  litters: OwnerLitter[];
  inquiries: OwnerInquiry[];

  /** Writes to the dog's draft. Does not touch what the website shows. */
  editDog: (id: string, changes: Partial<DogFields>) => void;
  setPrivateNotes: (id: string, notes: string) => void;
  discardDraft: (id: string) => void;
  /** Simulates the round trip, then moves the draft into published. */
  publishDog: (id: string) => Promise<boolean>;
  setInquiryState: (id: string, state: InquiryState) => void;

  /** Lets a reviewer see the failure path on demand. */
  failNextSave: boolean;
  setFailNextSave: (value: boolean) => void;
}

const OwnerStoreContext = createContext<OwnerStore | null>(null);

const SAVE_DELAY_MS = 900;

export function OwnerStoreProvider({ children }: { children: ReactNode }) {
  const [signedIn, setSignedIn] = useState(false);
  const [dogs, setDogs] = useState<OwnerDog[]>(seedDogs);
  const [litters] = useState<OwnerLitter[]>(seedLitters);
  const [inquiries, setInquiries] = useState<OwnerInquiry[]>(seedInquiries);
  const [failNextSave, setFailNextSave] = useState(false);

  const editDog = useCallback((id: string, changes: Partial<DogFields>) => {
    setDogs((current) =>
      current.map((dog) => {
        if (dog.id !== id) return dog;
        const next: OwnerDog = { ...dog, draft: { ...dog.published, ...(dog.draft ?? {}), ...changes } };
        // An edit that lands back on the published values is not a change.
        return hasChanges(next) ? next : { ...dog, draft: null };
      }),
    );
  }, []);

  const setPrivateNotes = useCallback((id: string, notes: string) => {
    setDogs((current) => current.map((dog) => (dog.id === id ? { ...dog, privateNotes: notes } : dog)));
  }, []);

  const discardDraft = useCallback((id: string) => {
    setDogs((current) => current.map((dog) => (dog.id === id ? { ...dog, draft: null } : dog)));
  }, []);

  const publishDog = useCallback(
    async (id: string) => {
      await new Promise((resolve) => setTimeout(resolve, SAVE_DELAY_MS));
      if (failNextSave) return false;
      setDogs((current) =>
        current.map((dog) => (dog.id === id && dog.draft ? { ...dog, published: { ...dog.published, ...dog.draft }, draft: null } : dog)),
      );
      return true;
    },
    [failNextSave],
  );

  const setInquiryState = useCallback((id: string, state: InquiryState) => {
    setInquiries((current) => current.map((item) => (item.id === id ? { ...item, state } : item)));
  }, []);

  const value = useMemo<OwnerStore>(
    () => ({
      signedIn,
      signIn: () => setSignedIn(true),
      signOut: () => setSignedIn(false),
      dogs,
      litters,
      inquiries,
      editDog,
      setPrivateNotes,
      discardDraft,
      publishDog,
      setInquiryState,
      failNextSave,
      setFailNextSave,
    }),
    [signedIn, dogs, litters, inquiries, editDog, setPrivateNotes, discardDraft, publishDog, setInquiryState, failNextSave],
  );

  return <OwnerStoreContext.Provider value={value}>{children}</OwnerStoreContext.Provider>;
}

export function useOwnerStore(): OwnerStore {
  const store = useContext(OwnerStoreContext);
  if (!store) throw new Error("useOwnerStore must be used inside OwnerStoreProvider");
  return store;
}

"use client";

import { createJSONStorage } from "zustand/middleware";

/**
 * Per-account browser storage. Cloud (Supabase) accounts get their own namespace
 * (`<key>@<userId>`) so their cached data never mixes with demo data or another
 * teacher's. Local/demo sessions use the plain keys.
 */
let scope: string | null | undefined;

const SESSION_KEY = "llce:session";

function initialScope(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    const session = raw
      ? (JSON.parse(raw) as { state?: { session?: { teacherId?: string; cloud?: boolean } } }).state
          ?.session
      : null;
    return session?.cloud && session.teacherId ? session.teacherId : null;
  } catch {
    return null;
  }
}

export function getStorageScope(): string | null {
  if (scope === undefined) scope = typeof window === "undefined" ? null : initialScope();
  return scope;
}

export const isCloudScope = () => getStorageScope() !== null;

export const scopedKey = (name: string) => {
  const s = getStorageScope();
  return s ? `${name}@${s}` : name;
};

export const scopedStorage = createJSONStorage(() => ({
  getItem: (k: string) => localStorage.getItem(scopedKey(k)),
  setItem: (k: string, v: string) => localStorage.setItem(scopedKey(k), v),
  removeItem: (k: string) => localStorage.removeItem(scopedKey(k)),
}));

export interface ScopedStore {
  name: string;
  rehydrate(): Promise<void> | void;
  /** Puts the store back to its empty initial state. */
  reset(): void;
}

/** Switches namespace and reloads each store from it (empty if it has nothing yet). */
export async function setStorageScope(next: string | null, stores: ScopedStore[]): Promise<void> {
  if (getStorageScope() === next) return;
  scope = next;
  for (const store of stores) {
    if (localStorage.getItem(scopedKey(store.name)) === null) store.reset();
    await store.rehydrate();
  }
}

"use client";

import { useEffect, useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { randomSeed, SAMPLE_WORD_SETS, type WordSetDraft } from "@/lib/game";
import { newId } from "@/lib/util/id";

export interface WordSet extends WordSetDraft {
  id: string;
  /** Board seed chosen in the preview (Shuffle). Used as the default when launching. */
  previewSeed: number;
  createdAt: number;
  updatedAt: number;
}

interface WordSetState {
  wordSets: WordSet[];
  /** Sample sets are added once, on first visit. */
  seeded: boolean;
  create(draft: WordSetDraft, previewSeed: number): string;
  update(id: string, draft: WordSetDraft, previewSeed: number): void;
  duplicate(id: string): string | null;
  remove(id: string): void;
  seedSamples(): void;
}

/** Trims text and uppercases words so stored sets are tidy. */
export function cleanDraft(draft: WordSetDraft): WordSetDraft {
  const locale = draft.language === "es" ? "es" : "en";
  return {
    ...draft,
    title: draft.title.trim(),
    words: draft.words
      .map((w) => ({ text: w.text.trim().toLocaleUpperCase(locale), clue: (w.clue ?? "").trim() }))
      .filter((w) => w.text || w.clue),
  };
}

export const WORD_SET_STORAGE_KEY = "llce:word-sets";

export const useWordSetStore = create<WordSetState>()(
  persist(
    (set, get) => ({
      wordSets: [],
      seeded: false,
      create: (draft, previewSeed) => {
        const now = Date.now();
        const id = newId("ws");
        set((s) => ({
          wordSets: [
            { ...cleanDraft(draft), id, previewSeed, createdAt: now, updatedAt: now },
            ...s.wordSets,
          ],
        }));
        return id;
      },
      update: (id, draft, previewSeed) =>
        set((s) => ({
          wordSets: s.wordSets.map((w) =>
            w.id === id ? { ...w, ...cleanDraft(draft), previewSeed, updatedAt: Date.now() } : w,
          ),
        })),
      duplicate: (id) => {
        const original = get().wordSets.find((w) => w.id === id);
        if (!original) return null;
        const now = Date.now();
        const copy: WordSet = {
          ...structuredClone(original),
          id: newId("ws"),
          title: `${original.title} (copy)`,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => {
          const index = s.wordSets.findIndex((w) => w.id === id);
          const next = [...s.wordSets];
          next.splice(index + 1, 0, copy);
          return { wordSets: next };
        });
        return copy.id;
      },
      remove: (id) => set((s) => ({ wordSets: s.wordSets.filter((w) => w.id !== id) })),
      seedSamples: () => {
        if (get().seeded) return;
        const now = Date.now();
        const samples = Object.values(SAMPLE_WORD_SETS).map((draft, i) => ({
          ...cleanDraft(draft),
          id: newId("ws"),
          previewSeed: randomSeed(),
          createdAt: now - i,
          updatedAt: now - i,
        }));
        set((s) => ({ seeded: true, wordSets: [...s.wordSets, ...samples] }));
      },
    }),
    {
      name: WORD_SET_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ wordSets: s.wordSets, seeded: s.seeded }),
      skipHydration: true,
      onRehydrateStorage: () => (state) => state?.seedSamples(),
    },
  ),
);

const subscribeHydration = (cb: () => void) => useWordSetStore.persist.onFinishHydration(cb);
const getHydrated = () => useWordSetStore.persist.hasHydrated();
const getServerHydrated = () => false;

/**
 * Loads word sets from localStorage after mount (avoids server/client mismatches).
 * Returns true once they're available.
 */
export function useWordSetsReady(): boolean {
  useEffect(() => {
    if (!useWordSetStore.persist.hasHydrated()) void useWordSetStore.persist.rehydrate();
  }, []);
  return useSyncExternalStore(subscribeHydration, getHydrated, getServerHydrated);
}

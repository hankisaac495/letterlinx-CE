"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { RoundResult } from "@/lib/reports";
import { createHydrationHook } from "./hydration";

/** Most rounds kept in this browser (oldest dropped first). */
export const MAX_SAVED_ROUNDS = 300;

interface ReportState {
  results: RoundResult[];
  /** Inserts or replaces a round (late progress can arrive after it ends). */
  record(result: RoundResult): void;
  addMany(results: RoundResult[]): void;
  remove(id: string): void;
  clearSamples(sectionId: string): void;
}

export const useReportStore = create<ReportState>()(
  persist(
    (set) => ({
      results: [],
      record: (result) =>
        set((s) => {
          const rest = s.results.filter((r) => r.id !== result.id);
          return {
            results: [...rest, result]
              .sort((a, b) => a.startedAt - b.startedAt)
              .slice(-MAX_SAVED_ROUNDS),
          };
        }),
      addMany: (results) =>
        set((s) => {
          const ids = new Set(results.map((r) => r.id));
          return {
            results: [...s.results.filter((r) => !ids.has(r.id)), ...results]
              .sort((a, b) => a.startedAt - b.startedAt)
              .slice(-MAX_SAVED_ROUNDS),
          };
        }),
      remove: (id) => set((s) => ({ results: s.results.filter((r) => r.id !== id) })),
      clearSamples: (sectionId) =>
        set((s) => ({
          results: s.results.filter((r) => !(r.sample && r.sectionId === sectionId)),
        })),
    }),
    {
      name: "llce:reports",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);

export const useReportsReady = createHydrationHook(() => useReportStore.persist);

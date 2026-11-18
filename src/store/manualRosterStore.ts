"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { scopedStorage } from "./scopedStorage";
import { MAX_CLASS_SIZE, type ManualClass, type ManualStudent } from "@/lib/roster";
import { newId } from "@/lib/util/id";
import { createHydrationHook } from "./hydration";

export interface ClassDraft {
  name: string;
  subject: string;
  grade: string;
  period: string;
  students: { id?: string; first: string; lastInitial: string }[];
}

interface ManualRosterState {
  classes: ManualClass[];
  /** Creates or replaces a class; keeps ids of students that were already there. */
  save(ownerId: string, draft: ClassDraft, id?: string): string;
  remove(id: string): void;
}

/** Classes teachers typed in themselves (saved in this browser). */
export const useManualRosterStore = create<ManualRosterState>()(
  persist(
    (set, get) => ({
      classes: [],
      save: (ownerId, draft, id) => {
        const now = Date.now();
        const existing = id
          ? get().classes.find((c) => c.id === id && c.ownerId === ownerId)
          : undefined;
        const students: ManualStudent[] = draft.students.slice(0, MAX_CLASS_SIZE).map((s) => ({
          id: s.id ?? newId("st"),
          first: s.first.trim(),
          lastInitial: s.lastInitial.trim().charAt(0).toLocaleUpperCase(),
        }));
        const cls: ManualClass = {
          id: existing?.id ?? newId("cls"),
          ownerId,
          name: draft.name.trim(),
          subject: draft.subject.trim(),
          grade: draft.grade.trim(),
          period: draft.period.trim(),
          students,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
        };
        set((s) => ({
          classes: existing
            ? s.classes.map((c) => (c.id === cls.id ? cls : c))
            : [...s.classes, cls],
        }));
        return cls.id;
      },
      remove: (id) => set((s) => ({ classes: s.classes.filter((c) => c.id !== id) })),
    }),
    {
      name: "llce:manual-rosters",
      version: 1,
      storage: scopedStorage,
      skipHydration: true,
    },
  ),
);

export const useManualRostersReady = createHydrationHook(() => useManualRosterStore.persist);

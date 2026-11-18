"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createHydrationHook } from "./hydration";

export type AuthProvider = "clever" | "google";

export const PROVIDER_LABEL: Record<AuthProvider, string> = {
  clever: "Clever",
  google: "Google Classroom",
};

export interface TeacherSession {
  teacherId: string;
  provider: AuthProvider;
  signedInAt: number;
  lastSyncedAt: number;
}

interface SessionState {
  session: TeacherSession | null;
  signIn(teacherId: string, provider: AuthProvider): void;
  signOut(): void;
  markSynced(at: number): void;
}

/** Simulated teacher sign-in (no real OAuth). */
export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      session: null,
      signIn: (teacherId, provider) => {
        const now = Date.now();
        set({ session: { teacherId, provider, signedInAt: now, lastSyncedAt: now } });
      },
      signOut: () => set({ session: null }),
      markSynced: (at) =>
        set((s) => (s.session ? { session: { ...s.session, lastSyncedAt: at } } : s)),
    }),
    {
      name: "llce:session",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);

export const useSessionReady = createHydrationHook(() => useSessionStore.persist);

"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createHydrationHook } from "./hydration";

import type { RosterSource } from "@/lib/roster";

/** How the teacher signed in (also where their rosters come from). */
export type AuthProvider = RosterSource;

export const PROVIDER_LABEL: Record<AuthProvider, string> = {
  clever: "Clever",
  google: "Google Classroom",
  classlink: "ClassLink",
  email: "Email",
};

/** Third-party rostering systems (as opposed to typed-in rosters). */
export const isRosteringSystem = (p: AuthProvider): p is Exclude<AuthProvider, "email"> =>
  p !== "email";

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

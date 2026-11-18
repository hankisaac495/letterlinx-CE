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

export interface TeacherProfile {
  firstName: string;
  lastName: string;
  title: string;
  email: string;
}

export interface TeacherSession {
  teacherId: string;
  provider: AuthProvider;
  signedInAt: number;
  lastSyncedAt: number;
  /** Name and email for email accounts (so the header can show them without a lookup). */
  profile?: TeacherProfile;
  /** True when the account and its data live in Supabase. */
  cloud?: boolean;
}

interface SessionState {
  session: TeacherSession | null;
  signIn(
    teacherId: string,
    provider: AuthProvider,
    profile?: TeacherProfile,
    cloud?: boolean,
  ): void;
  signOut(): void;
  markSynced(at: number): void;
}

/** Simulated teacher sign-in (no real OAuth). */
export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      session: null,
      signIn: (teacherId, provider, profile, cloud) => {
        const now = Date.now();
        set({
          session: { teacherId, provider, signedInAt: now, lastSyncedAt: now, profile, cloud },
        });
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

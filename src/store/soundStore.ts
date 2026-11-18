"use client";

import { useCallback } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { sfx, type PlayOptions, type SoundName } from "@/lib/audio/sfx";
import { createHydrationHook } from "./hydration";

/** Where a sound plays: students default to muted, the projector to on. */
export type SoundContext = "student" | "projector";

interface SoundState {
  studentMuted: boolean;
  projectorMuted: boolean;
  projectorVolume: number;
  setMuted(context: SoundContext, muted: boolean): void;
  setProjectorVolume(v: number): void;
}

export const useSoundStore = create<SoundState>()(
  persist(
    (set) => ({
      studentMuted: true,
      projectorMuted: false,
      projectorVolume: 0.8,
      setMuted: (context, muted) =>
        set(context === "student" ? { studentMuted: muted } : { projectorMuted: muted }),
      setProjectorVolume: (v) => set({ projectorVolume: Math.max(0, Math.min(1, v)) }),
    }),
    {
      name: "llce:sound",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);

export const useSoundReady = createHydrationHook(() => useSoundStore.persist);

/** Returns a play() that respects this view's mute and volume. */
export function useSfx(context: SoundContext) {
  useSoundReady();
  return useCallback(
    (name: SoundName, opts?: PlayOptions) => {
      const s = useSoundStore.getState();
      const muted = context === "student" ? s.studentMuted : s.projectorMuted;
      if (muted) return;
      sfx.setVolume(context === "projector" ? s.projectorVolume : 0.7);
      sfx.play(name, opts);
    },
    [context],
  );
}

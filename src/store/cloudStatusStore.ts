"use client";

import { create } from "zustand";
import type { SyncStatus } from "@/lib/cloud/engine";

/** Overall save state for a cloud account (shown in the teacher header). */
export const useCloudStatus = create<{ status: SyncStatus; set(status: SyncStatus): void }>(
  (set) => ({
    status: "idle",
    set: (status) => set({ status }),
  }),
);

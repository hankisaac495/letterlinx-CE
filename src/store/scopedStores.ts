"use client";

import { useManualRosterStore } from "./manualRosterStore";
import { useReportStore } from "./reportStore";
import type { ScopedStore } from "./scopedStorage";
import { useWordSetStore } from "./wordSetStore";

/** Stores whose browser cache is kept per account (and synced for cloud accounts). */
export const SCOPED_STORES: ScopedStore[] = [
  {
    name: "llce:word-sets",
    rehydrate: () => useWordSetStore.persist.rehydrate(),
    reset: () => useWordSetStore.setState({ wordSets: [], seeded: false }),
  },
  {
    name: "llce:reports",
    rehydrate: () => useReportStore.persist.rehydrate(),
    reset: () => useReportStore.setState({ results: [] }),
  },
  {
    name: "llce:manual-rosters",
    rehydrate: () => useManualRosterStore.persist.rehydrate(),
    reset: () => useManualRosterStore.setState({ classes: [] }),
  },
];

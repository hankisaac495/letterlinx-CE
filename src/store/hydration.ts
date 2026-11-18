"use client";

import { useEffect, useSyncExternalStore } from "react";

interface PersistApi {
  hasHydrated(): boolean;
  onFinishHydration(fn: () => void): () => void;
  rehydrate(): Promise<void> | void;
}

/**
 * Builds a hook that loads a `skipHydration` persisted store after mount and
 * reports when it's ready (avoids server/client markup mismatches).
 */
export function createHydrationHook(getPersist: () => PersistApi) {
  const subscribe = (cb: () => void) => getPersist().onFinishHydration(cb);
  const getSnapshot = () => getPersist().hasHydrated();
  const getServerSnapshot = () => false;
  return function useHydrated(): boolean {
    useEffect(() => {
      if (!getPersist().hasHydrated()) void getPersist().rehydrate();
    }, []);
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  };
}

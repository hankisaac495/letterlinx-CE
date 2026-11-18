"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { translate, type Locale, type Params, type Translate } from "./core";
import type { MessageKey } from "./messages";

export * from "./core";
export type { MessageKey } from "./messages";

interface LocaleState {
  locale: Locale;
  setLocale(locale: Locale): void;
}

export const useLocaleStore = create<LocaleState>()(
  persist((set) => ({ locale: "en", setLocale: (locale) => set({ locale }) }), {
    name: "llce:locale",
    version: 1,
    storage: createJSONStorage(() => localStorage),
    skipHydration: true,
  }),
);

const subscribe = (cb: () => void) => {
  const unsubStore = useLocaleStore.subscribe(cb);
  const unsubHydrate = useLocaleStore.persist.onFinishHydration(cb);
  return () => {
    unsubStore();
    unsubHydrate();
  };
};

/** Current UI language ("en" during prerender, then the saved choice). */
export function useLocale(): Locale {
  useEffect(() => {
    if (!useLocaleStore.persist.hasHydrated()) void useLocaleStore.persist.rehydrate();
  }, []);
  return useSyncExternalStore(
    subscribe,
    () => (useLocaleStore.persist.hasHydrated() ? useLocaleStore.getState().locale : "en"),
    () => "en",
  );
}

export function useT(): Translate {
  const locale = useLocale();
  return useCallback(
    (key: MessageKey, params?: Params) => translate(locale, key, params),
    [locale],
  );
}

"use client";

import { useEffect } from "react";
import { useLocale } from "@/lib/i18n";

/** Keeps <html lang> in step with the chosen interface language. */
export function LocaleSync() {
  const locale = useLocale();
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}

"use client";

import { useT } from "@/lib/i18n";
import { LanguageToggle } from "./ui/LanguageToggle";

export function PrototypeBanner() {
  const t = useT();
  return (
    <div className="flex w-full flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-amber-100 px-4 py-1.5 text-sm font-medium text-amber-900">
      <p role="note">{t("banner")}</p>
      <LanguageToggle />
    </div>
  );
}

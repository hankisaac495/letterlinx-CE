"use client";

import { useLocale, useLocaleStore, type Locale } from "@/lib/i18n";

const LABELS: Record<Locale, string> = { en: "English", es: "Español" };

/** English / Español switch (saved in this browser). */
export function LanguageToggle({ dark }: { dark?: boolean }) {
  const locale = useLocale();
  const setLocale = useLocaleStore((s) => s.setLocale);
  return (
    <div
      role="group"
      aria-label="Language / Idioma"
      className="inline-flex gap-0.5 rounded-lg p-0.5 text-xs font-bold"
    >
      {(Object.keys(LABELS) as Locale[]).map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={locale === l}
          onClick={() => setLocale(l)}
          className={`rounded-md px-2 py-0.5 focus-visible:ring-2 focus-visible:outline-none ${
            locale === l
              ? dark
                ? "bg-white text-slate-950"
                : "bg-amber-900 text-amber-50"
              : dark
                ? "text-white/70 hover:bg-white/10"
                : "text-amber-900 hover:bg-amber-200"
          } ${dark ? "focus-visible:ring-sky-400" : "focus-visible:ring-amber-700"}`}
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n";

const LINKS = [
  { href: "/about", key: "footer.about" },
  { href: "/how-to-play", key: "footer.howTo" },
  { href: "/faq", key: "footer.faq" },
  { href: "/privacy", key: "footer.privacy" },
  { href: "/contact", key: "footer.contact" },
] as const;

/** Simple site footer. Hidden on the full-screen projector view. */
export function SiteFooter() {
  const t = useT();
  const pathname = usePathname();
  if (pathname?.startsWith("/projector")) return null;
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-3 px-4 py-6 text-sm text-slate-600 sm:flex-row sm:justify-between">
        <p>
          <span className="font-bold text-slate-800">LetterLinx</span> {t("footer.edition")}
        </p>
        <nav aria-label={t("footer.nav")}>
          <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={pathname === l.href ? "page" : undefined}
                  className="font-semibold hover:text-blue-700 hover:underline focus-visible:rounded focus-visible:ring-4 focus-visible:ring-blue-200 focus-visible:outline-none aria-[current=page]:text-blue-700"
                >
                  {t(l.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}

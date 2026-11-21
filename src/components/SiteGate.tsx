"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState, useSyncExternalStore } from "react";
import { btn, card, input } from "@/components/ui/styles";
import { ACCESS_COOKIE, PASSWORD_SHA256 } from "@/lib/access";
import { useT } from "@/lib/i18n";
import { LanguageToggle } from "./ui/LanguageToggle";

/**
 * Prototype access gate: a simple front-end password so the public can't casually
 * browse the demo. Not real security (it runs in the browser) — just a deterrent.
 * Only a SHA-256 hash of the password lives in the code.
 */
const ONE_YEAR_S = 60 * 60 * 24 * 365;
/** Pages anyone can read (the gate links to Contact). */
const OPEN_PATHS = ["/contact", "/privacy"];
const CHANGE_EVENT = "llce:access-change";

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const hasAccess = () => document.cookie.split("; ").includes(`${ACCESS_COOKIE}=${PASSWORD_SHA256}`);

function grantAccess() {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${ACCESS_COOKIE}=${PASSWORD_SHA256}; Max-Age=${ONE_YEAR_S}; Path=/; SameSite=Lax${secure}`;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

const subscribe = (cb: () => void) => {
  window.addEventListener(CHANGE_EVENT, cb);
  return () => window.removeEventListener(CHANGE_EVENT, cb);
};

function GateOverlay() {
  const t = useT();
  const [password, setPassword] = useState("");
  const [wrong, setWrong] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gate-title"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-y-auto bg-slate-50 px-4 py-10"
      data-testid="site-gate"
      data-site-gate=""
    >
      <div className="absolute top-3 right-3">
        <LanguageToggle />
      </div>
      <form
        className={`${card} flex w-full max-w-sm flex-col gap-4 p-7`}
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          if ((await sha256Hex(password)) === PASSWORD_SHA256) {
            grantAccess();
          } else {
            setWrong(true);
            setBusy(false);
          }
        }}
      >
        <Image
          src="/letterlinx-header-logo.svg"
          alt="LetterLinx"
          width={564}
          height={128}
          unoptimized
          priority
          className="mx-auto h-auto w-56"
        />
        <div className="text-center">
          <h1 id="gate-title" className="text-xl font-black">
            {t("gate.title")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{t("gate.lead")}</p>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="gate-password" className="text-sm font-bold">
            {t("gate.password")}
          </label>
          <input
            id="gate-password"
            type="password"
            autoComplete="current-password"
            autoFocus
            className={input}
            value={password}
            aria-invalid={wrong}
            aria-describedby={wrong ? "gate-error" : undefined}
            onChange={(e) => {
              setPassword(e.target.value);
              setWrong(false);
            }}
          />
          {wrong && (
            <p id="gate-error" role="alert" className="text-sm font-semibold text-rose-700">
              {t("gate.wrong")}
            </p>
          )}
        </div>
        <button type="submit" className={btn.primary} disabled={busy || !password}>
          {t("gate.enter")}
        </button>
        <p className="text-center text-sm text-slate-600">
          {t("gate.needPrefix")}{" "}
          <Link href="/contact" className="font-semibold text-blue-700 hover:underline">
            {t("gate.contactLink")}
          </Link>{" "}
          {t("gate.needSuffix")}
        </p>
      </form>
    </div>
  );
}

/** Reports the current path (isolated so only this tiny part waits on routing data). */
function PathWatcher({ onPath }: { onPath(path: string): void }) {
  const pathname = usePathname();
  useEffect(() => onPath(pathname ?? ""), [pathname, onPath]);
  return null;
}

/** Wraps the app: shows the password overlay until access is granted (except on open pages). */
export function SiteGate({ children }: { children: React.ReactNode }) {
  // Locked during prerender; the browser checks its cookie after loading.
  const granted = useSyncExternalStore(subscribe, hasAccess, () => false);
  const [path, setPath] = useState<string | null>(null);
  const open = path !== null && OPEN_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
  const locked = !granted && !open;
  return (
    <>
      <Suspense fallback={null}>
        <PathWatcher onPath={setPath} />
      </Suspense>
      <div className="contents" inert={locked}>
        {children}
      </div>
      {locked && <GateOverlay />}
    </>
  );
}

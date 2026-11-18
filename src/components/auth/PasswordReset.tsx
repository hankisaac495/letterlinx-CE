"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { btn, card, input } from "@/components/ui/styles";
import { authRedirect, useCompleteSignIn } from "@/hooks/useCompleteSignIn";
import { AccountError, MIN_PASSWORD_LENGTH, type AccountErrorCode } from "@/lib/accounts";
import { getAccountService } from "@/lib/accounts/service";
import { useT, type MessageKey } from "@/lib/i18n";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
      {children}
    </div>
  );
}

/** Step 1: ask for the email and send a reset link. */
export function ForgotPassword() {
  const t = useT();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<AccountErrorCode | null>(null);
  const [busy, setBusy] = useState(false);
  const svc = getAccountService();

  if (svc.kind !== "cloud") {
    return (
      <Shell>
        <p className={`${card} p-6 text-center text-slate-600`}>
          {t("email.error.resetUnavailable")}
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <form
        className={`${card} flex flex-col gap-4 p-6`}
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            await svc.requestPasswordReset(email, authRedirect("/auth/reset")!);
            setSent(true);
          } catch (err) {
            setError(err instanceof AccountError ? err.code : "unknown");
          }
          setBusy(false);
        }}
      >
        <h1 className="text-xl font-black">{t("email.forgotTitle")}</h1>
        {sent ? (
          <p role="status" className="text-slate-600">
            {t("email.resetSent", { email })}
          </p>
        ) : (
          <>
            <p className="text-sm text-slate-600">{t("email.forgotBody")}</p>
            <div className="flex flex-col gap-1">
              <label htmlFor="forgot-email" className="text-sm font-bold">
                {t("email.email")}
              </label>
              <input
                id="forgot-email"
                type="email"
                autoComplete="email"
                className={input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {error && (
              <p
                role="alert"
                className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800"
              >
                {t(`email.error.${error}` as MessageKey, { n: MIN_PASSWORD_LENGTH })}
              </p>
            )}
            <button type="submit" className={btn.primary} disabled={busy || !email.trim()}>
              {busy ? t("email.working") : t("email.sendReset")}
            </button>
          </>
        )}
        <Link href="/auth/email" className="text-sm font-semibold text-blue-700 hover:underline">
          {t("email.backToSignIn")}
        </Link>
      </form>
    </Shell>
  );
}

/** Step 2: the reset link signs the teacher in; they choose a new password. */
export function ResetPassword() {
  const t = useT();
  const complete = useCompleteSignIn();
  const [password, setPassword] = useState("");
  const [ready, setReady] = useState<"waiting" | "ok" | "failed">("waiting");
  const [error, setError] = useState<AccountErrorCode | null>(null);
  const [busy, setBusy] = useState(false);
  const svc = getAccountService();

  useEffect(() => {
    let cancelled = false;
    const attempt = async (tries: number) => {
      const account = await svc.current().catch(() => null);
      if (cancelled) return;
      if (account) setReady("ok");
      else if (tries > 0) window.setTimeout(() => void attempt(tries - 1), 400);
      else setReady("failed");
    };
    void attempt(10);
    return () => {
      cancelled = true;
    };
  }, [svc]);

  if (ready === "failed") {
    return (
      <Shell>
        <div className={`${card} flex flex-col gap-4 p-6 text-center`}>
          <h1 className="text-xl font-black">{t("email.error.linkExpired")}</h1>
          <Link href="/auth/forgot" className={btn.primary}>
            {t("email.sendReset")}
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <form
        className={`${card} flex flex-col gap-4 p-6`}
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          if (password.length < MIN_PASSWORD_LENGTH) {
            setError("passwordTooShort");
            return;
          }
          setBusy(true);
          setError(null);
          try {
            await svc.updatePassword(password);
            const account = await svc.current();
            if (account) complete(account, true);
          } catch (err) {
            setError(err instanceof AccountError ? err.code : "unknown");
            setBusy(false);
          }
        }}
      >
        <h1 className="text-xl font-black">{t("email.newPasswordTitle")}</h1>
        <div className="flex flex-col gap-1">
          <label htmlFor="new-password" className="text-sm font-bold">
            {t("email.newPassword")}
          </label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            className={input}
            value={password}
            disabled={ready !== "ok"}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="text-xs text-slate-500">
            {t("email.passwordHelp", { n: MIN_PASSWORD_LENGTH })}
          </p>
        </div>
        {error && (
          <p
            role="alert"
            className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800"
          >
            {t(`email.error.${error}` as MessageKey, { n: MIN_PASSWORD_LENGTH })}
          </p>
        )}
        <button type="submit" className={btn.primary} disabled={busy || ready !== "ok"}>
          {busy ? t("email.working") : t("email.savePassword")}
        </button>
      </form>
    </Shell>
  );
}

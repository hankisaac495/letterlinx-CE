"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { btn, card, input } from "@/components/ui/styles";
import { AccountError, MIN_PASSWORD_LENGTH, type AccountErrorCode } from "@/lib/accounts";
import { getAccountService } from "@/lib/accounts/service";
import { authRedirect, useCompleteSignIn } from "@/hooks/useCompleteSignIn";
import { useT, type MessageKey } from "@/lib/i18n";
import { ProviderMark } from "./LoginButtons";

type Mode = "signin" | "signup";

/** Email + password accounts for teachers without a rostering system (prototype: this browser only). */
export function EmailAuth() {
  const t = useT();
  const params = useSearchParams();
  const complete = useCompleteSignIn();
  const svc = getAccountService();
  const cloud = svc.kind === "cloud";
  /** Set after a cloud sign-up: the email the confirmation link was sent to. */
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const [mode, setMode] = useState<Mode>(params.get("mode") === "signup" ? "signup" : "signin");
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    title: "",
  });
  const [error, setError] = useState<AccountErrorCode | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "signup") {
        const { account, needsConfirmation } = await svc.signUp(
          form,
          authRedirect("/auth/callback"),
        );
        if (needsConfirmation) {
          setSentTo(account.email);
          setBusy(false);
          return;
        }
        complete(account, cloud);
      } else {
        complete(await svc.signIn(form.email, form.password), cloud);
      }
    } catch (err) {
      setError(err instanceof AccountError ? err.code : "unknown");
      setBusy(false);
    }
  };

  const resend = async (email: string) => {
    setError(null);
    try {
      await svc.resendConfirmation(email, authRedirect("/auth/callback")!);
      setResent(true);
    } catch (err) {
      setError(err instanceof AccountError ? err.code : "unknown");
    }
  };

  if (sentTo) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
        <div className={`${card} flex flex-col gap-4 p-6 text-center`} role="status">
          <p className="text-4xl" aria-hidden="true">
            ✉️
          </p>
          <h1 className="text-xl font-black">{t("email.checkInbox")}</h1>
          <p className="text-slate-600">{t("email.checkInboxBody", { email: sentTo })}</p>
          {resent ? (
            <p className="text-sm font-semibold text-emerald-700">{t("email.resent")}</p>
          ) : (
            <button type="button" className={btn.ghost} onClick={() => void resend(sentTo)}>
              {t("email.resend")}
            </button>
          )}
          {error && (
            <p className="text-sm font-semibold text-rose-700">
              {t(`email.error.${error}` as MessageKey, { n: MIN_PASSWORD_LENGTH })}
            </p>
          )}
          <button
            type="button"
            className={btn.secondary}
            onClick={() => {
              setSentTo(null);
              setMode("signin");
            }}
          >
            {t("email.backToSignIn")}
          </button>
        </div>
      </div>
    );
  }

  const field = (
    key: keyof typeof form,
    label: MessageKey,
    props: React.InputHTMLAttributes<HTMLInputElement> = {},
  ) => (
    <div className="flex flex-col gap-1">
      <label htmlFor={`email-${key}`} className="text-sm font-bold">
        {t(label)}
      </label>
      <input
        id={`email-${key}`}
        className={input}
        value={form[key]}
        onChange={set(key)}
        {...props}
      />
    </div>
  );

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
      <form onSubmit={submit} className={`${card} flex flex-col gap-4 p-6`} noValidate>
        <div className="flex items-center gap-3">
          <ProviderMark provider="email" />
          <h1 className="text-xl font-black">
            {mode === "signup" ? t("email.createTitle") : t("email.signInTitle")}
          </h1>
        </div>
        <div
          role="tablist"
          aria-label={t("email.modes")}
          className="grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-sm font-bold"
        >
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              className={`rounded-lg px-3 py-1.5 focus-visible:ring-4 focus-visible:ring-blue-200 focus-visible:outline-none ${
                mode === m ? "bg-white shadow-sm" : "text-slate-500"
              }`}
            >
              {m === "signin" ? t("email.tabSignIn") : t("email.tabCreate")}
            </button>
          ))}
        </div>

        {mode === "signup" && (
          <div className="grid grid-cols-[5rem_1fr_1fr] gap-3">
            {field("title", "email.titleField", {
              placeholder: t("email.titlePlaceholder"),
              maxLength: 8,
            })}
            {field("firstName", "email.firstName", {
              autoComplete: "given-name",
              maxLength: 40,
              required: true,
            })}
            {field("lastName", "email.lastName", {
              autoComplete: "family-name",
              maxLength: 40,
              required: true,
            })}
          </div>
        )}
        {field("email", "email.email", { type: "email", autoComplete: "email", required: true })}
        {field("password", "email.password", {
          type: "password",
          autoComplete: mode === "signup" ? "new-password" : "current-password",
          required: true,
          minLength: mode === "signup" ? MIN_PASSWORD_LENGTH : undefined,
        })}
        {mode === "signup" && (
          <p className="-mt-2 text-xs text-slate-500">
            {t("email.passwordHelp", { n: MIN_PASSWORD_LENGTH })}
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800"
          >
            {t(`email.error.${error}` as MessageKey, { n: MIN_PASSWORD_LENGTH })}
          </p>
        )}

        <button type="submit" className={btn.primary} disabled={busy}>
          {busy ? t("email.working") : mode === "signup" ? t("email.create") : t("email.signIn")}
        </button>
        {mode === "signin" && cloud && (
          <Link
            href="/auth/forgot"
            className="-mt-1 self-start text-sm font-semibold text-blue-700 hover:underline"
          >
            {t("email.forgot")}
          </Link>
        )}
        <p className="text-xs text-slate-500">
          {cloud ? t("email.cloudNote") : t("email.prototypeNote")}
        </p>
      </form>
      <Link
        href="/"
        className="mt-4 text-center text-sm font-semibold text-blue-700 hover:underline"
      >
        {t("email.useRostering")}
      </Link>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { btn, card } from "@/components/ui/styles";
import { useCompleteSignIn } from "@/hooks/useCompleteSignIn";
import { getAccountService } from "@/lib/accounts/service";
import { useT } from "@/lib/i18n";

/**
 * Landing page for the email-confirmation link. The Supabase client reads the
 * tokens from the URL; once a session exists the teacher is signed in.
 */
export function AuthCallback() {
  const t = useT();
  const complete = useCompleteSignIn();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const linkError = /error_code=|error=/.test(hash) || /error=/.test(window.location.search);
    const attempt = async (tries: number) => {
      const account = await getAccountService()
        .current()
        .catch(() => null);
      if (cancelled) return;
      if (account) complete(account, true);
      else if (tries > 0 && !linkError) window.setTimeout(() => void attempt(tries - 1), 400);
      else setFailed(true);
    };
    void attempt(10);
    return () => {
      cancelled = true;
    };
  }, [complete]);

  return (
    <div
      className={`${card} mx-auto mt-16 flex w-full max-w-md flex-col gap-4 p-8 text-center`}
      role="status"
    >
      {failed ? (
        <>
          <h1 className="text-xl font-black">{t("email.callbackFailed")}</h1>
          <p className="text-slate-600">{t("email.callbackFailedBody")}</p>
          <Link href="/auth/email" className={btn.primary}>
            {t("email.signIn")}
          </Link>
        </>
      ) : (
        <>
          <h1 className="text-xl font-black">{t("email.confirming")}</h1>
          <p className="text-slate-600">{t("email.confirmingBody")}</p>
        </>
      )}
    </div>
  );
}

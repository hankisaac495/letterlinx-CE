"use client";

import Link from "next/link";
import { useTeacher } from "@/hooks/useTeacher";
import { useT } from "@/lib/i18n";
import { teacherDisplayName } from "@/lib/roster";

const loginBtn =
  "inline-flex items-center justify-center gap-3 rounded-xl px-5 py-3 font-extrabold shadow-sm transition active:translate-y-px focus-visible:outline-none focus-visible:ring-4";

/** Generic marks (not the real brands' logos) for the simulated providers. */
export function ProviderMark({
  provider,
}: {
  provider: "clever" | "google" | "classlink" | "email";
}) {
  const styles = {
    clever: ["bg-white/20 text-white", "C"],
    google: ["bg-emerald-600 text-white", "G"],
    classlink: ["bg-teal-700 text-white", "CL"],
    email: ["bg-slate-700 text-white", "@"],
  } as const;
  const [cls, label] = styles[provider];
  return (
    <span
      aria-hidden="true"
      className={`flex size-7 items-center justify-center rounded-lg text-xs font-black ${cls}`}
    >
      {label}
    </span>
  );
}

export function LoginButtons() {
  const t = useT();
  const { ready, session, teacher } = useTeacher();

  if (ready && session && teacher) {
    return (
      <div className="flex flex-col items-center gap-2 md:items-start">
        <Link
          href="/teacher"
          className={`${loginBtn} bg-blue-700 text-white hover:bg-blue-600 focus-visible:ring-blue-200`}
        >
          {t("auth.goDashboard")}
        </Link>
        <p className="text-sm text-slate-500">
          {t("auth.signedInAs", { name: teacherDisplayName(teacher) })}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap md:justify-start">
      <Link
        href="/auth/clever"
        className={`${loginBtn} bg-[#1464ff] text-white hover:bg-[#2a74ff] focus-visible:ring-blue-200`}
      >
        <ProviderMark provider="clever" />
        {t("auth.loginClever")}
      </Link>
      <Link
        href="/auth/google"
        className={`${loginBtn} bg-white text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50 focus-visible:ring-blue-200`}
      >
        <ProviderMark provider="google" />
        {t("auth.loginGoogle")}
      </Link>
      <Link
        href="/auth/classlink"
        className={`${loginBtn} bg-white text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50 focus-visible:ring-blue-200`}
      >
        <ProviderMark provider="classlink" />
        {t("auth.loginClassLink")}
      </Link>
      <p className="w-full text-sm text-slate-600 sm:basis-full">
        {t("auth.noRostering")}{" "}
        <Link href="/auth/email" className="font-semibold text-blue-700 hover:underline">
          {t("auth.emailSignIn")}
        </Link>{" "}
        {t("auth.or")}{" "}
        <Link
          href="/auth/email?mode=signup"
          className="font-semibold text-blue-700 hover:underline"
        >
          {t("auth.emailCreate")}
        </Link>
      </p>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useMemo } from "react";
import { getRosterProvider, teacherDisplayName } from "@/lib/roster";
import { useSessionReady, useSessionStore } from "@/store/sessionStore";

const loginBtn =
  "inline-flex items-center justify-center gap-3 rounded-xl px-5 py-3 font-extrabold shadow-sm transition active:translate-y-px focus-visible:outline-none focus-visible:ring-4";

/** Generic marks (not the real brands' logos) for the simulated providers. */
export function ProviderMark({ provider }: { provider: "clever" | "google" }) {
  return (
    <span
      aria-hidden="true"
      className={`flex size-7 items-center justify-center rounded-lg text-sm font-black ${
        provider === "clever" ? "bg-white/20 text-white" : "bg-emerald-600 text-white"
      }`}
    >
      {provider === "clever" ? "C" : "G"}
    </span>
  );
}

export function LoginButtons() {
  const ready = useSessionReady();
  const session = useSessionStore((s) => s.session);
  const teacher = useMemo(
    () =>
      session
        ? getRosterProvider()
            .listDemoTeachers()
            .find((t) => t.id === session.teacherId)
        : undefined,
    [session],
  );

  if (ready && session && teacher) {
    return (
      <div className="flex flex-col items-center gap-2 md:items-start">
        <Link
          href="/teacher"
          className={`${loginBtn} bg-blue-700 text-white hover:bg-blue-600 focus-visible:ring-blue-200`}
        >
          Go to dashboard
        </Link>
        <p className="text-sm text-slate-500">Signed in as {teacherDisplayName(teacher)} (demo)</p>
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
        Log in with Clever
      </Link>
      <Link
        href="/auth/google"
        className={`${loginBtn} bg-white text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50 focus-visible:ring-blue-200`}
      >
        <ProviderMark provider="google" />
        Log in with Google Classroom
      </Link>
    </div>
  );
}

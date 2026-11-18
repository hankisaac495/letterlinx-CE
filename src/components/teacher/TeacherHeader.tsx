"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { teacherDisplayName } from "@/lib/roster";
import { useTeacher } from "@/hooks/useTeacher";
import { useT } from "@/lib/i18n";
import { PROVIDER_LABEL, useSessionStore } from "@/store/sessionStore";

const navLink =
  "rounded-lg px-3 py-1.5 hover:bg-slate-100 focus-visible:ring-4 focus-visible:ring-blue-200 focus-visible:outline-none";

export function TeacherHeader() {
  const t = useT();
  const router = useRouter();
  const { teacher, session } = useTeacher();
  const signOut = useSessionStore((s) => s.signOut);
  return (
    <header className="border-b border-slate-200 bg-white">
      <nav
        aria-label={t("nav.teacher")}
        className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3"
      >
        <Link
          href="/teacher"
          className="flex items-center gap-2 rounded-lg focus-visible:ring-4 focus-visible:ring-blue-200 focus-visible:outline-none"
        >
          <Image
            src="/letterlinx-header-logo.svg"
            alt="LetterLinx"
            width={564}
            height={128}
            unoptimized
            className="h-7 w-auto"
          />
          <span className="text-sm font-semibold text-blue-700">{t("nav.classroom")}</span>
        </Link>
        <div className="flex flex-wrap items-center gap-1 text-sm font-semibold">
          <Link href="/teacher" className={navLink}>
            {t("nav.dashboard")}
          </Link>
          <Link href="/teacher/reports" className={navLink}>
            {t("nav.reports")}
          </Link>
          <Link href="/join" className={navLink}>
            {t("nav.studentJoin")}
          </Link>
          <Link href="/play" className={navLink}>
            {t("nav.practice")}
          </Link>
          {teacher && session && (
            <span className="ml-2 flex items-center gap-2 border-l border-slate-200 pl-3">
              <span className="text-slate-700" data-testid="signed-in-as">
                {teacherDisplayName(teacher)}
                <span className="ml-1 font-normal text-slate-400">
                  {t("nav.via", { provider: PROVIDER_LABEL[session.provider] })}
                </span>
              </span>
              <button
                type="button"
                className={`${navLink} text-slate-500`}
                onClick={() => {
                  signOut();
                  router.push("/");
                }}
              >
                {t("nav.signOut")}
              </button>
            </span>
          )}
        </div>
      </nav>
    </header>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { LoginButtons } from "@/components/auth/LoginButtons";
import { useT } from "@/lib/i18n";

export function HomeIntro() {
  const t = useT();
  return (
    <section className="max-w-md text-center md:text-left">
      <Image
        src="/letterlinx-header-logo.svg"
        alt="LetterLinx"
        width={564}
        height={128}
        priority
        unoptimized
        className="mx-auto mb-4 h-auto w-64 md:mx-0 md:w-80"
      />
      <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">{t("home.title")}</h1>
      <p className="mt-4 text-lg text-slate-600">{t("home.pitch")}</p>
      <div className="mt-6 flex flex-col items-center gap-3 md:items-start">
        <LoginButtons />
        <Link
          href="/play"
          className="text-sm font-semibold text-blue-700 hover:underline focus-visible:ring-4 focus-visible:ring-blue-200 focus-visible:outline-none"
        >
          {t("home.practice")}
        </Link>
        <p className="text-sm text-slate-500">
          {t("home.studentsPrefix")}{" "}
          <Link href="/join" className="font-semibold text-blue-700 hover:underline">
            {t("home.joinLink")}
          </Link>{" "}
          {t("home.studentsSuffix")}
        </p>
      </div>
    </section>
  );
}

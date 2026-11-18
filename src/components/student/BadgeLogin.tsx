"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { btn, card, select } from "@/components/ui/styles";
import { saveIdentity } from "@/hooks/useStudentRoom";
import { useT } from "@/lib/i18n";
import { watchSectionRoom } from "@/lib/live";
import {
  getRosterProvider,
  studentDisplayName,
  teacherDisplayName,
  type Student,
} from "@/lib/roster";

/**
 * Simulated Clever badge sign-in: "scan" a demo badge, then wait for the class's
 * open round and join it automatically.
 */
export function BadgeLogin() {
  const t = useT();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const badges = useMemo(() => getRosterProvider().listDemoBadges(), []);
  const [sectionId, setSectionId] = useState(badges[0]?.section.id ?? "");
  const [student, setStudent] = useState<Student | null>(null);
  const [waiting, setWaiting] = useState(false);
  const group = badges.find((b) => b.section.id === sectionId);

  useEffect(() => {
    if (!student) return;
    const name = studentDisplayName(student);
    const slow = window.setTimeout(() => setWaiting(true), 2500);
    const stop = watchSectionRoom(sectionId, (room) => {
      stop();
      saveIdentity({ playerId: student.id, name, code: room.code });
      router.push("/join");
    });
    return () => {
      window.clearTimeout(slow);
      stop();
    };
  }, [student, sectionId, router]);

  if (student && group) {
    return (
      <div
        className={`${card} mx-auto mt-8 flex w-full max-w-sm flex-col items-center gap-4 p-8 text-center`}
        role="status"
      >
        <p className="text-sm font-semibold tracking-widest text-slate-500 uppercase">
          {t("badge.accepted")}
        </p>
        <h1 className="text-3xl font-black" data-testid="badge-name">
          {t("badge.hi", { name: studentDisplayName(student) })}
        </h1>
        <p className="text-slate-600">
          {waiting
            ? t("badge.waiting", {
                teacher: teacherDisplayName(group.teacher),
                section: group.section.name,
              })
            : t("badge.finding", { section: group.section.name })}
        </p>
        <button type="button" className={btn.ghost} onClick={() => setStudent(null)}>
          {t("badge.again")}
        </button>
      </div>
    );
  }

  return (
    <div className={`${card} mx-auto mt-8 flex w-full max-w-lg flex-col gap-5 p-6`}>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-black">{t("join.badge")}</h1>
        <span className="rounded-full bg-amber-300 px-2 py-0.5 text-xs font-extrabold text-amber-950">
          {t("common.simulated")}
        </span>
      </div>
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl bg-slate-900 text-center text-white">
        <div
          className="absolute inset-8 rounded-xl border-4 border-dashed border-white/40"
          aria-hidden="true"
        />
        {!reduceMotion && (
          <motion.div
            aria-hidden="true"
            className="absolute inset-x-8 h-1 rounded bg-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.8)]"
            animate={{ top: ["15%", "85%", "15%"] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        <p className="relative px-10 font-semibold text-white/80">{t("badge.hold")}</p>
      </div>
      <p className="text-sm text-slate-500">{t("badge.noCamera")}</p>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-bold">{t("launch.class")}</span>
        <select
          aria-label={t("launch.class")}
          className={`${select} py-2`}
          value={sectionId}
          onChange={(e) => setSectionId(e.target.value)}
        >
          {badges.map((b) => (
            <option key={b.section.id} value={b.section.id}>
              {t("badge.option", {
                teacher: teacherDisplayName(b.teacher),
                section: b.section.name,
                period: b.section.period,
              })}
            </option>
          ))}
        </select>
      </label>
      <ul
        className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3"
        aria-label={t("badge.list")}
      >
        {group?.students.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => setStudent(s)}
              className="flex w-full items-center gap-2 rounded-xl bg-white p-2 text-left font-bold ring-1 ring-slate-300 hover:bg-blue-50 hover:ring-blue-400 focus-visible:ring-4 focus-visible:ring-blue-200 focus-visible:outline-none"
            >
              <span
                aria-hidden="true"
                className="grid size-8 shrink-0 grid-cols-3 gap-px rounded bg-slate-900 p-1"
              >
                {Array.from({ length: 9 }, (_, i) => (
                  <span
                    key={i}
                    className={(s.id.charCodeAt(i) + i) % 2 ? "bg-white" : "bg-slate-900"}
                  />
                ))}
              </span>
              {studentDisplayName(s)}
            </button>
          </li>
        ))}
      </ul>
      <Link href="/join" className={`${btn.ghost} self-start`}>
        {t("badge.useCode")}
      </Link>
    </div>
  );
}

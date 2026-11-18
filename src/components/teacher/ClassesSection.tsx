"use client";

import Link from "next/link";
import { useState } from "react";
import { btn, card } from "@/components/ui/styles";
import { useNow } from "@/hooks/useNow";
import { useSections, useStudents } from "@/hooks/useRoster";
import { useTeacher } from "@/hooks/useTeacher";
import { studentDisplayName, type Section } from "@/lib/roster";
import { useT, type Translate } from "@/lib/i18n";
import { PROVIDER_LABEL, useSessionStore } from "@/store/sessionStore";

function timeAgo(then: number, now: number, t: Translate): string {
  const s = Math.max(0, Math.round((now - then) / 1000));
  if (s < 10) return t("time.justNow");
  if (s < 60) return t("time.seconds", { n: s });
  const m = Math.round(s / 60);
  if (m < 60) return m === 1 ? t("time.minute") : t("time.minutes", { n: m });
  const h = Math.round(m / 60);
  if (h < 24) return h === 1 ? t("time.hour") : t("time.hours", { n: h });
  return new Date(then).toLocaleDateString();
}

function Roster({ section }: { section: Section }) {
  const t = useT();
  const { data, loading } = useStudents(section.id);
  if (loading || !data)
    return <p className="text-sm text-slate-500">{t("classes.loadingRoster")}</p>;
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm text-slate-700 sm:grid-cols-3">
      {data.map((s) => (
        <li key={s.id}>{studentDisplayName(s)}</li>
      ))}
    </ul>
  );
}

function SectionCard({ section, editable }: { section: Section; editable: boolean }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const rosterId = `roster-${section.id}`;
  return (
    <li className={`${card} flex flex-col gap-3 p-4`} data-testid="section-card">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg leading-tight font-black">{section.name}</h3>
          <p className="text-sm text-slate-500">
            {t("classes.periodGrade", { period: section.period, grade: section.grade })}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-sm font-bold text-blue-800">
          {t("classes.students", { count: section.students.length })}
        </span>
      </div>
      {open && (
        <div id={rosterId}>
          <Roster section={section} />
        </div>
      )}
      <div className="mt-auto flex flex-wrap items-center gap-1 border-t border-slate-100 pt-3">
        <Link
          href={`/teacher/launch?section=${section.id}`}
          className="mr-1 inline-flex items-center rounded-lg bg-blue-700 px-3 py-1.5 text-sm font-extrabold text-white hover:bg-blue-600 focus-visible:ring-4 focus-visible:ring-blue-200 focus-visible:outline-none"
        >
          {t("classes.launch")}
        </Link>
        <button
          type="button"
          className={btn.ghost}
          aria-expanded={open}
          aria-controls={rosterId}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? t("classes.hideRoster") : t("classes.viewRoster")}
        </button>
        {editable && (
          <Link href={`/teacher/classes/${section.id}`} className={btn.ghost}>
            {t("classes.editClass")}
          </Link>
        )}
        <Link href={`/teacher/reports?section=${section.id}`} className={btn.ghost}>
          {t("classes.reports")}
        </Link>
      </div>
    </li>
  );
}

export function ClassesSection() {
  const t = useT();
  const { session, roster } = useTeacher();
  const manual = session?.provider === "email";
  const markSynced = useSessionStore((s) => s.markSynced);
  const [version, setVersion] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const { data: sections, loading } = useSections(version);
  const now = useNow(true, 15_000);

  const sync = async () => {
    setSyncing(true);
    const { syncedAt } = (await roster?.sync?.()) ?? { syncedAt: Date.now() };
    markSynced(syncedAt);
    setVersion((v) => v + 1);
    setSyncing(false);
  };

  return (
    <section aria-labelledby="classes-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="classes-heading" className="text-xl font-black">
            {t("classes.title")}
          </h2>
          {session && manual && <p className="text-sm text-slate-500">{t("classes.manual")}</p>}
          {session && !manual && (
            <p className="text-sm text-slate-500" aria-live="polite" data-testid="last-synced">
              {syncing
                ? t("classes.syncing", { provider: PROVIDER_LABEL[session.provider] })
                : t("classes.synced", {
                    provider: PROVIDER_LABEL[session.provider],
                    ago: timeAgo(session.lastSyncedAt, Math.max(now, session.lastSyncedAt), t),
                  })}
            </p>
          )}
        </div>
        {manual ? (
          <Link href="/teacher/classes/new" className={btn.primary}>
            {t("classes.addClass")}
          </Link>
        ) : (
          <button type="button" className={btn.secondary} onClick={sync} disabled={syncing}>
            <svg
              viewBox="0 0 20 20"
              aria-hidden="true"
              className={`size-4 ${syncing ? "animate-spin motion-reduce:animate-none" : ""}`}
            >
              <path
                d="M16 10a6 6 0 01-10.5 4M4 10a6 6 0 0110.5-4M14.5 2.5V6H11M5.5 17.5V14H9"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {syncing ? t("classes.syncingShort") : t("classes.sync")}
          </button>
        )}
      </div>
      {loading || !sections ? (
        <p className="mt-3 text-slate-500">{t("classes.loading")}</p>
      ) : sections.length === 0 ? (
        <div className={`${card} mt-3 p-8 text-center`}>
          <p className="font-bold">{t("classes.empty")}</p>
          <p className="mt-1 text-slate-500">{t("classes.emptyHelp")}</p>
        </div>
      ) : (
        <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((s) => (
            <SectionCard key={s.id} section={s} editable={manual} />
          ))}
        </ul>
      )}
    </section>
  );
}

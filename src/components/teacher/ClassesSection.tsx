"use client";

import Link from "next/link";
import { useState } from "react";
import { btn, card } from "@/components/ui/styles";
import { useNow } from "@/hooks/useNow";
import { useSections, useStudents } from "@/hooks/useRoster";
import { useTeacher } from "@/hooks/useTeacher";
import { getRosterProvider, studentDisplayName, type Section } from "@/lib/roster";
import { PROVIDER_LABEL, useSessionStore } from "@/store/sessionStore";

function timeAgo(then: number, now: number): string {
  const s = Math.max(0, Math.round((now - then) / 1000));
  if (s < 10) return "just now";
  if (s < 60) return `${s} seconds ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  return new Date(then).toLocaleDateString();
}

function Roster({ section }: { section: Section }) {
  const { data, loading } = useStudents(section.id);
  if (loading || !data) return <p className="text-sm text-slate-500">Loading roster…</p>;
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm text-slate-700 sm:grid-cols-3">
      {data.map((s) => (
        <li key={s.id}>{studentDisplayName(s)}</li>
      ))}
    </ul>
  );
}

function SectionCard({ section }: { section: Section }) {
  const [open, setOpen] = useState(false);
  const rosterId = `roster-${section.id}`;
  return (
    <li className={`${card} flex flex-col gap-3 p-4`} data-testid="section-card">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg leading-tight font-black">{section.name}</h3>
          <p className="text-sm text-slate-500">
            Period {section.period} · Grade {section.grade}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-sm font-bold text-blue-800">
          {section.students.length} students
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
          Launch round
        </Link>
        <button
          type="button"
          className={btn.ghost}
          aria-expanded={open}
          aria-controls={rosterId}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "Hide roster" : "View roster"}
        </button>
        <Link href={`/teacher/reports?section=${section.id}`} className={btn.ghost}>
          Reports
        </Link>
      </div>
    </li>
  );
}

export function ClassesSection() {
  const { teacher, session } = useTeacher();
  const markSynced = useSessionStore((s) => s.markSynced);
  const [version, setVersion] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const { data: sections, loading } = useSections(teacher?.id ?? null, version);
  const now = useNow(true, 15_000);

  const sync = async () => {
    setSyncing(true);
    const { syncedAt } = await getRosterProvider().sync();
    markSynced(syncedAt);
    setVersion((v) => v + 1);
    setSyncing(false);
  };

  return (
    <section aria-labelledby="classes-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="classes-heading" className="text-xl font-black">
            Classes
          </h2>
          {session && (
            <p className="text-sm text-slate-500" aria-live="polite" data-testid="last-synced">
              {syncing
                ? `Syncing with ${PROVIDER_LABEL[session.provider]}…`
                : `From ${PROVIDER_LABEL[session.provider]} (simulated) · Last synced ${timeAgo(session.lastSyncedAt, Math.max(now, session.lastSyncedAt))}`}
            </p>
          )}
        </div>
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
          {syncing ? "Syncing…" : "Sync roster"}
        </button>
      </div>
      {loading || !sections ? (
        <p className="mt-3 text-slate-500">Loading classes…</p>
      ) : (
        <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((s) => (
            <SectionCard key={s.id} section={s} />
          ))}
        </ul>
      )}
    </section>
  );
}

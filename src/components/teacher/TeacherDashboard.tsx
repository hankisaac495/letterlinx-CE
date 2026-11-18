"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { WordDisplayMode } from "@/lib/game";
import { btn, card } from "@/components/ui/styles";
import { useHostReady, useHostStore } from "@/store/hostStore";
import { useWordSetsReady, useWordSetStore, type WordSet } from "@/store/wordSetStore";
import { DeleteWordSetButton } from "./DeleteWordSetButton";

const MODE_LABEL: Record<WordDisplayMode, string> = {
  list: "Full list",
  oneAtATime: "One at a time",
  hidden: "Hidden words",
};

function describeDisplay(ws: WordSet): string {
  const parts = [MODE_LABEL[ws.display.mode]];
  if (ws.display.showClues && ws.display.mode !== "hidden") parts.push("clues");
  if (ws.display.allowHints && ws.display.mode === "hidden") parts.push("hints");
  return parts.join(" · ");
}

function WordSetCard({ ws }: { ws: WordSet }) {
  const router = useRouter();
  const duplicate = useWordSetStore((s) => s.duplicate);
  const letters = ws.words.reduce((n, w) => n + [...w.text].length, 0);
  return (
    <li className={`${card} flex flex-col gap-3 p-4`} data-testid="word-set-card">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg leading-tight font-black">{ws.title}</h3>
        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
          {ws.language === "es" ? "Español" : "English"}
        </span>
      </div>
      <p className="flex flex-wrap gap-1.5">
        {ws.words.map((w) => (
          <span
            key={w.text}
            className="rounded-md bg-slate-50 px-1.5 py-0.5 text-xs font-extrabold tracking-wide text-slate-700 ring-1 ring-slate-200"
          >
            {w.text}
          </span>
        ))}
      </p>
      <p className="text-sm text-slate-500">
        {ws.words.length} words · {letters} letters · {describeDisplay(ws)}
      </p>
      <div className="mt-auto flex flex-wrap items-center gap-1 border-t border-slate-100 pt-3">
        <Link
          href={`/teacher/launch?set=${ws.id}`}
          className="mr-1 inline-flex items-center rounded-lg bg-blue-700 px-3 py-1.5 text-sm font-extrabold text-white hover:bg-blue-600 focus-visible:ring-4 focus-visible:ring-blue-200 focus-visible:outline-none"
        >
          Launch
        </Link>
        <Link href={`/teacher/word-sets/${ws.id}`} className={btn.ghost}>
          Edit
        </Link>
        <Link href={`/play?set=${ws.id}`} className={btn.ghost}>
          Practice
        </Link>
        <button
          type="button"
          className={btn.ghost}
          onClick={() => {
            const id = duplicate(ws.id);
            if (id) router.push(`/teacher/word-sets/${id}`);
          }}
        >
          Duplicate
        </button>
        <span className="ml-auto">
          <DeleteWordSetButton wordSet={ws} compact />
        </span>
      </div>
    </li>
  );
}

export function TeacherDashboard() {
  const ready = useWordSetsReady();
  const wordSets = useWordSetStore((s) => s.wordSets);
  const hostReady = useHostReady();
  const openRoom = useHostStore((s) => s.room);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Dashboard</h1>
        <p className="mt-1 text-slate-600">
          Create word sets, then launch a live round for a class.
        </p>
      </div>

      {hostReady && openRoom && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-emerald-50 px-5 py-4 ring-1 ring-emerald-200">
          <p className="text-emerald-900">
            Live round <strong className="font-mono">{openRoom.code}</strong> ·{" "}
            {openRoom.round.title} · {openRoom.players.length} students
          </p>
          <Link href={`/projector/${openRoom.code}`} className={btn.primary}>
            Open projector
          </Link>
        </div>
      )}

      <section aria-labelledby="classes-heading">
        <h2 id="classes-heading" className="text-xl font-black">
          Classes
        </h2>
        <div className={`${card} mt-3 flex flex-wrap items-center justify-between gap-3 p-5`}>
          <p className="text-slate-600">
            Your classes appear here once you connect a roster (Clever or Google Classroom,
            simulated).
          </p>
          <button type="button" className={btn.secondary} disabled>
            Connect roster · coming soon
          </button>
        </div>
      </section>

      <section aria-labelledby="sets-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="sets-heading" className="text-xl font-black">
            Word sets
          </h2>
          <Link href="/teacher/word-sets/new" className={btn.primary}>
            + New word set
          </Link>
        </div>
        {!ready ? (
          <p className="mt-3 text-slate-500">Loading…</p>
        ) : wordSets.length === 0 ? (
          <div className={`${card} mt-3 p-8 text-center`}>
            <p className="font-bold">No word sets yet.</p>
            <p className="mt-1 text-slate-500">Create one with 3–8 vocabulary words.</p>
          </div>
        ) : (
          <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {wordSets.map((ws) => (
              <WordSetCard key={ws.id} ws={ws} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

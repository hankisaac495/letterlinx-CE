"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { MiniBoard } from "@/components/game/MiniBoard";
import { btn, card, check, select } from "@/components/ui/styles";
import {
  prepareRound,
  randomSeed,
  ROUND_DURATIONS,
  type DisplaySettings,
  type RoundDuration,
} from "@/lib/game";
import { MAX_TEAMS, MIN_TEAMS } from "@/lib/live";
import { useSections } from "@/hooks/useRoster";
import { useTeacher } from "@/hooks/useTeacher";
import type { Section } from "@/lib/roster";
import { useHostReady, useHostStore } from "@/store/hostStore";
import { useWordSetsReady, useWordSetStore, type WordSet } from "@/store/wordSetStore";
import { DisplaySettingsFields } from "./DisplaySettingsFields";

function LaunchForm({
  wordSet,
  allSets,
  sections,
  initialSectionId,
  teacherId,
}: {
  teacherId: string | null;
  wordSet: WordSet;
  allSets: WordSet[];
  sections: Section[];
  initialSectionId: string | null;
}) {
  const [sectionId, setSectionId] = useState<string>(initialSectionId ?? sections[0]?.id ?? "");
  const router = useRouter();
  const openRoom = useHostStore((s) => s.open);
  const existingRoom = useHostStore((s) => s.room);
  const [display, setDisplay] = useState<DisplaySettings>(wordSet.display);
  const [duration, setDuration] = useState<RoundDuration>(120);
  const [teamMode, setTeamMode] = useState(false);
  const [teamCount, setTeamCount] = useState(2);
  const [seed, setSeed] = useState(wordSet.previewSeed);

  const prepared = useMemo(
    () => prepareRound({ ...wordSet, display }, seed),
    [wordSet, display, seed],
  );
  const problem = prepared.ok
    ? null
    : (prepared.generation?.message ??
      prepared.validation?.errors[0]?.message ??
      "This word set can't be played yet.");

  const launch = () => {
    if (!prepared.ok) return;
    const code = openRoom({
      title: wordSet.title,
      board: prepared.board,
      words: prepared.words,
      draft: {
        title: wordSet.title,
        language: wordSet.language,
        words: wordSet.words,
        display: wordSet.display,
      },
      wordSetId: wordSet.id,
      sectionId: sectionId || null,
      teacherId,
      settings: { display, duration, teamMode, teamCount },
    });
    router.push(`/projector/${code}`);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6">
      <div>
        <Link href="/teacher" className="text-sm font-semibold text-blue-700 hover:underline">
          ← Dashboard
        </Link>
        <h1 className="mt-1 text-3xl font-black tracking-tight">Launch a live round</h1>
      </div>

      {existingRoom && existingRoom.phase !== "ended" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-amber-50 px-4 py-3 text-sm ring-1 ring-amber-200">
          <p className="text-amber-900">
            Round <strong className="font-mono">{existingRoom.code}</strong> (
            {existingRoom.round.title}) is still open. Launching a new round closes it.
          </p>
          <Link href={`/projector/${existingRoom.code}`} className={btn.ghost}>
            Return to it
          </Link>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-6">
          <section className={`${card} grid gap-4 p-5 sm:grid-cols-2`}>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-bold">Class</span>
              <select
                aria-label="Class"
                className={`${select} py-2`}
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
              >
                {sections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name} · Period {sec.period} ({sec.students.length})
                  </option>
                ))}
                <option value="">No class · anyone with the code types a name</option>
              </select>
              <span className="text-xs text-slate-500">
                Students pick their name from this class list, or sign in with their Clever badge.
              </span>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-bold">Word set</span>
              <select
                className={`${select} py-2`}
                value={wordSet.id}
                onChange={(e) =>
                  router.replace(
                    `/teacher/launch?set=${e.target.value}${sectionId ? `&section=${sectionId}` : ""}`,
                  )
                }
              >
                {allSets.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.title}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section className={`${card} p-5`}>
            <DisplaySettingsFields value={display} onChange={setDisplay} />
            <p className="mt-2 text-xs text-slate-500">
              Starts from the word set’s saved setting. Changes here apply to this round only.
            </p>
          </section>

          <section className={`${card} grid gap-5 p-5 sm:grid-cols-2`}>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-bold">Timer</span>
              <select
                className={`${select} py-2`}
                value={String(duration)}
                onChange={(e) =>
                  setDuration(
                    e.target.value === "untimed"
                      ? "untimed"
                      : (Number(e.target.value) as RoundDuration),
                  )
                }
              >
                {ROUND_DURATIONS.map((d) => (
                  <option key={d} value={d}>
                    {d} seconds
                  </option>
                ))}
                <option value="untimed">Untimed (ends when everyone finishes)</option>
              </select>
            </label>
            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm font-bold">Teams</legend>
              <label className="flex items-center gap-2 font-semibold">
                <input
                  type="checkbox"
                  className={check}
                  checked={teamMode}
                  onChange={(e) => setTeamMode(e.target.checked)}
                />
                Team mode (auto-split students)
              </label>
              {teamMode && (
                <label className="flex items-center gap-2 text-sm">
                  Number of teams
                  <select
                    className={select}
                    value={teamCount}
                    onChange={(e) => setTeamCount(Number(e.target.value))}
                  >
                    {Array.from({ length: MAX_TEAMS - MIN_TEAMS + 1 }, (_, i) => i + MIN_TEAMS).map(
                      (n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ),
                    )}
                  </select>
                </label>
              )}
            </fieldset>
          </section>
        </div>

        <aside className={`${card} flex h-fit flex-col gap-3 self-start p-5 lg:sticky lg:top-4`}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black">Board</h2>
            <button
              type="button"
              className={btn.ghost}
              onClick={() => setSeed(randomSeed())}
              disabled={!prepared.ok}
            >
              Shuffle board
            </button>
          </div>
          {prepared.ok ? (
            <MiniBoard board={prepared.board} showWords />
          ) : (
            <p
              role="alert"
              className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-800"
            >
              {problem}{" "}
              <Link href={`/teacher/word-sets/${wordSet.id}`} className="underline">
                Edit word set
              </Link>
            </p>
          )}
          <button
            type="button"
            className={`${btn.primary} py-3 text-lg`}
            disabled={!prepared.ok}
            onClick={launch}
          >
            Open projector
          </button>
          <p className="text-xs text-slate-500">
            Opens the projector view with a room code. Students join at <strong>/join</strong>.
          </p>
        </aside>
      </div>
    </div>
  );
}

export function LaunchRound() {
  const params = useSearchParams();
  const setsReady = useWordSetsReady();
  const hostReady = useHostReady();
  const wordSets = useWordSetStore((s) => s.wordSets);
  const { teacher } = useTeacher();
  const { data: sections } = useSections(teacher?.id ?? null);
  if (!setsReady || !hostReady || !sections) return <p className="p-6 text-slate-500">Loading…</p>;
  const wordSet = wordSets.find((w) => w.id === params.get("set")) ?? wordSets[0];
  if (!wordSet) {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <h1 className="text-2xl font-black">Create a word set first</h1>
        <Link href="/teacher/word-sets/new" className={`${btn.primary} mt-5`}>
          New word set
        </Link>
      </div>
    );
  }
  const requested = params.get("section");
  return (
    <LaunchForm
      key={wordSet.id}
      wordSet={wordSet}
      allSets={wordSets}
      sections={sections}
      initialSectionId={requested && sections.some((s) => s.id === requested) ? requested : null}
      teacherId={teacher?.id ?? null}
    />
  );
}

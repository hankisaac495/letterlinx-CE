"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  DEFAULT_DISPLAY_SETTINGS,
  prepareRound,
  randomSeed,
  ROUND_DURATIONS,
  SAMPLE_WORD_SETS,
  type DisplaySettings,
  type RoundDuration,
} from "@/lib/game";
import { useGameStore } from "@/store/gameStore";
import { useWordSetsReady, useWordSetStore, type WordSet } from "@/store/wordSetStore";
import { DisplaySettingsFields } from "@/components/teacher/DisplaySettingsFields";
import { check, select } from "@/components/ui/styles";
import { PlayGame } from "./PlayGame";

type SampleKey = keyof typeof SAMPLE_WORD_SETS;

/**
 * Phase 3 single-player demo: a hard-coded word set with the round options exposed,
 * so every display mode, clue mode and hints can be tried before the dashboard exists.
 */
/** Reads ?set=<id> so teachers can practise a saved word set. */
export function PlayDemoFromQuery() {
  const setId = useSearchParams().get("set");
  const ready = useWordSetsReady();
  const saved = useWordSetStore((s) =>
    setId ? s.wordSets.find((w) => w.id === setId) : undefined,
  );
  if (setId && !ready) return <p className="p-6 text-slate-500">Loading…</p>;
  return <PlayDemo key={saved?.id ?? "samples"} saved={saved} />;
}

export function PlayDemo({ saved }: { saved?: WordSet }) {
  const game = useGameStore((s) => s.game);
  const start = useGameStore((s) => s.start);
  const reset = useGameStore((s) => s.reset);
  const [sample, setSample] = useState<SampleKey>("science");
  const [display, setDisplay] = useState<DisplaySettings>(
    saved?.display ?? DEFAULT_DISPLAY_SETTINGS,
  );
  const [duration, setDuration] = useState<RoundDuration>(120);
  const [error, setError] = useState<string | null>(null);

  const set = saved ?? sampleSet(sample);

  if (game) return <PlayGame title={set.title} onExit={reset} />;

  const onStart = () => {
    const prepared = prepareRound({ ...set, display }, saved?.previewSeed ?? randomSeed());
    if (!prepared.ok) {
      setError(
        prepared.generation?.message ??
          prepared.validation?.errors[0]?.message ??
          "Couldn't start the round.",
      );
      return;
    }
    setError(null);
    start({ board: prepared.board, words: prepared.words, display, duration });
  };

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8">
      <p className="text-sm font-semibold tracking-widest text-blue-700 uppercase">
        Practice round
      </p>
      <h1 className="mt-1 text-3xl font-black tracking-tight">Try the student view</h1>
      <p className="mt-2 text-slate-600">
        Drag across neighbouring letters (including diagonals) to spell a word, then let go.
      </p>

      <form
        className="mt-6 flex flex-col gap-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
        onSubmit={(e) => {
          e.preventDefault();
          onStart();
        }}
      >
        {saved ? (
          <div>
            <p className="text-sm font-bold">Word set</p>
            <p className="mt-1 font-semibold">
              {saved.title}{" "}
              <Link
                href="/play"
                className="ml-2 text-sm font-semibold text-blue-700 hover:underline"
              >
                Use a sample instead
              </Link>
            </p>
          </div>
        ) : (
          <fieldset>
            <legend className="text-sm font-bold">Word set</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {(Object.keys(SAMPLE_WORD_SETS) as SampleKey[]).map((key) => (
                <label
                  key={key}
                  className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-slate-50"
                >
                  <input
                    type="radio"
                    name="sample"
                    className={check}
                    checked={sample === key}
                    onChange={() => setSample(key)}
                  />
                  <span>
                    {SAMPLE_WORD_SETS[key].title}{" "}
                    <span className="text-slate-500">
                      ({SAMPLE_WORD_SETS[key].language === "es" ? "Español" : "English"})
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <DisplaySettingsFields value={display} onChange={setDisplay} />

        <label className="flex flex-col gap-1">
          <span className="text-sm font-bold">Timer</span>
          <select
            className={`${select} w-40`}
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
            <option value="untimed">Untimed</option>
          </select>
        </label>

        {error && (
          <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="rounded-xl bg-blue-700 px-4 py-3 text-lg font-extrabold text-white shadow-sm hover:bg-blue-600 focus-visible:ring-4 focus-visible:ring-blue-200 focus-visible:outline-none"
        >
          Start round
        </button>
      </form>
    </div>
  );
}

function sampleSet(key: SampleKey) {
  return SAMPLE_WORD_SETS[key];
}

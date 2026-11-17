"use client";

import { useState } from "react";
import {
  DEFAULT_DISPLAY_SETTINGS,
  prepareRound,
  randomSeed,
  ROUND_DURATIONS,
  SAMPLE_WORD_SETS,
  type DisplaySettings,
  type HintSettings,
  type RoundDuration,
  type WordDisplayMode,
} from "@/lib/game";
import { useGameStore } from "@/store/gameStore";
import { PlayGame } from "./PlayGame";

type SampleKey = keyof typeof SAMPLE_WORD_SETS;

const MODES: { value: WordDisplayMode; label: string; help: string }[] = [
  { value: "list", label: "Show the full list", help: "All words appear above the tiles." },
  {
    value: "oneAtATime",
    label: "Show one at a time",
    help: "The next word appears after the current one is found.",
  },
  { value: "hidden", label: "Hide the words", help: "Students search the board on their own." },
];

const radio =
  "size-4 accent-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200";

/**
 * Phase 3 single-player demo: a hard-coded word set with the round options exposed,
 * so every display mode, clue mode and hints can be tried before the dashboard exists.
 */
export function PlayDemo() {
  const game = useGameStore((s) => s.game);
  const start = useGameStore((s) => s.start);
  const reset = useGameStore((s) => s.reset);
  const [sample, setSample] = useState<SampleKey>("science");
  const [display, setDisplay] = useState<DisplaySettings>(DEFAULT_DISPLAY_SETTINGS);
  const [duration, setDuration] = useState<RoundDuration>(120);
  const [error, setError] = useState<string | null>(null);

  const set = sampleSet(sample);

  if (game) return <PlayGame title={set.title} onExit={reset} />;

  const updateHints = (patch: Partial<HintSettings>) =>
    setDisplay((d) => ({ ...d, hints: { ...d.hints, ...patch } }));

  const onStart = () => {
    const prepared = prepareRound({ ...set, display }, randomSeed());
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
                  className={radio}
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

        <fieldset>
          <legend className="text-sm font-bold">Word display</legend>
          <div className="mt-2 flex flex-col gap-2">
            {MODES.map((m) => (
              <div key={m.value}>
                <label className="flex items-start gap-2">
                  <input
                    type="radio"
                    name="mode"
                    className={`${radio} mt-1`}
                    checked={display.mode === m.value}
                    onChange={() =>
                      setDisplay((d) => ({
                        ...d,
                        mode: m.value,
                        showClues: m.value === "hidden" ? false : d.showClues,
                        allowHints: m.value === "hidden" ? d.allowHints : false,
                      }))
                    }
                  />
                  <span>
                    <span className="font-semibold">{m.label}</span>
                    <span className="block text-sm text-slate-500">{m.help}</span>
                  </span>
                </label>
                {m.value === "hidden" && display.mode === "hidden" && (
                  <div className="mt-2 ml-6 flex flex-col gap-3 rounded-xl bg-slate-50 p-3">
                    <label className="flex items-center gap-2 font-semibold">
                      <input
                        type="checkbox"
                        className={radio}
                        checked={display.allowHints}
                        onChange={(e) =>
                          setDisplay((d) => ({ ...d, allowHints: e.target.checked }))
                        }
                      />
                      Allow hints
                    </label>
                    {display.allowHints && (
                      <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                        <label className="flex flex-col gap-1">
                          <span className="font-semibold">Hints per student</span>
                          <select
                            className="rounded-lg border border-slate-300 bg-white px-2 py-1.5"
                            value={String(display.hints.perStudent)}
                            onChange={(e) =>
                              updateHints({
                                perStudent:
                                  e.target.value === "unlimited"
                                    ? "unlimited"
                                    : (Number(e.target.value) as 1 | 2 | 3 | 5),
                              })
                            }
                          >
                            {["1", "2", "3", "5", "unlimited"].map((v) => (
                              <option key={v} value={v}>
                                {v === "unlimited" ? "Unlimited" : v}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="font-semibold">Cooldown</span>
                          <select
                            className="rounded-lg border border-slate-300 bg-white px-2 py-1.5"
                            value={display.hints.cooldownSeconds}
                            onChange={(e) =>
                              updateHints({
                                cooldownSeconds: Number(e.target.value) as 0 | 10 | 20 | 30,
                              })
                            }
                          >
                            {[0, 10, 20, 30].map((v) => (
                              <option key={v} value={v}>
                                {v === 0 ? "None" : `${v} seconds`}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="font-semibold">Point cost</span>
                          <select
                            className="rounded-lg border border-slate-300 bg-white px-2 py-1.5"
                            value={display.hints.cost}
                            onChange={(e) =>
                              updateHints({ cost: e.target.value as "none" | "halfPoints" })
                            }
                          >
                            <option value="none">No cost</option>
                            <option value="halfPoints">Half points within 15 s</option>
                          </select>
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          <label
            className={`mt-3 flex items-center gap-2 font-semibold ${display.mode === "hidden" ? "text-slate-400" : ""}`}
          >
            <input
              type="checkbox"
              className={radio}
              disabled={display.mode === "hidden"}
              checked={display.showClues}
              onChange={(e) => setDisplay((d) => ({ ...d, showClues: e.target.checked }))}
            />
            Show clues instead of words
          </label>
        </fieldset>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-bold">Timer</span>
          <select
            className="w-40 rounded-lg border border-slate-300 bg-white px-2 py-1.5"
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

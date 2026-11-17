"use client";

import { useId } from "react";
import type { DisplaySettings, HintSettings, WordDisplayMode } from "@/lib/game";
import { check, select } from "@/components/ui/styles";

const MODES: { value: WordDisplayMode; label: string; help: string }[] = [
  {
    value: "list",
    label: "Show the full list",
    help: "All words appear together above the tiles.",
  },
  {
    value: "oneAtATime",
    label: "Show one at a time",
    help: "One word appears above the tiles; the next appears only after it's found.",
  },
  {
    value: "hidden",
    label: "Hide the words",
    help: "No words are shown. Students search the board on their own.",
  },
];

interface Props {
  value: DisplaySettings;
  onChange(next: DisplaySettings): void;
  error?: string;
}

/** The three display radios, the clue checkbox, and Allow hints + hint settings. */
export function DisplaySettingsFields({ value, onChange, error }: Props) {
  const id = useId();
  const setMode = (mode: WordDisplayMode) =>
    onChange({
      ...value,
      mode,
      showClues: mode === "hidden" ? false : value.showClues,
      allowHints: mode === "hidden" ? value.allowHints : false,
    });
  const setHints = (patch: Partial<HintSettings>) =>
    onChange({ ...value, hints: { ...value.hints, ...patch } });

  const radio = (m: (typeof MODES)[number]) => (
    <label className="flex cursor-pointer items-start gap-2.5 rounded-lg p-1.5 hover:bg-slate-50">
      <input
        type="radio"
        name={`${id}-mode`}
        value={m.value}
        className={`${check} mt-1`}
        checked={value.mode === m.value}
        onChange={() => setMode(m.value)}
      />
      <span>
        <span className="font-bold">{m.label}</span>
        <span className="block text-sm text-slate-500">{m.help}</span>
      </span>
    </label>
  );

  return (
    <fieldset className="flex flex-col gap-1" aria-describedby={error ? `${id}-error` : undefined}>
      <legend className="mb-1 text-sm font-bold text-slate-900">Word display</legend>
      {radio(MODES[0])}
      {radio(MODES[1])}
      <label
        className={`ml-8 flex items-center gap-2 rounded-lg p-1.5 text-sm font-semibold ${
          value.mode === "hidden"
            ? "text-slate-400"
            : "cursor-pointer text-slate-800 hover:bg-slate-50"
        }`}
      >
        <input
          type="checkbox"
          className={check}
          disabled={value.mode === "hidden"}
          checked={value.showClues}
          onChange={(e) => onChange({ ...value, showClues: e.target.checked })}
        />
        Show clues instead of words
      </label>
      {radio(MODES[2])}
      {value.mode === "hidden" && (
        <div className="ml-8 flex flex-col gap-3 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              className={check}
              checked={value.allowHints}
              onChange={(e) => onChange({ ...value, allowHints: e.target.checked })}
            />
            Allow hints
          </label>
          {value.allowHints && (
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
              <label className="flex flex-col gap-1">
                <span className="font-semibold">Hints per student</span>
                <select
                  className={select}
                  value={String(value.hints.perStudent)}
                  onChange={(e) =>
                    setHints({
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
                  className={select}
                  value={value.hints.cooldownSeconds}
                  onChange={(e) =>
                    setHints({ cooldownSeconds: Number(e.target.value) as 0 | 10 | 20 | 30 })
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
                  className={select}
                  value={value.hints.cost}
                  onChange={(e) => setHints({ cost: e.target.value as "none" | "halfPoints" })}
                >
                  <option value="none">No cost</option>
                  <option value="halfPoints">Half points within 15 s</option>
                </select>
              </label>
            </div>
          )}
        </div>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm font-semibold text-rose-700">
          {error}
        </p>
      )}
    </fieldset>
  );
}

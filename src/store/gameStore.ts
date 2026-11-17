"use client";

import { create } from "zustand";
import {
  createGame,
  endGame,
  requestHint,
  submitPath,
  tick,
  type GameConfig,
  type GameState,
  type HintResult,
  type SubmitOutcome,
} from "@/lib/game";

/** An in-flight hint flash: the planted path to animate, keyed so repeats re-trigger. */
export interface ActiveHint {
  key: number;
  wordId: number;
  path: number[];
}

interface GameStore {
  game: GameState | null;
  hint: ActiveHint | null;
  start(config: GameConfig): void;
  submit(path: number[]): SubmitOutcome;
  takeHint(): HintResult | null;
  clearHint(key: number): void;
  tick(): void;
  end(): void;
  reset(): void;
}

/** Single-player round state (in memory; live rounds sync this in Phase 5). */
export const useGameStore = create<GameStore>((set, get) => ({
  game: null,
  hint: null,
  start: (config) => set({ game: createGame(config, Date.now()), hint: null }),
  submit: (path) => {
    const { game } = get();
    if (!game) return { type: "ignored" };
    const { state, outcome } = submitPath(game, path, Date.now());
    set({ game: state });
    return outcome;
  },
  takeHint: () => {
    const { game } = get();
    if (!game) return null;
    const result = requestHint(game, Date.now(), Math.random);
    set({
      game: result.state,
      ...(result.ok
        ? { hint: { key: Date.now(), wordId: result.word.id, path: result.path } }
        : {}),
    });
    return result;
  },
  clearHint: (key) => {
    if (get().hint?.key === key) set({ hint: null });
  },
  tick: () => {
    const { game } = get();
    if (!game) return;
    const next = tick(game, Date.now());
    if (next !== game) set({ game: next });
  },
  end: () => {
    const { game } = get();
    if (game) set({ game: endGame(game, Date.now()) });
  },
  reset: () => set({ game: null, hint: null }),
}));

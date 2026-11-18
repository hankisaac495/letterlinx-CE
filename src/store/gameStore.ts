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
  /** Maps real time to game time. Live rounds use the room clock (pauses, skew). */
  toGameNow: (realNow: number) => number;
  start(
    config: GameConfig,
    options?: { startedAt?: number; toGameNow?: (realNow: number) => number },
  ): void;
  /** Replace the whole game (e.g. restored after a reload). */
  load(game: GameState, toGameNow: (realNow: number) => number): void;
  setClock(toGameNow: (realNow: number) => number): void;
  submit(path: number[]): SubmitOutcome;
  takeHint(): HintResult | null;
  clearHint(key: number): void;
  tick(): void;
  end(): void;
  reset(): void;
}

/** Single-player round state (in memory; live rounds sync this in Phase 5). */
const identity = (n: number) => n;

export const useGameStore = create<GameStore>((set, get) => ({
  game: null,
  hint: null,
  toGameNow: identity,
  start: (config, options = {}) => {
    const toGameNow = options.toGameNow ?? identity;
    set({ game: createGame(config, options.startedAt ?? Date.now()), hint: null, toGameNow });
  },
  load: (game, toGameNow) => set({ game, hint: null, toGameNow }),
  setClock: (toGameNow) => set({ toGameNow }),
  submit: (path) => {
    const { game } = get();
    if (!game) return { type: "ignored" };
    const { state, outcome } = submitPath(game, path, get().toGameNow(Date.now()));
    set({ game: state });
    return outcome;
  },
  takeHint: () => {
    const { game } = get();
    if (!game) return null;
    const result = requestHint(game, get().toGameNow(Date.now()), Math.random);
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
    const next = tick(game, get().toGameNow(Date.now()));
    if (next !== game) set({ game: next });
  },
  end: () => {
    const { game } = get();
    if (game) set({ game: endGame(game, get().toGameNow(Date.now())) });
  },
  reset: () => set({ game: null, hint: null, toGameNow: identity }),
}));

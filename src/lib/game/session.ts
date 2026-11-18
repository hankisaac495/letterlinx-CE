/**
 * Pure single-player game state. The UI, live rounds and simulated bots all drive
 * a round through these functions, so rules live in exactly one place.
 * Times are absolute milliseconds (e.g. Date.now()) passed in by the caller.
 */
import { isValidPath, wordFromPath, type Board } from "./board";
import type { RoundDuration } from "./constants";
import type { Rng } from "./rng";
import { HINT_PENALTY_WINDOW_MS, scoreWord } from "./scoring";
import type { DisplaySettings } from "./types";

export interface TargetWord {
  /** Position in the teacher's list (also the colour / badge number). */
  id: number;
  normalized: string;
  /** Original spelling with accents, uppercased. */
  display: string;
  clue: string;
  /** Planted path, used for hints and the reveal. */
  path: number[];
}

export interface GameConfig {
  board: Board;
  words: TargetWord[];
  display: DisplaySettings;
  duration: RoundDuration;
}

export interface FoundWord {
  wordId: number;
  /** Path the student actually traced (may differ from the planted one). */
  path: number[];
  /** ms since round start. */
  elapsedMs: number;
  points: number;
  /** Scored at half points because of a recent hint. */
  hintPenalty: boolean;
}

export interface HintUse {
  wordId: number;
  elapsedMs: number;
}

export type GameStatus = "playing" | "complete" | "timeUp" | "ended";

export interface GameState {
  config: GameConfig;
  startedAt: number;
  status: GameStatus;
  /** ms since start when status left "playing". */
  finishedMs: number | null;
  found: FoundWord[];
  hints: HintUse[];
  misses: number;
  score: number;
}

export type SubmitOutcome =
  | { type: "found"; found: FoundWord; word: TargetWord }
  | { type: "alreadyFound"; word: TargetWord }
  | { type: "miss" }
  /** Too short, invalid path or round not running: no reaction. */
  | { type: "ignored" };

export const MIN_SUBMIT_TILES = 3;

export function createGame(config: GameConfig, now: number): GameState {
  return {
    config,
    startedAt: now,
    status: "playing",
    finishedMs: null,
    found: [],
    hints: [],
    misses: 0,
    score: 0,
  };
}

export function elapsedMs(state: GameState, now: number): number {
  return state.finishedMs ?? Math.max(0, now - state.startedAt);
}

/** Remaining ms, or null for untimed rounds. */
export function timeRemainingMs(state: GameState, now: number): number | null {
  const { duration } = state.config;
  if (duration === "untimed") return null;
  return Math.max(0, duration * 1000 - elapsedMs(state, now));
}

export function isFound(state: GameState, wordId: number): boolean {
  return state.found.some((f) => f.wordId === wordId);
}

export function unfoundWords(state: GameState): TargetWord[] {
  return state.config.words.filter((w) => !isFound(state, w.id));
}

/** In one-at-a-time mode, the word students must find next (teacher's order). */
export function currentWord(state: GameState): TargetWord | null {
  return unfoundWords(state)[0] ?? null;
}

/** Words a submission may match right now. */
function acceptableWords(state: GameState): TargetWord[] {
  if (state.config.display.mode === "oneAtATime") {
    const current = currentWord(state);
    return current ? [current] : [];
  }
  return unfoundWords(state);
}

/** Ends the round if the timer has run out. */
export function tick(state: GameState, now: number): GameState {
  if (state.status !== "playing") return state;
  const remaining = timeRemainingMs(state, now);
  if (remaining !== null && remaining <= 0) {
    return { ...state, status: "timeUp", finishedMs: (state.config.duration as number) * 1000 };
  }
  return state;
}

/** The teacher (or the player) ends the round early. */
export function endGame(state: GameState, now: number): GameState {
  if (state.status !== "playing") return state;
  return { ...state, status: "ended", finishedMs: elapsedMs(state, now) };
}

export function submitPath(
  prev: GameState,
  path: readonly number[],
  now: number,
): { state: GameState; outcome: SubmitOutcome } {
  const state = tick(prev, now);
  const { board } = state.config;
  if (state.status !== "playing" || path.length < MIN_SUBMIT_TILES || !isValidPath(path, board)) {
    return { state, outcome: { type: "ignored" } };
  }

  const letters = wordFromPath(board.tiles, path);
  const word = acceptableWords(state).find((w) => w.normalized === letters);

  if (!word) {
    const already = state.config.words.find(
      (w) => w.normalized === letters && isFound(state, w.id),
    );
    if (already) return { state, outcome: { type: "alreadyFound", word: already } };
    return { state: { ...state, misses: state.misses + 1 }, outcome: { type: "miss" } };
  }

  const elapsed = elapsedMs(state, now);
  const lastHint = [...state.hints].reverse().find((h) => h.wordId === word.id);
  const hintPenalty =
    state.config.display.hints.cost === "halfPoints" &&
    lastHint !== undefined &&
    elapsed - lastHint.elapsedMs <= HINT_PENALTY_WINDOW_MS;
  const { total } = scoreWord({
    letters: [...word.normalized].length,
    elapsedMs: elapsed,
    duration: state.config.duration,
    halved: hintPenalty,
  });

  const found: FoundWord = {
    wordId: word.id,
    path: [...path],
    elapsedMs: elapsed,
    points: total,
    hintPenalty,
  };
  const allFound = state.found.length + 1 === state.config.words.length;
  return {
    state: {
      ...state,
      found: [...state.found, found],
      score: state.score + total,
      status: allFound ? "complete" : "playing",
      finishedMs: allFound ? elapsed : null,
    },
    outcome: { type: "found", found, word },
  };
}

// ---------------------------------------------------------------------------
// Hints (Hide the words mode only, when the teacher allows them)

export interface HintAvailability {
  enabled: boolean;
  /** Hints left, or Infinity for unlimited. */
  remaining: number;
  cooldownMs: number;
  /** True when a hint can be taken right now. */
  ready: boolean;
}

export function hintsEnabled(config: Pick<GameConfig, "display">): boolean {
  return config.display.mode === "hidden" && config.display.allowHints;
}

export function hintAvailability(state: GameState, now: number): HintAvailability {
  const enabled = hintsEnabled(state.config);
  const { perStudent, cooldownSeconds } = state.config.display.hints;
  const limit = perStudent === "unlimited" ? Infinity : perStudent;
  const remaining = Math.max(0, limit - state.hints.length);
  const last = state.hints.at(-1);
  const cooldownMs = last
    ? Math.max(0, last.elapsedMs + cooldownSeconds * 1000 - elapsedMs(state, now))
    : 0;
  const ready =
    enabled &&
    state.status === "playing" &&
    remaining > 0 &&
    cooldownMs === 0 &&
    unfoundWords(state).length > 0;
  return { enabled, remaining, cooldownMs, ready };
}

export type HintResult =
  | { ok: true; state: GameState; word: TargetWord; path: number[] }
  | {
      ok: false;
      state: GameState;
      reason: "disabled" | "noneLeft" | "cooldown" | "notPlaying" | "allFound";
    };

/** Picks a random unfound word and returns its planted path to flash. */
export function requestHint(prev: GameState, now: number, rng: Rng): HintResult {
  const state = tick(prev, now);
  const a = hintAvailability(state, now);
  if (!a.enabled) return { ok: false, state, reason: "disabled" };
  if (state.status !== "playing") return { ok: false, state, reason: "notPlaying" };
  if (a.remaining <= 0) return { ok: false, state, reason: "noneLeft" };
  if (a.cooldownMs > 0) return { ok: false, state, reason: "cooldown" };
  const candidates = unfoundWords(state);
  if (candidates.length === 0) return { ok: false, state, reason: "allFound" };
  const word = candidates[Math.floor(rng() * candidates.length)];
  return {
    ok: true,
    word,
    path: [...word.path],
    state: {
      ...state,
      hints: [...state.hints, { wordId: word.id, elapsedMs: elapsedMs(state, now) }],
    },
  };
}

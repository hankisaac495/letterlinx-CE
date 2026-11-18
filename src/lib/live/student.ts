import { createGame, type GameConfig, type GameState } from "@/lib/game";
import { gameElapsedMs } from "./room";
import type { PlayerProgress, RoomClock, RoomSnapshot } from "./types";

export function gameConfigFromSnapshot(snapshot: RoomSnapshot): GameConfig {
  const { round } = snapshot;
  return {
    board: round.board,
    words: round.words,
    display: round.settings.display,
    duration: round.settings.duration,
  };
}

/**
 * Maps real time to the round's game time (the session's "now"): it stops while
 * paused and after the round ends. `offsetMs` corrects for host clock skew.
 */
export function makeGameClock(clock: RoomClock, offsetMs = 0): (realNow: number) => number {
  return (realNow) => (clock.startAt ?? 0) + gameElapsedMs(clock, realNow + offsetMs);
}

export function toProgress(game: GameState): PlayerProgress {
  return {
    score: game.score,
    found: game.found.map(({ wordId, elapsedMs, points, hintPenalty }) => ({
      wordId,
      elapsedMs,
      points,
      hintPenalty,
    })),
    hints: game.hints.map((h) => ({ ...h })),
    misses: game.misses,
    status: game.status,
    finishedMs: game.finishedMs,
  };
}

/** Rebuilds a student's game after a reload from the progress the host kept. */
export function restoreGame(
  config: GameConfig,
  startAt: number,
  progress: PlayerProgress,
): GameState {
  const base = createGame(config, startAt);
  return {
    ...base,
    score: progress.score,
    misses: progress.misses,
    hints: progress.hints.map((h) => ({ ...h })),
    status: progress.status,
    finishedMs: progress.finishedMs,
    found: progress.found.map((f) => ({
      ...f,
      path: config.words.find((w) => w.id === f.wordId)?.path ?? [],
    })),
  };
}

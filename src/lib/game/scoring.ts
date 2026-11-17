import type { RoundDuration } from "./constants";

export const POINTS_PER_LETTER = 10;
/** The speed bonus is worth up to this share of the base points. */
export const MAX_SPEED_BONUS_SHARE = 0.5;
/** In untimed rounds the speed bonus decays to zero over this many seconds. */
export const UNTIMED_BONUS_WINDOW_S = 180;
/** With "half points" hint cost, a word found within this window after its hint scores half. */
export const HINT_PENALTY_WINDOW_MS = 15_000;

export interface ScoreInput {
  letters: number;
  /** Milliseconds since the round started. */
  elapsedMs: number;
  duration: RoundDuration;
  halved: boolean;
}

export interface ScoreBreakdown {
  base: number;
  speedBonus: number;
  total: number;
}

export function scoreWord({ letters, elapsedMs, duration, halved }: ScoreInput): ScoreBreakdown {
  const base = letters * POINTS_PER_LETTER;
  const windowMs = (duration === "untimed" ? UNTIMED_BONUS_WINDOW_S : duration) * 1000;
  const remainingShare = Math.max(0, Math.min(1, 1 - elapsedMs / windowMs));
  const speedBonus = Math.round(base * MAX_SPEED_BONUS_SHARE * remainingShare);
  const raw = base + speedBonus;
  return { base, speedBonus, total: halved ? Math.round(raw / 2) : raw };
}

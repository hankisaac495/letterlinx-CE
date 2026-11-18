/**
 * Simulated students for "Simulate class". Each bot gets a plan of finds (and
 * hints) at round-time offsets; progress is recomputed from the plan, so pausing
 * the round pauses the bots too.
 */
import { HINT_PENALTY_WINDOW_MS, scoreWord, shuffle, type Rng, type TargetWord } from "@/lib/game";
import { hintsEnabled } from "@/lib/game/session";
import { BOT_FIRST_NAMES } from "./names";
import type { PlayerProgress, RoundConfig } from "./types";

export interface BotEvent {
  type: "find" | "hint";
  wordId: number;
  atMs: number;
}

export interface BotPlan {
  /** Lower is faster. */
  skill: number;
  events: BotEvent[];
}

const LETTER_INITIALS = "ABCDEFGHJKLMNPRSTVWZ";

export function botNames(
  count: number,
  rng: Rng,
  taken: ReadonlySet<string> = new Set(),
): string[] {
  const names: string[] = [];
  const pool = shuffle(rng, [...BOT_FIRST_NAMES]);
  let i = 0;
  while (names.length < count && i < pool.length * 4) {
    const name = `${pool[i % pool.length]} ${LETTER_INITIALS[Math.floor(rng() * LETTER_INITIALS.length)]}.`;
    if (!taken.has(name) && !names.includes(name)) names.push(name);
    i++;
  }
  return names;
}

/** Random multiplier with a long-ish tail (some words take a while). */
const noise = (rng: Rng) => Math.exp((rng() - 0.45) * 1.1);

export function planBot(
  round: Pick<RoundConfig, "words" | "settings">,
  rng: Rng,
  startOffsetMs = 0,
): BotPlan {
  const { words, settings } = round;
  const skill = 0.55 + rng() * 1.5;
  const order: TargetWord[] =
    settings.display.mode === "oneAtATime" ? [...words] : shuffle(rng, [...words]);
  const useHints = hintsEnabled(settings);
  const { perStudent, cooldownSeconds } = settings.display.hints;
  const hintLimit = perStudent === "unlimited" ? Infinity : perStudent;

  const events: BotEvent[] = [];
  let t = startOffsetMs + 1200 + rng() * 2500;
  let hintsUsed = 0;
  let lastHint = -Infinity;
  for (const w of order) {
    let gap = (3000 + [...w.normalized].length * 1000) * skill * noise(rng);
    if (useHints && hintsUsed < hintLimit && skill > 1 && rng() < 0.35) {
      const hintAt = Math.max(t + gap * 0.3, lastHint + cooldownSeconds * 1000);
      events.push({ type: "hint", wordId: w.id, atMs: Math.round(hintAt) });
      hintsUsed++;
      lastHint = hintAt;
      gap = hintAt - t + 2500 + rng() * 5000;
    }
    t += gap;
    events.push({ type: "find", wordId: w.id, atMs: Math.round(t) });
  }
  events.sort((a, b) => a.atMs - b.atMs);
  return { skill, events };
}

/** Progress a bot has made by `elapsedMs` of round time. */
export function botProgress(
  plan: BotPlan,
  round: Pick<RoundConfig, "words" | "settings">,
  elapsedMs: number,
): PlayerProgress {
  const progress: PlayerProgress = {
    score: 0,
    found: [],
    hints: [],
    misses: 0,
    status: "playing",
    finishedMs: null,
  };
  const limit = round.settings.duration === "untimed" ? Infinity : round.settings.duration * 1000;
  for (const e of plan.events) {
    if (e.atMs > elapsedMs || e.atMs > limit) break;
    if (e.type === "hint") {
      progress.hints.push({ wordId: e.wordId, elapsedMs: e.atMs });
      continue;
    }
    const word = round.words.find((w) => w.id === e.wordId)!;
    const hint = progress.hints.find((h) => h.wordId === e.wordId);
    const hintPenalty =
      round.settings.display.hints.cost === "halfPoints" &&
      !!hint &&
      e.atMs - hint.elapsedMs <= HINT_PENALTY_WINDOW_MS;
    const { total } = scoreWord({
      letters: [...word.normalized].length,
      elapsedMs: e.atMs,
      duration: round.settings.duration,
      halved: hintPenalty,
    });
    progress.found.push({ wordId: e.wordId, elapsedMs: e.atMs, points: total, hintPenalty });
    progress.score += total;
  }
  if (progress.found.length === round.words.length) {
    progress.status = "complete";
    progress.finishedMs = progress.found[progress.found.length - 1].elapsedMs;
  }
  return progress;
}

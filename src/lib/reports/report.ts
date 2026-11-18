import { generateBoard, type Board } from "@/lib/game";
import { gameElapsedMs, type RoomState } from "@/lib/live";
import type { ResultPlayer, RoundResult } from "./types";

/** Snapshot of an ended room for the reports store. */
export function toRoundResult(room: RoomState): RoundResult | null {
  const { clock, round } = room;
  if (room.phase !== "ended" || clock.startAt === null || clock.endedAt === null) return null;
  return {
    id: `${room.code}-${room.roundNumber}`,
    code: room.code,
    roundNumber: room.roundNumber,
    title: round.title,
    language: round.board.language,
    seed: round.board.seed,
    words: round.words,
    settings: round.settings,
    sectionId: round.sectionId,
    teacherId: round.teacherId ?? null,
    wordSetId: round.wordSetId,
    startedAt: clock.startAt,
    endedAt: clock.endedAt,
    playedMs: Math.max(0, gameElapsedMs(clock, clock.endedAt)),
    players: room.players.map(({ id, name, isBot, team, progress }) => ({
      id,
      name,
      isBot,
      team,
      progress,
    })),
  };
}

/** Rebuilds the round's board from its stored seed. */
export function regenerateBoard(result: RoundResult): Board | null {
  const r = generateBoard(
    result.words.map((w) => w.normalized),
    { seed: result.seed, language: result.language },
  );
  return r.ok ? r.board : null;
}

// --- Per student --------------------------------------------------------------

export interface StudentRow {
  rank: number;
  id: string;
  name: string;
  isBot: boolean;
  team: number | null;
  score: number;
  found: number;
  total: number;
  completed: boolean;
  /** Time to find all words, when completed. */
  finishedMs: number | null;
  hintsUsed: number;
  hintedWords: string[];
  /** Time to find each word (by word id), null if not found. */
  wordTimes: (number | null)[];
  /** Word ids scored at half points after a hint. */
  halfPointWords: number[];
}

export function studentRows(result: RoundResult): StudentRow[] {
  const total = result.words.length;
  const sorted = [...result.players].sort(
    (a, b) =>
      b.progress.score - a.progress.score ||
      b.progress.found.length - a.progress.found.length ||
      (a.progress.finishedMs ?? Infinity) - (b.progress.finishedMs ?? Infinity) ||
      a.name.localeCompare(b.name),
  );
  let rank = 0;
  let prev: number | null = null;
  return sorted.map((p: ResultPlayer, i) => {
    if (p.progress.score !== prev) rank = i + 1;
    prev = p.progress.score;
    const display = (id: number) => result.words.find((w) => w.id === id)?.display ?? `#${id + 1}`;
    return {
      rank,
      id: p.id,
      name: p.name,
      isBot: p.isBot,
      team: p.team,
      score: p.progress.score,
      found: p.progress.found.length,
      total,
      completed: p.progress.found.length === total,
      finishedMs: p.progress.found.length === total ? p.progress.finishedMs : null,
      hintsUsed: p.progress.hints.length,
      hintedWords: [...new Set(p.progress.hints.map((h) => display(h.wordId)))],
      wordTimes: result.words.map(
        (w) => p.progress.found.find((f) => f.wordId === w.id)?.elapsedMs ?? null,
      ),
      halfPointWords: p.progress.found.filter((f) => f.hintPenalty).map((f) => f.wordId),
    };
  });
}

// --- Per word ------------------------------------------------------------------

export interface WordRow {
  id: number;
  word: string;
  clue: string;
  foundBy: number;
  players: number;
  /** 0–1 */
  share: number;
  avgMs: number | null;
  hints: number;
  /** Flagged as a word to review. */
  review: boolean;
}

/** Words found by fewer than this share of the class are always flagged. */
export const REVIEW_SHARE = 0.5;
/** The hardest N words are flagged when below this share. */
export const REVIEW_HARDEST = 2;
export const REVIEW_HARDEST_SHARE = 0.8;

export function wordRows(result: RoundResult): WordRow[] {
  const n = result.players.length;
  const rows: WordRow[] = result.words.map((w) => {
    const times = result.players.flatMap((p) =>
      p.progress.found.filter((f) => f.wordId === w.id).map((f) => f.elapsedMs),
    );
    return {
      id: w.id,
      word: w.display,
      clue: w.clue,
      foundBy: times.length,
      players: n,
      share: n ? times.length / n : 0,
      avgMs: times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null,
      hints: result.players.reduce(
        (s, p) => s + p.progress.hints.filter((h) => h.wordId === w.id).length,
        0,
      ),
      review: false,
    };
  });
  if (n === 0) return rows;
  const hardest = [...rows]
    .sort((a, b) => a.share - b.share || (b.avgMs ?? Infinity) - (a.avgMs ?? Infinity))
    .slice(0, REVIEW_HARDEST)
    .filter((r) => r.share < REVIEW_HARDEST_SHARE)
    .map((r) => r.id);
  return rows.map((r) => ({ ...r, review: r.share < REVIEW_SHARE || hardest.includes(r.id) }));
}

// --- Summaries -------------------------------------------------------------------

export interface RoundSummary {
  players: number;
  avgScore: number;
  /** Share of all (player, word) pairs found. */
  wordsFoundShare: number;
  /** Share of players who found every word. */
  completionShare: number;
  hintsUsed: number;
}

export function roundSummary(result: RoundResult): RoundSummary {
  const n = result.players.length;
  const total = result.words.length;
  if (n === 0)
    return { players: 0, avgScore: 0, wordsFoundShare: 0, completionShare: 0, hintsUsed: 0 };
  const found = result.players.reduce((s, p) => s + p.progress.found.length, 0);
  return {
    players: n,
    avgScore: Math.round(result.players.reduce((s, p) => s + p.progress.score, 0) / n),
    wordsFoundShare: total ? found / (n * total) : 0,
    completionShare: result.players.filter((p) => p.progress.found.length === total).length / n,
    hintsUsed: result.players.reduce((s, p) => s + p.progress.hints.length, 0),
  };
}

/** A section's rounds, oldest first (for "rounds played over time"). */
export function sectionHistory(results: RoundResult[], sectionId: string | null): RoundResult[] {
  return results.filter((r) => r.sectionId === sectionId).sort((a, b) => a.startedAt - b.startedAt);
}

import type { Board } from "./board";
import { generateBoard, type GenerationError } from "./generator";
import type { TargetWord } from "./session";
import type { WordSetDraft } from "./types";
import { validateWordSet, type WordSetValidation } from "./validation";

export type PrepareResult =
  | { ok: true; board: Board; words: TargetWord[] }
  | { ok: false; validation?: WordSetValidation; generation?: GenerationError };

/** Validates a word set and builds its board + target list for a given seed. */
export function prepareRound(draft: WordSetDraft, seed: number): PrepareResult {
  const validation = validateWordSet(draft);
  if (!validation.valid) return { ok: false, validation };
  const result = generateBoard(
    validation.words.map((w) => w.normalized),
    { seed, language: draft.language },
  );
  if (!result.ok) return { ok: false, generation: result.error };
  const pathFor = new Map(result.board.placements.map((p) => [p.word, p.path]));
  const words: TargetWord[] = validation.words.map((w, id) => ({
    id,
    normalized: w.normalized,
    display: w.display,
    clue: w.clue,
    path: pathFor.get(w.normalized) ?? [],
  }));
  return { ok: true, board: result.board, words };
}

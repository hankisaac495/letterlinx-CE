import {
  DEFAULT_DIMENSIONS,
  findWordPaths,
  neighborTable,
  type Board,
  type Dimensions,
  type Placement,
} from "./board";
import { createFillerSource, pickFiller, type FillerSource } from "./filler";
import { BOARD_SCAN_WORDS } from "./profanity";
import { createRng, deriveSeed, shuffle, type Rng } from "./rng";
import type { Language } from "./types";

export const DEFAULT_MAX_ATTEMPTS = 200;
/** DFS steps allowed per attempt before giving up on that seed. */
export const DEFAULT_STEP_BUDGET = 20_000;
/** Chance of trying tiles that already hold the right letter first (encourages crossings). */
const SHARE_PREFERENCE = 0.65;
const MAX_PROFANITY_REROLLS = 200;

export interface GenerateOptions {
  seed: number;
  language?: Language;
  dimensions?: Dimensions;
  maxAttempts?: number;
  stepBudget?: number;
}

export type GenerationErrorCode =
  "noWords" | "wordTooLongForBoard" | "tooManyLetters" | "placementFailed";

export interface GenerationError {
  code: GenerationErrorCode;
  /** The word causing the most trouble, when there is one. */
  word?: string;
  message: string;
}

export type GenerateResult =
  { ok: true; board: Board; attempts: number } | { ok: false; error: GenerationError };

/**
 * Deterministic order: longest first, ties alphabetical. Makes the board depend only on
 * the set of words and the seed, not on how the teacher ordered the list.
 */
export function placementOrder(words: readonly string[]): string[] {
  return [...new Set(words)].sort(
    (a, b) => [...b].length - [...a].length || (a < b ? -1 : a > b ? 1 : 0),
  );
}

class BudgetExceeded extends Error {}

interface AttemptResult {
  grid: (string | null)[];
  placements: Placement[];
}

/** One randomized-backtracking attempt. Returns null and reports the stuck word on failure. */
function placeAll(
  words: string[][],
  dims: Dimensions,
  rng: Rng,
  budget: number,
  onStuck: (wordIndex: number) => void,
): AttemptResult | null {
  const size = dims.cols * dims.rows;
  const neighbors = neighborTable(dims);
  const grid: (string | null)[] = new Array(size).fill(null);
  const placements: number[][] = [];
  let steps = 0;
  let furthest = 0;

  const order = (cells: number[], letter: string): number[] => {
    const fits = shuffle(
      rng,
      cells.filter((c) => grid[c] === null || grid[c] === letter),
    );
    if (rng() >= SHARE_PREFERENCE) return fits;
    // Stable partition: tiles already showing this letter first.
    return [...fits.filter((c) => grid[c] === letter), ...fits.filter((c) => grid[c] !== letter)];
  };

  const placeFrom = (wi: number): boolean => {
    if (wi === words.length) return true;
    furthest = Math.max(furthest, wi);
    const letters = words[wi];
    const path: number[] = [];
    const inPath = new Set<number>();

    const extend = (cell: number, k: number): boolean => {
      if (++steps > budget) throw new BudgetExceeded();
      path.push(cell);
      inPath.add(cell);
      if (k === letters.length - 1) {
        const written = path.filter((c) => grid[c] === null);
        for (let i = 0; i < path.length; i++) grid[path[i]] = letters[i];
        placements.push([...path]);
        if (placeFrom(wi + 1)) return true;
        placements.pop();
        for (const c of written) grid[c] = null;
      } else {
        const next = order(
          neighbors[cell].filter((c) => !inPath.has(c)),
          letters[k + 1],
        );
        for (const nb of next) if (extend(nb, k + 1)) return true;
      }
      path.pop();
      inPath.delete(cell);
      return false;
    };

    const starts = order(
      Array.from({ length: size }, (_, i) => i),
      letters[0],
    );
    for (const s of starts) if (extend(s, 0)) return true;
    return false;
  };

  try {
    if (placeFrom(0)) {
      return {
        grid,
        placements: placements.map((path, i) => ({ word: words[i].join(""), path })),
      };
    }
  } catch (e) {
    if (!(e instanceof BudgetExceeded)) throw e;
  }
  onStuck(furthest);
  return null;
}

/**
 * Fills empty tiles, then rerolls filler that accidentally spells a profane word.
 * Returns false if the board couldn't be cleaned (caller tries another seed).
 */
function fillAndClean(
  grid: (string | null)[],
  dims: Dimensions,
  rng: Rng,
  source: FillerSource,
  targetWords: ReadonlySet<string>,
): string[] | null {
  const isFiller = grid.map((c) => c === null);
  const tiles = grid.map((c) => c ?? pickFiller(rng, source));
  const scanList = BOARD_SCAN_WORDS.filter((w) => !targetWords.has(w));

  for (let i = 0; i < MAX_PROFANITY_REROLLS; i++) {
    let offending: number[] | null = null;
    for (const bad of scanList) {
      const paths = findWordPaths(tiles, dims, bad);
      offending = paths.find((p) => p.some((t) => isFiller[t])) ?? null;
      if (offending) break;
    }
    if (!offending) return tiles;
    const fillerTiles = offending.filter((t) => isFiller[t]);
    const tile = fillerTiles[Math.floor(rng() * fillerTiles.length)];
    const current = tiles[tile];
    let replacement = current;
    for (let tries = 0; tries < 20 && replacement === current; tries++) {
      replacement = pickFiller(rng, source);
    }
    tiles[tile] = replacement;
  }
  return null;
}

/**
 * Generates a static board hiding every word as a connected path of adjacent tiles.
 * Words are normalized (uppercase, accents stripped). Same words + seed ⇒ same board.
 */
export function generateBoard(words: readonly string[], options: GenerateOptions): GenerateResult {
  const dims = options.dimensions ?? DEFAULT_DIMENSIONS;
  const language = options.language ?? "en";
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const budget = options.stepBudget ?? DEFAULT_STEP_BUDGET;
  const size = dims.cols * dims.rows;

  const ordered = placementOrder(words.map((w) => w.trim().toUpperCase()).filter(Boolean));
  if (ordered.length === 0) {
    return { ok: false, error: { code: "noWords", message: "Add some words first." } };
  }
  const letters = ordered.map((w) => [...w]);

  const tooLong = letters.find((l) => l.length > size);
  if (tooLong) {
    const word = tooLong.join("");
    return {
      ok: false,
      error: {
        code: "wordTooLongForBoard",
        word,
        message: `${word} is longer than the board has tiles.`,
      },
    };
  }
  // Shared tiles can let a few more letters fit, but beyond 2× the board is hopeless.
  const total = letters.reduce((s, l) => s + l.length, 0);
  if (total > size * 2) {
    return {
      ok: false,
      error: {
        code: "tooManyLetters",
        message: `Too many letters (${total}) for a ${dims.cols} × ${dims.rows} board. Shorten the list.`,
      },
    };
  }

  const source = createFillerSource(ordered, language);
  const targets = new Set(ordered);
  const stuckCounts = new Map<number, number>();

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const rng = createRng(deriveSeed(options.seed, attempt));
    const placed = placeAll(letters, dims, rng, budget, (wi) =>
      stuckCounts.set(wi, (stuckCounts.get(wi) ?? 0) + 1),
    );
    if (!placed) continue;
    const tiles = fillAndClean(placed.grid, dims, rng, source, targets);
    if (!tiles) continue;
    return {
      ok: true,
      attempts: attempt + 1,
      board: {
        cols: dims.cols,
        rows: dims.rows,
        tiles,
        seed: options.seed >>> 0,
        language,
        placements: placed.placements,
      },
    };
  }

  let worst = 0;
  let worstCount = -1;
  for (const [wi, count] of stuckCounts) {
    if (count > worstCount || (count === worstCount && wi < worst)) {
      worst = wi;
      worstCount = count;
    }
  }
  const word = ordered[worst];
  return {
    ok: false,
    error: {
      code: "placementFailed",
      word,
      message: `We couldn't fit ${word} on the board. Try removing or shortening a word, or using fewer long words.`,
    },
  };
}

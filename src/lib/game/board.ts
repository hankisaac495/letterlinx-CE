import { BOARD_COLS, BOARD_ROWS } from "./constants";
import type { Language } from "./types";

export interface Placement {
  /** Normalized word. */
  word: string;
  /** Tile indices (row * cols + col) from first letter to last. */
  path: number[];
}

export interface Board {
  cols: number;
  rows: number;
  /** One letter per tile, row-major. */
  tiles: string[];
  /** Seed that regenerates this exact board for the same word list. */
  seed: number;
  language: Language;
  /** Planted path for every target word (used for hints and the end-of-round reveal). */
  placements: Placement[];
}

export interface Dimensions {
  cols: number;
  rows: number;
}

export const DEFAULT_DIMENSIONS: Dimensions = { cols: BOARD_COLS, rows: BOARD_ROWS };

export function toIndex(col: number, row: number, cols: number): number {
  return row * cols + col;
}

export function toCoords(index: number, cols: number): { col: number; row: number } {
  return { col: index % cols, row: Math.floor(index / cols) };
}

const neighborCache = new Map<string, number[][]>();

/** 8-direction neighbours of every tile, cached per board size. */
export function neighborTable({ cols, rows }: Dimensions): number[][] {
  const key = `${cols}x${rows}`;
  const cached = neighborCache.get(key);
  if (cached) return cached;
  const table: number[][] = [];
  for (let i = 0; i < cols * rows; i++) {
    const { col, row } = toCoords(i, cols);
    const list: number[] = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const c = col + dc;
        const r = row + dr;
        if (c >= 0 && c < cols && r >= 0 && r < rows) list.push(toIndex(c, r, cols));
      }
    }
    table.push(list);
  }
  neighborCache.set(key, table);
  return table;
}

export function isAdjacent(a: number, b: number, cols: number): boolean {
  if (a === b) return false;
  const pa = toCoords(a, cols);
  const pb = toCoords(b, cols);
  return Math.abs(pa.col - pb.col) <= 1 && Math.abs(pa.row - pb.row) <= 1;
}

/** In range, no tile used twice, each step to an adjacent tile. */
export function isValidPath(path: readonly number[], { cols, rows }: Dimensions): boolean {
  if (path.length === 0) return false;
  const seen = new Set<number>();
  for (let i = 0; i < path.length; i++) {
    const t = path[i];
    if (!Number.isInteger(t) || t < 0 || t >= cols * rows || seen.has(t)) return false;
    seen.add(t);
    if (i > 0 && !isAdjacent(path[i - 1], t, cols)) return false;
  }
  return true;
}

export function wordFromPath(tiles: readonly string[], path: readonly number[]): string {
  return path.map((i) => tiles[i]).join("");
}

/**
 * All paths (up to `limit`) along which `word` can be traced on the board.
 * Tiles are visited in order, so results are deterministic.
 */
export function findWordPaths(
  tiles: readonly string[],
  dims: Dimensions,
  word: string,
  limit = Infinity,
): number[][] {
  const letters = [...word];
  const neighbors = neighborTable(dims);
  const results: number[][] = [];
  const path: number[] = [];
  const used = new Set<number>();

  const walk = (tile: number, k: number): boolean => {
    path.push(tile);
    used.add(tile);
    if (k === letters.length - 1) {
      results.push([...path]);
    } else {
      for (const nb of neighbors[tile]) {
        if (!used.has(nb) && tiles[nb] === letters[k + 1] && walk(nb, k + 1)) {
          path.pop();
          used.delete(tile);
          return true;
        }
      }
    }
    path.pop();
    used.delete(tile);
    return results.length >= limit;
  };

  if (letters.length === 0) return results;
  for (let i = 0; i < tiles.length; i++) {
    if (tiles[i] === letters[0] && walk(i, 0)) break;
  }
  return results;
}

export function findWordPath(
  tiles: readonly string[],
  dims: Dimensions,
  word: string,
): number[] | null {
  return findWordPaths(tiles, dims, word, 1)[0] ?? null;
}

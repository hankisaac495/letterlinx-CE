import { DEFAULT_DIMENSIONS, findWordPaths, isValidPath, wordFromPath, type Board } from "./board";
import {
  BOARD_COLS,
  BOARD_ROWS,
  MAX_TOTAL_LETTERS,
  MAX_WORD_LENGTH,
  MAX_WORDS,
  MIN_WORDS,
} from "./constants";
import { generateBoard, placementOrder } from "./generator";
import { normalizeWord } from "./normalize";
import { BOARD_SCAN_WORDS } from "./profanity";
import { createRng, randInt, shuffle } from "./rng";
import type { Language } from "./types";

const EN_BANK = [
  "ATOM",
  "CELL",
  "GENE",
  "ORBIT",
  "PLANET",
  "ENERGY",
  "MATTER",
  "FOSSIL",
  "MAGNET",
  "VOLCANO",
  "MINERAL",
  "PROTEIN",
  "NUCLEUS",
  "ECOSYSTEM",
  "HABITAT",
  "CLIMATE",
  "DENSITY",
  "FRICTION",
  "GRAVITY",
  "INERTIA",
  "MOLECULE",
  "ORGANISM",
  "PHOTON",
  "QUARTZ",
  "OXYGEN",
  "ZEBRA",
  "JUSTICE",
  "LIBERTY",
  "SENATE",
  "TREATY",
  "COLONY",
  "EMPIRE",
  "VERB",
  "NOUN",
  "ADVERB",
  "SIMILE",
  "METAPHOR",
  "SYLLABLE",
  "FRACTION",
  "DECIMAL",
  "INTEGER",
  "ANGLE",
  "VERTEX",
  "RADIUS",
  "PRISM",
  "CAT",
  "DOG",
  "SUN",
  "MAP",
  "KEY",
  "CATCH",
  "QUIZ",
  "WAX",
  "JAZZ",
];
const ES_BANK = [
  "niño",
  "niña",
  "año",
  "mañana",
  "señor",
  "canción",
  "árbol",
  "pingüino",
  "corazón",
  "jardín",
  "música",
  "lápiz",
  "ratón",
  "montaña",
  "español",
  "cumpleaños",
  "sueño",
  "teléfono",
  "escuela",
  "familia",
  "ventana",
  "cocina",
  "camión",
  "azúcar",
  "fútbol",
  "pájaro",
  "otoño",
  "baño",
  "piña",
  "café",
  "papá",
  "mamá",
  "leche",
  "queso",
  "reloj",
  "lluvia",
  "nieve",
  "sol",
  "luna",
  "mar",
];

function randomWordSet(rng: () => number, language: Language): string[] {
  const bank = (language === "es" ? ES_BANK : EN_BANK)
    .map((w) => normalizeWord(w, language).normalized)
    .filter((w) => w.length >= 3 && w.length <= MAX_WORD_LENGTH);
  const pool = shuffle(rng, [...new Set(bank)]);
  const target = MIN_WORDS + randInt(rng, MAX_WORDS - MIN_WORDS + 1);
  const chosen: string[] = [];
  let letters = 0;
  for (const w of pool) {
    if (chosen.length >= target) break;
    if (letters + w.length > MAX_TOTAL_LETTERS) continue;
    chosen.push(w);
    letters += w.length;
  }
  return chosen;
}

function expectBoardHides(board: Board, words: string[]) {
  expect(board.cols).toBe(BOARD_COLS);
  expect(board.rows).toBe(BOARD_ROWS);
  expect(board.tiles).toHaveLength(54);
  expect(board.tiles.every((t) => typeof t === "string" && [...t].length === 1)).toBe(true);
  expect(new Set(board.placements.map((p) => p.word))).toEqual(new Set(words));
  for (const { word, path } of board.placements) {
    expect(path).toHaveLength([...word].length);
    expect(isValidPath(path, board)).toBe(true);
    expect(wordFromPath(board.tiles, path)).toBe(word);
  }
}

function generateOk(words: string[], seed: number, language: Language = "en"): Board {
  const result = generateBoard(words, { seed, language });
  if (!result.ok)
    throw new Error(`generation failed for ${words.join(",")}: ${result.error.message}`);
  return result.board;
}

describe("generateBoard", () => {
  it("hides every word as a connected path on a 6 × 9 board", () => {
    const words = ["NUCLEUS", "PROTEIN", "CELL", "GENE", "ATOM"];
    expectBoardHides(generateOk(words, 1234), words);
  });

  it("is deterministic: same words + seed ⇒ identical board", () => {
    const words = ["GRAVITY", "INERTIA", "FRICTION", "DENSITY"];
    expect(generateOk(words, 99)).toEqual(generateOk(words, 99));
  });

  it("does not depend on the order the teacher typed the words", () => {
    const words = ["ORBIT", "PLANET", "MAGNET", "FOSSIL"];
    expect(generateOk(words, 5)).toEqual(generateOk([...words].reverse(), 5));
  });

  it("produces different layouts for different seeds (Shuffle board)", () => {
    const words = ["ORBIT", "PLANET", "MAGNET", "FOSSIL"];
    const boards = new Set([1, 2, 3, 4, 5].map((s) => generateOk(words, s).tiles.join("")));
    expect(boards.size).toBeGreaterThan(1);
  });

  it("orders placement longest first", () => {
    expect(placementOrder(["CAT", "ELEPHANT", "DOG", "HORSE"])).toEqual([
      "ELEPHANT",
      "HORSE",
      "CAT",
      "DOG",
    ]);
  });

  it("lets words share tiles where letters match", () => {
    // Across many seeds, at least some boards should use crossings.
    const words = ["ENERGY", "MATTER", "PLANET", "ORBIT", "GENE", "ATOM", "CELL"];
    let shared = 0;
    for (let seed = 0; seed < 20; seed++) {
      const board = generateOk(words, seed);
      const used = board.placements.flatMap((p) => p.path);
      if (new Set(used).size < used.length) shared++;
    }
    expect(shared).toBeGreaterThan(0);
  });

  it("handles 50+ random English word sets", () => {
    const rng = createRng(2024);
    for (let i = 0; i < 60; i++) {
      const words = randomWordSet(rng, "en");
      const board = generateOk(words, randInt(rng, 2 ** 32), "en");
      expectBoardHides(board, words);
    }
  });

  it("handles 50+ random Spanish word sets with Ñ and accents", () => {
    const rng = createRng(777);
    let sawEnye = false;
    for (let i = 0; i < 60; i++) {
      const words = randomWordSet(rng, "es");
      sawEnye ||= words.some((w) => w.includes("Ñ"));
      const board = generateOk(words, randInt(rng, 2 ** 32), "es");
      expectBoardHides(board, words);
      expect(board.tiles.some((t) => /[ÁÉÍÓÚÜ]/.test(t))).toBe(false);
    }
    expect(sawEnye).toBe(true);
  });

  it("fits a maximum set: 5 × 9 letters = 45 letters, across many seeds", () => {
    const words = ["ECOSYSTEM", "ORGANISMS", "MOLECULES", "FRICTIONS", "METAPHORS"];
    for (let seed = 0; seed < 40; seed++) {
      expectBoardHides(generateOk(words, seed), words);
    }
  });

  it("fits 8 words with no shared letters", () => {
    const words = ["ABCDE", "FGHIJ", "KLMNO", "PQRST", "UVWXY", "BDFHK", "ACEGI", "MOQSU"];
    expectBoardHides(generateOk(words, 3), words);
  });

  describe("filler", () => {
    it("avoids Q, X and Z when the word set doesn't use them", () => {
      const rng = createRng(11);
      for (let i = 0; i < 40; i++) {
        const words = randomWordSet(rng, "en").filter((w) => !/[QXZ]/.test(w));
        if (words.length < 3) continue;
        const board = generateOk(words, i);
        expect(board.tiles.join("")).not.toMatch(/[QXZ]/);
      }
    });

    it("may use Q/X/Z when the set does", () => {
      const words = ["QUIZ", "WAX", "JAZZ", "QUARTZ", "ZEBRA", "VERTEX"];
      const boards = Array.from({ length: 10 }, (_, s) => generateOk(words, s));
      // planted letters are there, and filler is allowed to repeat them
      for (const b of boards) expect(b.tiles.join("")).toMatch(/[QXZ]/);
    });

    it("avoids Ñ in Spanish filler unless the set uses it", () => {
      for (let seed = 0; seed < 20; seed++) {
        expect(generateOk(["CASA", "PERRO", "LECHE"], seed, "es").tiles).not.toContain("Ñ");
      }
    });

    it("mostly reuses the word set's own letters", () => {
      const words = ["BANANA", "CABANA", "NAAN"];
      const board = generateOk(words, 1);
      const planted = new Set(board.placements.flatMap((p) => p.path));
      const filler = board.tiles.filter((_, i) => !planted.has(i));
      const fromSet = filler.filter((t) => "BANC".includes(t)).length;
      expect(fromSet / filler.length).toBeGreaterThan(0.4);
    });

    it("never spells a profane word through filler tiles", () => {
      const words = ["CLASS", "GRASS", "BRASS", "SHIFT", "TITAN"];
      for (let seed = 0; seed < 30; seed++) {
        const board = generateOk(words, seed);
        const planted = new Set(board.placements.flatMap((p) => p.path));
        for (const bad of BOARD_SCAN_WORDS) {
          for (const path of findWordPaths(board.tiles, DEFAULT_DIMENSIONS, bad)) {
            expect(path.every((t) => planted.has(t))).toBe(true);
          }
        }
      }
    });
  });

  describe("failure", () => {
    it("fails gracefully and names the troublesome word", () => {
      // 9 distinct letters twice on a 3 × 3 board can't both fit.
      const result = generateBoard(["ABCDEFGHI", "JKLMNOPQR"], {
        seed: 1,
        dimensions: { cols: 3, rows: 3 },
        maxAttempts: 20,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("placementFailed");
        expect(result.error.word).toBe("JKLMNOPQR");
        expect(result.error.message).toMatch(/JKLMNOPQR/);
        expect(result.error.message).toMatch(/shorten/i);
      }
    });

    it("rejects a word longer than the board", () => {
      const result = generateBoard(["ABCDEFGHIJ"], { seed: 1, dimensions: { cols: 3, rows: 3 } });
      expect(result).toMatchObject({
        ok: false,
        error: { code: "wordTooLongForBoard", word: "ABCDEFGHIJ" },
      });
    });

    it("rejects an empty list", () => {
      expect(generateBoard([], { seed: 1 })).toMatchObject({
        ok: false,
        error: { code: "noWords" },
      });
    });
  });
});

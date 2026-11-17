import type { Rng } from "./rng";
import { weightedPick } from "./rng";
import type { Language } from "./types";

/** Approximate letter frequencies (percent). */
const FREQUENCIES: Record<Language, readonly (readonly [string, number])[]> = {
  en: [
    ["E", 12.7],
    ["T", 9.1],
    ["A", 8.2],
    ["O", 7.5],
    ["I", 7.0],
    ["N", 6.7],
    ["S", 6.3],
    ["H", 6.1],
    ["R", 6.0],
    ["D", 4.3],
    ["L", 4.0],
    ["C", 2.8],
    ["U", 2.8],
    ["M", 2.4],
    ["W", 2.4],
    ["F", 2.2],
    ["G", 2.0],
    ["Y", 2.0],
    ["P", 1.9],
    ["B", 1.5],
    ["V", 1.0],
    ["K", 0.8],
    ["J", 0.15],
    ["X", 0.15],
    ["Q", 0.1],
    ["Z", 0.07],
  ],
  es: [
    ["E", 13.7],
    ["A", 12.5],
    ["O", 8.7],
    ["S", 8.0],
    ["R", 6.9],
    ["N", 6.7],
    ["I", 6.3],
    ["D", 5.9],
    ["L", 5.0],
    ["C", 4.7],
    ["T", 4.6],
    ["U", 3.9],
    ["M", 3.2],
    ["P", 2.5],
    ["B", 1.4],
    ["G", 1.0],
    ["V", 0.9],
    ["Y", 0.9],
    ["Q", 0.9],
    ["H", 0.7],
    ["F", 0.7],
    ["Z", 0.5],
    ["J", 0.4],
    ["Ñ", 0.3],
    ["X", 0.2],
    ["W", 0.02],
    ["K", 0.01],
  ],
};

/** Letters kept out of filler unless the word set itself uses them. */
const RARE: Record<Language, ReadonlySet<string>> = {
  en: new Set(["Q", "X", "Z"]),
  es: new Set(["Q", "X", "Z", "K", "W", "Ñ"]),
};

/** Share of filler drawn from the word set's own letters (so words don't stand out). */
export const WORD_LETTER_SHARE = 0.6;

export interface FillerSource {
  /** Every letter of every target word, with repeats (weights by use). */
  setLetters: string[];
  frequency: readonly (readonly [string, number])[];
}

export function createFillerSource(words: readonly string[], language: Language): FillerSource {
  const setLetters = words.flatMap((w) => [...w]);
  const used = new Set(setLetters);
  const frequency = FREQUENCIES[language].filter(
    ([letter]) => !RARE[language].has(letter) || used.has(letter),
  );
  return { setLetters, frequency };
}

export function pickFiller(rng: Rng, source: FillerSource): string {
  if (source.setLetters.length > 0 && rng() < WORD_LETTER_SHARE) {
    return source.setLetters[Math.floor(rng() * source.setLetters.length)];
  }
  return weightedPick(rng, source.frequency);
}

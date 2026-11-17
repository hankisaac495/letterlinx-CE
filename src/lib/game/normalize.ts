import type { Language } from "./types";

const N_TILDE = "Ñ";
const PLACEHOLDER = "\u0000";

export interface NormalizedWord {
  /** Uppercased original spelling, accents kept (for the word list). */
  display: string;
  /** Letters used for matching on the board: A–Z, plus Ñ in Spanish. */
  normalized: string;
  /** Characters that are not allowed (spaces, digits, punctuation, Ñ in English, …). */
  invalidChars: string[];
}

function allowedPattern(language: Language): RegExp {
  return language === "es" ? /^[A-ZÑ]$/ : /^[A-Z]$/;
}

/**
 * Uppercases a word and strips accents for matching (á → A, ü → U).
 * Ñ is a distinct letter in Spanish and is preserved there.
 */
export function normalizeWord(raw: string, language: Language): NormalizedWord {
  const trimmed = raw.trim().normalize("NFC");
  const display = trimmed.toLocaleUpperCase(language === "es" ? "es" : "en");

  const stripped = display
    .replaceAll(N_TILDE, PLACEHOLDER)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replaceAll(PLACEHOLDER, N_TILDE);

  const allowed = allowedPattern(language);
  const invalid = new Set<string>();
  for (const ch of stripped) {
    if (!allowed.test(ch)) invalid.add(ch);
  }

  return { display, normalized: stripped, invalidChars: [...invalid] };
}

/** Letters a filler / tile may use for a language. */
export function alphabetFor(language: Language): string[] {
  const base = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  return language === "es" ? [...base, N_TILDE] : base;
}

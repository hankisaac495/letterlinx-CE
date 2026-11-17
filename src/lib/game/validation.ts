import {
  MAX_CLUE_LENGTH,
  MAX_TOTAL_LETTERS,
  MAX_WORD_LENGTH,
  MAX_WORDS,
  MIN_WORD_LENGTH,
  MIN_WORDS,
} from "./constants";
import { normalizeWord } from "./normalize";
import { isProfane } from "./profanity";
import type { WordSetDraft } from "./types";

export type IssueCode =
  | "titleRequired"
  | "tooFewWords"
  | "tooManyWords"
  | "wordRequired"
  | "wordTooShort"
  | "wordTooLong"
  | "invalidCharacters"
  | "nTildeNeedsSpanish"
  | "duplicateWord"
  | "profaneWord"
  | "tooManyLetters"
  | "clueTooLong"
  | "clueRequired"
  | "cluesNotAllowedWhenHidden"
  | "hintsOnlyWhenHidden"
  | "wordContainsWord";

export type IssueField = "title" | "words" | "word" | "clue" | "display";

export interface ValidationIssue {
  code: IssueCode;
  field: IssueField;
  /** Index into draft.words for word/clue issues. */
  index?: number;
  params?: Record<string, string | number>;
  /** English message. UI may translate using code + params. */
  message: string;
}

export interface ValidatedWord {
  /** Index into draft.words. */
  index: number;
  display: string;
  normalized: string;
  clue: string;
}

export interface WordSetValidation {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  /** Letters counted toward the 45-letter cap. */
  totalLetters: number;
  maxLetters: number;
  /** Non-blank words in order, normalized (includes invalid ones). */
  words: ValidatedWord[];
}

const isBlank = (s: string | undefined) => !s || s.trim() === "";

/**
 * Validates a word set against the rules in section 4. Blank rows (no word and
 * no clue) are ignored so editors can keep spare empty rows.
 */
export function validateWordSet(draft: WordSetDraft): WordSetValidation {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const words: ValidatedWord[] = [];

  if (isBlank(draft.title)) {
    errors.push({ code: "titleRequired", field: "title", message: "Give the word set a title." });
  }

  draft.words.forEach((entry, index) => {
    const clue = (entry.clue ?? "").trim();
    if (isBlank(entry.text)) {
      if (clue) {
        errors.push({
          code: "wordRequired",
          field: "word",
          index,
          message: "Enter a word for this clue, or clear the clue.",
        });
      }
      return;
    }

    const { display, normalized, invalidChars } = normalizeWord(entry.text, draft.language);
    words.push({ index, display, normalized, clue });

    if (invalidChars.length > 0) {
      if (draft.language === "en" && invalidChars.every((c) => c === "Ñ")) {
        errors.push({
          code: "nTildeNeedsSpanish",
          field: "word",
          index,
          message: "Ñ is only allowed in Spanish word sets.",
        });
      } else {
        const shown = invalidChars.map((c) => (c === " " ? "spaces" : `"${c}"`)).join(", ");
        errors.push({
          code: "invalidCharacters",
          field: "word",
          index,
          params: { chars: invalidChars.join("") },
          message: `Letters only — remove ${shown}.`,
        });
      }
    } else if (normalized.length < MIN_WORD_LENGTH) {
      errors.push({
        code: "wordTooShort",
        field: "word",
        index,
        params: { min: MIN_WORD_LENGTH },
        message: `Words need at least ${MIN_WORD_LENGTH} letters.`,
      });
    } else if (normalized.length > MAX_WORD_LENGTH) {
      errors.push({
        code: "wordTooLong",
        field: "word",
        index,
        params: { max: MAX_WORD_LENGTH, length: normalized.length },
        message: `Words can have at most ${MAX_WORD_LENGTH} letters (this one has ${normalized.length}).`,
      });
    }

    if (isProfane(normalized)) {
      errors.push({
        code: "profaneWord",
        field: "word",
        index,
        message: "This word isn't allowed. Please choose another.",
      });
    }

    if (clue.length > MAX_CLUE_LENGTH) {
      errors.push({
        code: "clueTooLong",
        field: "clue",
        index,
        params: { max: MAX_CLUE_LENGTH, length: clue.length },
        message: `Clues can be at most ${MAX_CLUE_LENGTH} characters (${clue.length} now).`,
      });
    }
  });

  // Duplicates (compared after normalization, so "Árbol" and "ARBOL" clash).
  const firstSeen = new Map<string, number>();
  for (const w of words) {
    const prev = firstSeen.get(w.normalized);
    if (prev === undefined) {
      firstSeen.set(w.normalized, w.index);
    } else {
      errors.push({
        code: "duplicateWord",
        field: "word",
        index: w.index,
        params: { word: w.display },
        message: `${w.display} is already in the list.`,
      });
    }
  }

  // Containment warnings (CAT inside CATCH).
  const unique = words.filter((w) => firstSeen.get(w.normalized) === w.index);
  for (const inner of unique) {
    for (const outer of unique) {
      if (
        inner !== outer &&
        inner.normalized.length >= MIN_WORD_LENGTH &&
        outer.normalized.includes(inner.normalized)
      ) {
        warnings.push({
          code: "wordContainsWord",
          field: "word",
          index: inner.index,
          params: { inner: inner.display, outer: outer.display },
          message: `${inner.display} is inside ${outer.display}. Students may find it there too.`,
        });
      }
    }
  }

  if (words.length < MIN_WORDS) {
    errors.push({
      code: "tooFewWords",
      field: "words",
      params: { min: MIN_WORDS, count: words.length },
      message: `Add at least ${MIN_WORDS} words (you have ${words.length}).`,
    });
  } else if (words.length > MAX_WORDS) {
    errors.push({
      code: "tooManyWords",
      field: "words",
      params: { max: MAX_WORDS, count: words.length },
      message: `Use at most ${MAX_WORDS} words (you have ${words.length}).`,
    });
  }

  const totalLetters = words.reduce((sum, w) => sum + [...w.normalized].length, 0);
  if (totalLetters > MAX_TOTAL_LETTERS) {
    errors.push({
      code: "tooManyLetters",
      field: "words",
      params: { max: MAX_TOTAL_LETTERS, count: totalLetters },
      message: `Too many letters: ${totalLetters} / ${MAX_TOTAL_LETTERS}. Remove or shorten a word.`,
    });
  }

  // Display settings.
  const { display } = draft;
  if (display.showClues && display.mode === "hidden") {
    errors.push({
      code: "cluesNotAllowedWhenHidden",
      field: "display",
      message: "Clues can't be shown when words are hidden.",
    });
  }
  if (display.allowHints && display.mode !== "hidden") {
    errors.push({
      code: "hintsOnlyWhenHidden",
      field: "display",
      message: "Hints are only available when words are hidden.",
    });
  }
  if (display.showClues && display.mode !== "hidden") {
    for (const w of words) {
      if (!w.clue) {
        errors.push({
          code: "clueRequired",
          field: "clue",
          index: w.index,
          message: "Add a clue for this word, or turn off “Show clues instead of words”.",
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    totalLetters,
    maxLetters: MAX_TOTAL_LETTERS,
    words,
  };
}

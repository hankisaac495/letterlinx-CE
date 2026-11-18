import { translate } from "./core";
import { MESSAGES, type MessageKey } from "./messages";

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("messages", () => {
  it("has English and Spanish text for every key", () => {
    for (const [key, [en, es]] of Object.entries(MESSAGES)) {
      expect(en.trim(), key).not.toBe("");
      expect(es.trim(), key).not.toBe("");
    }
  });

  it("uses the same placeholders in both languages", () => {
    for (const [key, [en, es]] of Object.entries(MESSAGES)) {
      expect(placeholders(es), key).toEqual(placeholders(en));
    }
  });

  it("fills placeholders and switches language", () => {
    const key: MessageKey = "game.foundOf";
    expect(translate("en", key, { found: 2, total: 6 })).toBe("2 of 6 found");
    expect(translate("es", key, { found: 2, total: 6 })).toBe("2 de 6 encontradas");
  });

  it("covers every validation and generation code", () => {
    const codes = [
      "titleRequired",
      "tooFewWords",
      "tooManyWords",
      "wordRequired",
      "wordTooShort",
      "wordTooLong",
      "invalidCharacters",
      "nTildeNeedsSpanish",
      "duplicateWord",
      "profaneWord",
      "tooManyLetters",
      "clueTooLong",
      "clueRequired",
      "cluesNotAllowedWhenHidden",
      "hintsOnlyWhenHidden",
      "wordContainsWord",
    ];
    for (const c of codes) expect(`validation.${c}` in MESSAGES).toBe(true);
    for (const c of ["noWords", "wordTooLongForBoard", "tooManyLetters", "placementFailed"]) {
      expect(`generation.${c}` in MESSAGES).toBe(true);
    }
  });
});

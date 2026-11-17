import { DEFAULT_DISPLAY_SETTINGS, type DisplaySettings, type WordSetDraft } from "./types";
import { validateWordSet } from "./validation";

function draft(
  words: (string | { text: string; clue?: string })[],
  extra: Partial<WordSetDraft> = {},
): WordSetDraft {
  return {
    title: "Biology",
    language: "en",
    display: DEFAULT_DISPLAY_SETTINGS,
    words: words.map((w) => (typeof w === "string" ? { text: w } : w)),
    ...extra,
  };
}
const codes = (v: ReturnType<typeof validateWordSet>) => v.errors.map((e) => e.code);

describe("validateWordSet", () => {
  it("accepts a valid set and uppercases words", () => {
    const v = validateWordSet(draft(["cell", "Nucleus", "ATOM"]));
    expect(v.valid).toBe(true);
    expect(v.words.map((w) => w.normalized)).toEqual(["CELL", "NUCLEUS", "ATOM"]);
    expect(v.totalLetters).toBe(15);
    expect(v.maxLetters).toBe(45);
  });

  it("requires a title", () => {
    expect(codes(validateWordSet(draft(["cell", "atom", "gene"], { title: "  " })))).toContain(
      "titleRequired",
    );
  });

  it("enforces 3–8 words, ignoring blank rows", () => {
    expect(codes(validateWordSet(draft(["cell", "atom", "", "  "])))).toContain("tooFewWords");
    const nine = ["ant", "bee", "cow", "dog", "elk", "fox", "gnu", "hen", "owl"];
    expect(codes(validateWordSet(draft(nine)))).toContain("tooManyWords");
    expect(validateWordSet(draft(nine.slice(0, 8))).valid).toBe(true);
  });

  it("enforces 3–9 letters per word with the word's index", () => {
    const v = validateWordSet(draft(["ox", "cell", "photosynthesis"]));
    expect(v.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "wordTooShort", index: 0 }),
        expect.objectContaining({ code: "wordTooLong", index: 2 }),
      ]),
    );
    expect(validateWordSet(draft(["abc", "abcdefghi", "cell"])).valid).toBe(true);
  });

  it("allows letters only", () => {
    for (const bad of ["ice cream", "x-ray", "abc1", "don't"]) {
      expect(codes(validateWordSet(draft([bad, "cell", "atom"])))).toContain("invalidCharacters");
    }
  });

  it("caps the total at 45 letters", () => {
    const five = ["abcdefghi", "bcdefghij", "cdefghijk", "defghijkl", "efghijklm"]; // 45
    expect(validateWordSet(draft(five)).valid).toBe(true);
    const v = validateWordSet(draft([...five, "fgh"]));
    expect(v.totalLetters).toBe(48);
    expect(codes(v)).toContain("tooManyLetters");
  });

  it("rejects duplicates after normalization", () => {
    const v = validateWordSet(draft(["árbol", "ARBOL", "casa"], { language: "es" }));
    expect(v.errors).toEqual([expect.objectContaining({ code: "duplicateWord", index: 1 })]);
  });

  it("warns (doesn't block) when one word is inside another", () => {
    const v = validateWordSet(draft(["cat", "catch", "dog"]));
    expect(v.valid).toBe(true);
    expect(v.warnings).toEqual([
      expect.objectContaining({
        code: "wordContainsWord",
        index: 0,
        params: { inner: "CAT", outer: "CATCH" },
      }),
    ]);
  });

  it("supports Spanish Ñ and accents, keeping the original spelling for display", () => {
    const v = validateWordSet(draft(["niño", "canción", "pingüino"], { language: "es" }));
    expect(v.valid).toBe(true);
    expect(v.words.map((w) => w.display)).toEqual(["NIÑO", "CANCIÓN", "PINGÜINO"]);
    expect(v.words.map((w) => w.normalized)).toEqual(["NIÑO", "CANCION", "PINGUINO"]);
  });

  it("rejects Ñ in English sets with a helpful message", () => {
    expect(codes(validateWordSet(draft(["niño", "cell", "atom"])))).toContain("nTildeNeedsSpanish");
  });

  it("rejects profanity", () => {
    expect(codes(validateWordSet(draft(["damn", "cell", "atom"])))).toContain("profaneWord");
    expect(
      codes(validateWordSet(draft(["mierda", "casa", "perro"], { language: "es" }))),
    ).toContain("profaneWord");
  });

  it("limits clues to 80 characters and requires a word for each clue", () => {
    const long = "x".repeat(81);
    const v = validateWordSet(
      draft([{ text: "cell", clue: long }, "atom", "gene", { text: "", clue: "orphan" }]),
    );
    expect(codes(v)).toEqual(expect.arrayContaining(["clueTooLong", "wordRequired"]));
    expect(
      validateWordSet(draft([{ text: "cell", clue: "x".repeat(80) }, "atom", "gene"])).valid,
    ).toBe(true);
  });

  describe("display settings", () => {
    const withDisplay = (d: Partial<DisplaySettings>, words = ["cell", "atom", "gene"]) =>
      validateWordSet(draft(words, { display: { ...DEFAULT_DISPLAY_SETTINGS, ...d } }));

    it("requires a clue for every word in clue mode", () => {
      const v = withDisplay({ showClues: true });
      expect(v.errors.filter((e) => e.code === "clueRequired")).toHaveLength(3);
      const ok = validateWordSet(
        draft(
          ["cell", "atom", "gene"].map((text) => ({ text, clue: `about ${text}` })),
          { display: { ...DEFAULT_DISPLAY_SETTINGS, mode: "oneAtATime", showClues: true } },
        ),
      );
      expect(ok.valid).toBe(true);
    });

    it("disallows clue mode with hidden words", () => {
      expect(codes(withDisplay({ mode: "hidden", showClues: true }))).toContain(
        "cluesNotAllowedWhenHidden",
      );
    });

    it("only allows hints with hidden words", () => {
      expect(codes(withDisplay({ mode: "list", allowHints: true }))).toContain(
        "hintsOnlyWhenHidden",
      );
      expect(withDisplay({ mode: "hidden", allowHints: true }).valid).toBe(true);
    });
  });
});

import { BOARD_SCAN_WORDS, isProfane } from "./profanity";

describe("isProfane", () => {
  it("catches exact matches in English and Spanish", () => {
    expect(isProfane("DAMN")).toBe(true);
    expect(isProfane("MIERDA")).toBe(true);
  });

  it("catches strong words inside longer words", () => {
    expect(isProfane("BULLSHIT")).toBe(true);
  });

  it("does not flag innocent vocabulary (Scunthorpe cases)", () => {
    for (const w of [
      "CLASS",
      "ASSIGN",
      "GRASS",
      "CONO",
      "SUSSEX",
      "COCKPIT",
      "SCRAPE",
      "HOMONYM",
      "ESSEX",
    ]) {
      expect(isProfane(w)).toBe(false);
    }
  });

  it("only scans for words that fit on a board", () => {
    expect(BOARD_SCAN_WORDS.every((w) => w.length >= 3)).toBe(true);
  });
});

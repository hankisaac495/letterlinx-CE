import { normalizeWord } from "./normalize";

describe("normalizeWord", () => {
  it("uppercases and trims", () => {
    expect(normalizeWord("  photon ", "en")).toMatchObject({
      display: "PHOTON",
      normalized: "PHOTON",
      invalidChars: [],
    });
  });

  it("strips Spanish accents for matching but keeps them for display", () => {
    expect(normalizeWord("árbol", "es")).toMatchObject({ display: "ÁRBOL", normalized: "ARBOL" });
    expect(normalizeWord("pingüino", "es")).toMatchObject({ normalized: "PINGUINO" });
    expect(normalizeWord("canción", "es").normalized).toBe("CANCION");
  });

  it("keeps Ñ as its own letter in Spanish, including decomposed input", () => {
    expect(normalizeWord("niño", "es")).toMatchObject({ display: "NIÑO", normalized: "NIÑO" });
    expect(normalizeWord("mañana", "es").normalized).toBe("MAÑANA");
  });

  it("flags Ñ in English sets", () => {
    expect(normalizeWord("piña", "en").invalidChars).toEqual(["Ñ"]);
  });

  it("flags spaces, digits, hyphens and punctuation", () => {
    expect(normalizeWord("ice cream", "en").invalidChars).toEqual([" "]);
    expect(normalizeWord("x-ray", "en").invalidChars).toEqual(["-"]);
    expect(normalizeWord("abc1!", "en").invalidChars).toEqual(["1", "!"]);
  });
});

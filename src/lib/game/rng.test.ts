import { createRng, deriveSeed, randomSeed, shuffle, weightedPick } from "./rng";

describe("rng", () => {
  it("is deterministic for a seed", () => {
    const a = createRng(42);
    const b = createRng(42);
    const seqA = Array.from({ length: 20 }, a);
    const seqB = Array.from({ length: 20 }, b);
    expect(seqA).toEqual(seqB);
    expect(seqA.every((x) => x >= 0 && x < 1)).toBe(true);
  });

  it("differs across seeds and derived seeds", () => {
    expect(createRng(1)()).not.toBe(createRng(2)());
    expect(deriveSeed(7, 0)).not.toBe(deriveSeed(7, 1));
    expect(deriveSeed(7, 3)).toBe(deriveSeed(7, 3));
  });

  it("shuffles deterministically without losing items", () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    const s1 = shuffle(createRng(9), [...items]);
    const s2 = shuffle(createRng(9), [...items]);
    expect(s1).toEqual(s2);
    expect([...s1].sort()).toEqual(items);
  });

  it("weightedPick never picks zero-weight entries", () => {
    const rng = createRng(3);
    for (let i = 0; i < 200; i++) {
      expect(
        weightedPick(rng, [
          ["A", 1],
          ["B", 0],
        ] as const),
      ).toBe("A");
    }
  });

  it("randomSeed returns a uint32", () => {
    const s = randomSeed();
    expect(Number.isInteger(s) && s >= 0 && s < 2 ** 32).toBe(true);
  });
});

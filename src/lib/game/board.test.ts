import {
  DEFAULT_DIMENSIONS,
  findWordPath,
  findWordPaths,
  isAdjacent,
  isValidPath,
  neighborTable,
  toCoords,
  toIndex,
  wordFromPath,
} from "./board";

const dims = DEFAULT_DIMENSIONS;

describe("board geometry", () => {
  it("round-trips indices and coordinates", () => {
    expect(toIndex(5, 8, 6)).toBe(53);
    expect(toCoords(53, 6)).toEqual({ col: 5, row: 8 });
  });

  it("has 8-direction neighbours, fewer on edges and corners", () => {
    const t = neighborTable(dims);
    expect(t[0].sort((a, b) => a - b)).toEqual([1, 6, 7]);
    expect(t[toIndex(2, 4, 6)]).toHaveLength(8);
    expect(t[toIndex(0, 4, 6)]).toHaveLength(5);
  });

  it("does not wrap around rows", () => {
    expect(isAdjacent(5, 6, 6)).toBe(false); // end of row 0 → start of row 1
    expect(isAdjacent(0, 7, 6)).toBe(true); // diagonal
  });

  it("validates paths", () => {
    expect(isValidPath([0, 1, 8, 15], dims)).toBe(true);
    expect(isValidPath([0, 2], dims)).toBe(false); // not adjacent
    expect(isValidPath([0, 1, 0], dims)).toBe(false); // reuse
    expect(isValidPath([53, 54], dims)).toBe(false); // out of range
    expect(isValidPath([], dims)).toBe(false);
  });
});

describe("findWordPaths", () => {
  // 3 × 3 board:
  // C A T
  // A T S
  // T S X
  const small = { cols: 3, rows: 3 };
  const tiles = "CATATSTSX".split("");

  it("finds every path that spells the word", () => {
    const paths = findWordPaths(tiles, small, "CAT");
    expect(paths.length).toBeGreaterThan(1);
    for (const p of paths) {
      expect(isValidPath(p, small)).toBe(true);
      expect(wordFromPath(tiles, p)).toBe("CAT");
    }
  });

  it("respects limit and returns null when absent", () => {
    expect(findWordPaths(tiles, small, "CAT", 1)).toHaveLength(1);
    expect(findWordPath(tiles, small, "DOG")).toBeNull();
    expect(findWordPath(tiles, small, "CATC")).toBeNull(); // can't reuse C
  });
});

import { BOARD_COLS, BOARD_ROWS, BOARD_TILES, MAX_TOTAL_LETTERS } from "./constants";

describe("board constants", () => {
  it("is a 6 × 9 portrait board of 54 tiles", () => {
    expect(BOARD_COLS).toBe(6);
    expect(BOARD_ROWS).toBe(9);
    expect(BOARD_TILES).toBe(54);
  });

  it("leaves room for filler under the letter cap", () => {
    expect(MAX_TOTAL_LETTERS).toBeLessThan(BOARD_TILES);
  });
});

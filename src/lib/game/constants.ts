/** Board and word-set limits shared by the generator, validator and UI. */
export const BOARD_COLS = 6;
export const BOARD_ROWS = 9;
export const BOARD_TILES = BOARD_COLS * BOARD_ROWS; // 54

export const MIN_WORDS = 3;
export const MAX_WORDS = 8;
export const MIN_WORD_LENGTH = 3;
export const MAX_WORD_LENGTH = 9;
export const MAX_TOTAL_LETTERS = 45;
export const MAX_CLUE_LENGTH = 80;

export const ROUND_DURATIONS = [60, 90, 120, 180] as const;
export type RoundDuration = (typeof ROUND_DURATIONS)[number] | "untimed";

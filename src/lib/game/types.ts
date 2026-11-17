export type Language = "en" | "es";

/** How target words are shown above the board (section 4). */
export type WordDisplayMode = "list" | "oneAtATime" | "hidden";

export type HintsPerStudent = 1 | 2 | 3 | 5 | "unlimited";
export type HintCooldownSeconds = 0 | 10 | 20 | 30;
export type HintCost = "none" | "halfPoints";

export interface HintSettings {
  perStudent: HintsPerStudent;
  cooldownSeconds: HintCooldownSeconds;
  cost: HintCost;
}

export const DEFAULT_HINT_SETTINGS: HintSettings = {
  perStudent: 3,
  cooldownSeconds: 10,
  cost: "halfPoints",
};

export interface DisplaySettings {
  mode: WordDisplayMode;
  /** Show clues instead of words. Only valid for "list" and "oneAtATime". */
  showClues: boolean;
  /** Only valid for "hidden". */
  allowHints: boolean;
  hints: HintSettings;
}

export const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = {
  mode: "list",
  showClues: false,
  allowHints: false,
  hints: DEFAULT_HINT_SETTINGS,
};

export interface WordEntry {
  /** What the teacher typed. */
  text: string;
  clue?: string;
}

export interface WordSetDraft {
  title: string;
  language: Language;
  words: WordEntry[];
  display: DisplaySettings;
}

/**
 * Found-word highlight colours, based on the Okabe–Ito colour-blind-safe palette.
 * Every word also gets a numbered badge so colour is never the only cue.
 */
export interface WordColor {
  fill: string;
  ink: string;
}

export const WORD_COLORS: readonly WordColor[] = [
  { fill: "#0072B2", ink: "#ffffff" }, // blue
  { fill: "#E69F00", ink: "#1f1300" }, // orange
  { fill: "#009E73", ink: "#ffffff" }, // bluish green
  { fill: "#D55E00", ink: "#ffffff" }, // vermilion
  { fill: "#56B4E9", ink: "#00263d" }, // sky blue
  { fill: "#CC79A7", ink: "#2b0019" }, // reddish purple
  { fill: "#F0E442", ink: "#2b2600" }, // yellow
  { fill: "#475569", ink: "#ffffff" }, // slate
];

export function wordColor(wordId: number): WordColor {
  return WORD_COLORS[wordId % WORD_COLORS.length];
}

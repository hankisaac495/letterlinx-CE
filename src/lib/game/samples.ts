import { DEFAULT_DISPLAY_SETTINGS, type WordSetDraft } from "./types";

/** Hard-coded sample word sets for the single-player demo (Phase 3). */
export const SAMPLE_WORD_SETS: Record<"science" | "spanish", WordSetDraft> = {
  science: {
    title: "Cell Biology",
    language: "en",
    display: DEFAULT_DISPLAY_SETTINGS,
    words: [
      { text: "cell", clue: "The basic unit of life" },
      { text: "nucleus", clue: "The cell's control center" },
      { text: "protein", clue: "Built by ribosomes from amino acids" },
      { text: "gene", clue: "A section of DNA that codes for a trait" },
      { text: "membrane", clue: "The thin layer around a cell" },
      { text: "osmosis", clue: "Water moving across a membrane" },
    ],
  },
  spanish: {
    title: "La casa y la familia",
    language: "es",
    display: DEFAULT_DISPLAY_SETTINGS,
    words: [
      { text: "niño", clue: "Un hijo pequeño" },
      { text: "mañana", clue: "El día después de hoy" },
      { text: "cocina", clue: "Donde preparamos la comida" },
      { text: "baño", clue: "Donde nos duchamos" },
      { text: "ventana", clue: "Miramos afuera por la ___" },
      { text: "jardín", clue: "Tiene flores y plantas" },
    ],
  },
};

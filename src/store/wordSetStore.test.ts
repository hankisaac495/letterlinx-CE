import { DEFAULT_DISPLAY_SETTINGS, type WordSetDraft } from "@/lib/game";
import { cleanDraft, useWordSetStore, WORD_SET_STORAGE_KEY } from "./wordSetStore";

const draft: WordSetDraft = {
  title: "  Weather ",
  language: "en",
  display: DEFAULT_DISPLAY_SETTINGS,
  words: [
    { text: " cloud" },
    { text: "rain", clue: " Falls from clouds " },
    { text: "" },
    { text: "storm" },
  ],
};

beforeEach(async () => {
  localStorage.clear();
  useWordSetStore.setState({ wordSets: [], seeded: false });
});

describe("cleanDraft", () => {
  it("trims, uppercases and drops blank rows", () => {
    expect(cleanDraft(draft)).toMatchObject({
      title: "Weather",
      words: [
        { text: "CLOUD", clue: "" },
        { text: "RAIN", clue: "Falls from clouds" },
        { text: "STORM", clue: "" },
      ],
    });
  });

  it("uppercases Spanish with the Spanish locale", () => {
    expect(cleanDraft({ ...draft, language: "es", words: [{ text: "niño" }] }).words[0].text).toBe(
      "NIÑO",
    );
  });
});

describe("word set store", () => {
  it("creates, updates, duplicates and deletes", () => {
    const s = useWordSetStore.getState();
    const id = s.create(draft, 7);
    let sets = useWordSetStore.getState().wordSets;
    expect(sets).toHaveLength(1);
    expect(sets[0]).toMatchObject({ id, title: "Weather", previewSeed: 7 });

    useWordSetStore.getState().update(id, { ...draft, title: "Storms" }, 9);
    expect(useWordSetStore.getState().wordSets[0]).toMatchObject({
      title: "Storms",
      previewSeed: 9,
    });

    const copyId = useWordSetStore.getState().duplicate(id)!;
    sets = useWordSetStore.getState().wordSets;
    expect(sets.map((w) => w.id)).toEqual([id, copyId]);
    expect(sets[1].title).toBe("Storms (copy)");
    sets[1].words[0].text = "CHANGED";
    expect(useWordSetStore.getState().wordSets[0].words[0].text).toBe("CLOUD"); // deep copy

    useWordSetStore.getState().remove(id);
    expect(useWordSetStore.getState().wordSets.map((w) => w.id)).toEqual([copyId]);
  });

  it("persists to localStorage", () => {
    useWordSetStore.getState().create(draft, 1);
    const stored = JSON.parse(localStorage.getItem(WORD_SET_STORAGE_KEY)!);
    expect(stored.state.wordSets[0].title).toBe("Weather");
  });

  it("adds the sample sets once", async () => {
    await useWordSetStore.persist.rehydrate();
    expect(useWordSetStore.getState().wordSets.length).toBe(2);
    useWordSetStore.getState().seedSamples();
    expect(useWordSetStore.getState().wordSets.length).toBe(2);
  });
});

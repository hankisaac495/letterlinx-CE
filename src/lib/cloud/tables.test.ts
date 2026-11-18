import { DEFAULT_DISPLAY_SETTINGS } from "@/lib/game";
import type { ManualClass } from "@/lib/roster";
import type { WordSet } from "@/store/wordSetStore";
import { classesTable, wordSetsTable } from "./tables";

describe("cloud table mappings", () => {
  it("round-trips a word set", () => {
    const ws: WordSet = {
      id: "ws_1",
      title: "Cells",
      language: "en",
      words: [{ text: "CELL", clue: "" }],
      display: DEFAULT_DISPLAY_SETTINGS,
      previewSeed: 7,
      createdAt: 1000,
      updatedAt: 2000,
    };
    const row = wordSetsTable.toRow(ws, "user-1");
    expect(row).toMatchObject({
      owner_id: "user-1",
      id: "ws_1",
      updated_at: new Date(2000).toISOString(),
    });
    expect(wordSetsTable.fromRow(JSON.parse(JSON.stringify(row)))).toEqual(ws);
  });

  it("round-trips a class with only first names and initials", () => {
    const cls: ManualClass = {
      id: "cls_1",
      ownerId: "user-1",
      name: "Homeroom",
      subject: "",
      grade: "5",
      period: "2",
      students: [{ id: "st_1", first: "Maya", lastInitial: "R" }],
      createdAt: Date.parse("2026-01-01T00:00:00Z"),
      updatedAt: Date.parse("2026-01-02T00:00:00Z"),
    };
    const row = classesTable.toRow(cls, "user-1");
    expect(JSON.stringify(row)).not.toMatch(/email|password/i);
    expect(classesTable.fromRow(JSON.parse(JSON.stringify(row)))).toEqual(cls);
  });
});

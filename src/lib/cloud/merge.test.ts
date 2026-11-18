import { diffItems, mergeForSync } from "./merge";

type Item = { id: string; v: number; note?: string };
const key = (i: Item) => i.id;
const version = (i: Item) => i.v;

describe("mergeForSync", () => {
  it("keeps the newer copy and uploads local wins", () => {
    const { merged, toUpload } = mergeForSync<Item>(
      [
        { id: "a", v: 5, note: "local" },
        { id: "b", v: 1, note: "local" },
      ],
      [
        { id: "a", v: 3, note: "cloud" },
        { id: "b", v: 4, note: "cloud" },
      ],
      10,
      key,
      version,
    );
    expect(merged.map((m) => m.note)).toEqual(["local", "cloud"]);
    expect(toUpload.map((m) => m.id)).toEqual(["a"]);
  });

  it("uploads items made since the last sync and drops ones deleted elsewhere", () => {
    const { merged, toUpload } = mergeForSync<Item>(
      [
        { id: "new", v: 20 },
        { id: "deletedElsewhere", v: 5 },
      ],
      [{ id: "cloudOnly", v: 7 }],
      10,
      key,
      version,
    );
    expect(merged.map((m) => m.id).sort()).toEqual(["cloudOnly", "new"]);
    expect(toUpload.map((m) => m.id)).toEqual(["new"]);
  });

  it("first sync (lastSyncedAt 0) uploads everything local", () => {
    const { toUpload } = mergeForSync<Item>([{ id: "x", v: 1 }], [], 0, key, version);
    expect(toUpload).toHaveLength(1);
  });
});

describe("diffItems", () => {
  it("finds changed (by reference) and removed items", () => {
    const a = { id: "a", v: 1 };
    const b = { id: "b", v: 1 };
    const b2 = { id: "b", v: 2 };
    const c = { id: "c", v: 1 };
    expect(diffItems<Item>([a, b], [a, b2, c], key)).toEqual({ changed: [b2, c], removed: [] });
    expect(diffItems<Item>([a, b], [b], key)).toEqual({ changed: [], removed: ["a"] });
  });
});

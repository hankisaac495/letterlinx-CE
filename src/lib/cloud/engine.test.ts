import { startTableSync, type StoreBinding } from "./engine";
import type { CloudTable } from "./tables";

type Item = { id: string; v: number };
const table: CloudTable<Item> = {
  table: "word_sets",
  key: (i) => i.id,
  version: (i) => i.v,
  toRow: (i, owner) => ({ owner_id: owner, id: i.id, v: i.v }),
  fromRow: (r) => ({ id: String(r.id), v: Number(r.v) }),
};

/** A tiny in-memory stand-in for the Supabase query builder. */
function fakeDb(rows: Record<string, unknown>[]) {
  const calls: string[] = [];
  const db = {
    from: () => ({
      select: async () => ({ data: rows, error: null }),
      upsert: async (items: Record<string, unknown>[]) => {
        calls.push(`upsert:${items.map((i) => i.id).join(",")}`);
        for (const it of items) {
          const idx = rows.findIndex((r) => r.id === it.id);
          if (idx >= 0) rows[idx] = it;
          else rows.push(it);
        }
        return { error: null };
      },
      delete: () => ({
        in: async (_col: string, ids: string[]) => {
          calls.push(`delete:${ids.join(",")}`);
          return { error: null };
        },
      }),
    }),
  };
  return { db: db as never, calls, rows };
}

function memoryStore(initial: Item[]): StoreBinding<Item> & { items: Item[] } {
  const listeners = new Set<(n: Item[], p: Item[]) => void>();
  const s = {
    items: initial,
    get: () => s.items,
    set: (next: Item[]) => {
      const prev = s.items;
      s.items = next;
      listeners.forEach((l) => l(next, prev));
    },
    subscribe: (l: (n: Item[], p: Item[]) => void) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
  return s;
}

describe("startTableSync", () => {
  it("merges on start, uploads local-only items, then saves later changes", async () => {
    const { db, calls } = fakeDb([{ owner_id: "u", id: "cloud", v: 3 }]);
    const store = memoryStore([{ id: "local", v: 50 }]);
    const statuses: string[] = [];
    const stop = await startTableSync(db, "u", table, store, {
      lastSyncedAt: 10,
      onSynced: () => {},
      onStatus: (s) => statuses.push(s),
      debounceMs: 1,
    });
    expect(store.items.map((i) => i.id).sort()).toEqual(["cloud", "local"]);
    expect(calls).toEqual(["upsert:local"]);

    store.set([{ id: "cloud", v: 4 }]); // edit "cloud", delete "local"
    await new Promise((r) => setTimeout(r, 20));
    expect(calls).toEqual(["upsert:local", "upsert:cloud", "delete:local"]);
    expect(statuses.at(-1)).toBe("saved");
    await stop();
  });
});

import type { SupabaseClient } from "@supabase/supabase-js";
import { diffItems, mergeForSync } from "./merge";
import type { CloudTable } from "./tables";

export interface StoreBinding<T> {
  get(): T[];
  set(items: T[]): void;
  subscribe(listener: (next: T[], prev: T[]) => void): () => void;
}

export type SyncStatus = "idle" | "loading" | "saving" | "saved" | "error";

export interface TableSyncOptions {
  lastSyncedAt: number;
  onSynced(at: number): void;
  onStatus(status: SyncStatus): void;
  debounceMs?: number;
}

/**
 * Pulls a table, merges it with the local store, then saves local changes as they happen.
 * Returns a function that stops syncing (flushing anything pending).
 */
export async function startTableSync<T>(
  db: Pick<SupabaseClient, "from">,
  ownerId: string,
  table: CloudTable<T>,
  store: StoreBinding<T>,
  options: TableSyncOptions,
): Promise<() => Promise<void>> {
  options.onStatus("loading");
  const { data, error } = await db.from(table.table).select("*");
  if (error) {
    options.onStatus("error");
    throw error;
  }
  const remote = (data ?? []).map((r) => table.fromRow(r as Record<string, unknown>));
  const { merged, toUpload } = mergeForSync(
    store.get(),
    remote,
    options.lastSyncedAt,
    table.key,
    table.version,
  );

  let applying = true;
  store.set(merged);
  applying = false;

  const pendingUpserts = new Map<string, T>();
  const pendingDeletes = new Set<string>();
  let timer: ReturnType<typeof setTimeout> | null = null;

  const flush = async () => {
    timer = null;
    if (pendingUpserts.size === 0 && pendingDeletes.size === 0) return;
    const upserts = [...pendingUpserts.values()];
    const deletes = [...pendingDeletes];
    pendingUpserts.clear();
    pendingDeletes.clear();
    options.onStatus("saving");
    try {
      if (upserts.length) {
        const { error: e } = await db.from(table.table).upsert(
          upserts.map((u) => table.toRow(u, ownerId)),
          { onConflict: "owner_id,id" },
        );
        if (e) throw e;
      }
      if (deletes.length) {
        const { error: e } = await db.from(table.table).delete().in("id", deletes);
        if (e) throw e;
      }
      options.onSynced(Date.now());
      options.onStatus("saved");
    } catch {
      // Keep the changes queued and try again shortly.
      for (const u of upserts)
        if (!pendingUpserts.has(table.key(u))) pendingUpserts.set(table.key(u), u);
      for (const d of deletes) pendingDeletes.add(d);
      options.onStatus("error");
      schedule(5000);
    }
  };
  const schedule = (ms = options.debounceMs ?? 600) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void flush(), ms);
  };

  for (const item of toUpload) pendingUpserts.set(table.key(item), item);
  if (toUpload.length) await flush();
  else {
    options.onSynced(Date.now());
    options.onStatus("saved");
  }

  const unsubscribe = store.subscribe((next, prev) => {
    if (applying) return;
    const { changed, removed } = diffItems(prev, next, table.key);
    for (const c of changed) {
      pendingUpserts.set(table.key(c), c);
      pendingDeletes.delete(table.key(c));
    }
    for (const id of removed) {
      pendingDeletes.add(id);
      pendingUpserts.delete(id);
    }
    if (changed.length || removed.length) schedule();
  });

  return async () => {
    unsubscribe();
    if (timer) {
      clearTimeout(timer);
      await flush();
    }
  };
}

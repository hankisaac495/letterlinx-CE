/**
 * Merges a device's cached items with the cloud copy after a sign-in.
 *
 * - In both: the newer version wins (and is uploaded if it's the local one).
 * - Only in the cloud: kept.
 * - Only on this device: uploaded if changed since the last sync (made offline or
 *   before signing in); otherwise it was deleted on another device, so it's dropped.
 */
export function mergeForSync<T>(
  local: readonly T[],
  remote: readonly T[],
  lastSyncedAt: number,
  key: (item: T) => string,
  version: (item: T) => number,
): { merged: T[]; toUpload: T[] } {
  const remoteById = new Map(remote.map((r) => [key(r), r]));
  const merged: T[] = [];
  const toUpload: T[] = [];
  const seen = new Set<string>();
  for (const item of local) {
    const id = key(item);
    seen.add(id);
    const theirs = remoteById.get(id);
    if (theirs) {
      if (version(item) > version(theirs)) {
        merged.push(item);
        toUpload.push(item);
      } else {
        merged.push(theirs);
      }
    } else if (version(item) > lastSyncedAt) {
      merged.push(item);
      toUpload.push(item);
    }
  }
  for (const r of remote) if (!seen.has(key(r))) merged.push(r);
  return { merged, toUpload };
}

/** What changed between two snapshots of a store's items (for write-through saving). */
export function diffItems<T>(
  prev: readonly T[],
  next: readonly T[],
  key: (item: T) => string,
): { changed: T[]; removed: string[] } {
  const before = new Map(prev.map((p) => [key(p), p]));
  const changed = next.filter((n) => before.get(key(n)) !== n);
  const after = new Set(next.map(key));
  const removed = [...before.keys()].filter((id) => !after.has(id));
  return { changed, removed };
}

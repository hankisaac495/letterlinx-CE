import { BroadcastChannelSyncProvider, LocalStorageSyncProvider } from "./broadcastChannel";
import type { SyncProvider } from "./types";

export * from "./types";
export { BroadcastChannelSyncProvider, LocalStorageSyncProvider };

/**
 * The single place that decides which transport live rounds use.
 * Phase 9 adds a Supabase Realtime option here; nothing else changes.
 */
export function createSyncProvider(): SyncProvider {
  if (typeof BroadcastChannel !== "undefined") return new BroadcastChannelSyncProvider();
  return new LocalStorageSyncProvider();
}

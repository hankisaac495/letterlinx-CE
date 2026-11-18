import { BroadcastChannelSyncProvider, LocalStorageSyncProvider } from "./broadcastChannel";
import { SupabaseSyncProvider, type RealtimeClientLike } from "./supabase";
import type { JoinOptions, SyncMessage, SyncProvider, SyncTransport, Unsubscribe } from "./types";

export * from "./types";
export { BroadcastChannelSyncProvider, LocalStorageSyncProvider, SupabaseSyncProvider };

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
/** Set NEXT_PUBLIC_SYNC_MODE=local to force same-browser sync even when Supabase is configured. */
const FORCE_LOCAL = process.env.NEXT_PUBLIC_SYNC_MODE === "local";

/** Whether cross-device sync is configured for this build. */
export const networkSyncConfigured = !!(SUPABASE_URL && SUPABASE_KEY) && !FORCE_LOCAL;

function localProvider(): SyncProvider {
  if (typeof BroadcastChannel !== "undefined") return new BroadcastChannelSyncProvider();
  return new LocalStorageSyncProvider();
}

let clientPromise: Promise<RealtimeClientLike> | null = null;
/** Once Realtime fails in this tab, later joins go straight to same-browser sync. */
let networkFailed = false;
function supabaseClient(): Promise<RealtimeClientLike> {
  // Loaded on demand so local-only builds don't ship the Supabase client in the first bundle.
  clientPromise ??= import("@supabase/supabase-js").then(({ createClient }) =>
    createClient(SUPABASE_URL!, SUPABASE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { params: { eventsPerSecond: 20 } },
    }),
  ) as Promise<RealtimeClientLike>;
  return clientPromise;
}

/**
 * Uses Supabase Realtime when configured; if it can't connect, falls back to
 * same-browser sync so a solo demo still works.
 */
class AutoSyncProvider implements SyncProvider {
  private inner: SyncProvider = localProvider();
  private handlers = new Set<(m: SyncMessage) => void>();
  private detach: Unsubscribe | null = null;

  get transport(): SyncTransport {
    return this.inner.transport;
  }

  async joinRoom(roomCode: string, clientId: string, options?: JoinOptions): Promise<void> {
    await this.inner.leaveRoom();
    this.detach?.();
    let next: SyncProvider | null = null;
    if (!networkFailed) {
      try {
        next = new SupabaseSyncProvider(await supabaseClient());
        await next.joinRoom(roomCode, clientId, options);
      } catch (err) {
        networkFailed = true;
        next = null;
        console.warn("Realtime unavailable, using same-browser sync instead.", err);
      }
    }
    if (!next) {
      next = localProvider();
      await next.joinRoom(roomCode, clientId, options);
    }
    this.inner = next;
    this.detach = next.subscribe((m) => this.handlers.forEach((h) => h(m)));
  }

  broadcast<T>(type: string, payload: T): void {
    this.inner.broadcast(type, payload);
  }

  subscribe(handler: (message: SyncMessage) => void): Unsubscribe {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  async leaveRoom(): Promise<void> {
    this.detach?.();
    this.detach = null;
    await this.inner.leaveRoom();
  }
}

/** The single place that decides which transport live rounds use. */
export function createSyncProvider(): SyncProvider {
  return networkSyncConfigured ? new AutoSyncProvider() : localProvider();
}

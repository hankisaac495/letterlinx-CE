/**
 * Transport-agnostic live-round messaging.
 *
 * Implementations: BroadcastChannel (same browser, separate tabs) and Supabase
 * Realtime (cross-device). Nothing outside src/lib/sync depends on which is used.
 */
export interface SyncMessage<T = unknown> {
  type: string;
  payload: T;
  senderId: string;
  sentAt: number;
}

export type Unsubscribe = () => void;

/**
 * The host (projector) hears everyone; participants (students) hear the host.
 * Network transports use this to avoid fanning student messages out to every student.
 */
export type SyncRole = "host" | "participant";

export interface JoinOptions {
  role?: SyncRole;
}

/** "local" = same-browser tabs; "network" = across devices (slower, metered). */
export type SyncTransport = "local" | "network";

export interface SyncProvider {
  readonly transport: SyncTransport;
  joinRoom(roomCode: string, clientId: string, options?: JoinOptions): Promise<void>;
  broadcast<T>(type: string, payload: T): void;
  subscribe(handler: (message: SyncMessage) => void): Unsubscribe;
  leaveRoom(): Promise<void>;
}

/** Message pacing per transport (network transports are metered and higher-latency). */
export const SYNC_TIMING: Record<
  SyncTransport,
  {
    snapshotThrottleMs: number;
    heartbeatMs: number;
    progressHeartbeatMs: number;
    joinTimeoutMs: number;
  }
> = {
  local: {
    snapshotThrottleMs: 150,
    heartbeatMs: 2000,
    progressHeartbeatMs: 3000,
    joinTimeoutMs: 3000,
  },
  network: {
    snapshotThrottleMs: 1000,
    heartbeatMs: 4000,
    progressHeartbeatMs: 8000,
    joinTimeoutMs: 8000,
  },
};

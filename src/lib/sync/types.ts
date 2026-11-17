/**
 * Transport-agnostic live-round messaging.
 *
 * Phase 5 implements this with BroadcastChannel (same browser, separate tabs).
 * Phase 9 adds a Supabase Realtime implementation for cross-device play.
 * Nothing outside src/lib/sync should depend on which implementation is used.
 */
export interface SyncMessage<T = unknown> {
  type: string;
  payload: T;
  senderId: string;
  sentAt: number;
}

export type Unsubscribe = () => void;

export interface SyncProvider {
  joinRoom(roomCode: string, clientId: string): Promise<void>;
  broadcast<T>(type: string, payload: T): void;
  subscribe(handler: (message: SyncMessage) => void): Unsubscribe;
  leaveRoom(): Promise<void>;
}

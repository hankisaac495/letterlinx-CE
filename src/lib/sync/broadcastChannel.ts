import type { SyncMessage, SyncProvider, Unsubscribe } from "./types";

type Handler = (message: SyncMessage) => void;

const channelName = (roomCode: string) => `llce-room-${roomCode}`;

/**
 * Same-browser sync between tabs using BroadcastChannel.
 * Messages are not echoed back to the sending instance.
 */
export class BroadcastChannelSyncProvider implements SyncProvider {
  readonly transport = "local" as const;
  private channel: BroadcastChannel | null = null;
  private clientId = "";
  private handlers = new Set<Handler>();

  async joinRoom(roomCode: string, clientId: string): Promise<void> {
    await this.leaveRoom();
    this.clientId = clientId;
    this.channel = new BroadcastChannel(channelName(roomCode));
    this.channel.onmessage = (event: MessageEvent<SyncMessage>) => {
      for (const h of this.handlers) h(event.data);
    };
  }

  broadcast<T>(type: string, payload: T): void {
    if (!this.channel) throw new Error("joinRoom() must be called before broadcast()");
    const message: SyncMessage<T> = { type, payload, senderId: this.clientId, sentAt: Date.now() };
    this.channel.postMessage(message);
  }

  subscribe(handler: Handler): Unsubscribe {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  async leaveRoom(): Promise<void> {
    this.channel?.close();
    this.channel = null;
  }
}

/**
 * Fallback for browsers without BroadcastChannel: writes each message to
 * localStorage and listens for `storage` events from other tabs.
 */
export class LocalStorageSyncProvider implements SyncProvider {
  readonly transport = "local" as const;
  private key = "";
  private clientId = "";
  private handlers = new Set<Handler>();
  private counter = 0;
  private listener = (event: StorageEvent) => {
    if (event.key !== this.key || !event.newValue) return;
    try {
      const { message } = JSON.parse(event.newValue) as { message: SyncMessage };
      for (const h of this.handlers) h(message);
    } catch {
      // ignore malformed entries
    }
  };

  async joinRoom(roomCode: string, clientId: string): Promise<void> {
    await this.leaveRoom();
    this.key = `llce:sync:${channelName(roomCode)}`;
    this.clientId = clientId;
    window.addEventListener("storage", this.listener);
  }

  broadcast<T>(type: string, payload: T): void {
    if (!this.key) throw new Error("joinRoom() must be called before broadcast()");
    const message: SyncMessage<T> = { type, payload, senderId: this.clientId, sentAt: Date.now() };
    // The nonce makes every write a change, so repeated identical messages still fire events.
    localStorage.setItem(
      this.key,
      JSON.stringify({ message, nonce: `${this.clientId}:${++this.counter}` }),
    );
  }

  subscribe(handler: Handler): Unsubscribe {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  async leaveRoom(): Promise<void> {
    if (typeof window !== "undefined") window.removeEventListener("storage", this.listener);
    this.key = "";
  }
}

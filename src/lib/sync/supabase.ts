import type { JoinOptions, SyncMessage, SyncProvider, SyncRole, Unsubscribe } from "./types";

/**
 * The slice of the Supabase client this provider uses (kept small so tests can fake it).
 */
export interface RealtimeChannelLike {
  on(
    type: "broadcast",
    filter: { event: string },
    callback: (msg: { payload: unknown }) => void,
  ): RealtimeChannelLike;
  subscribe(callback?: (status: string, err?: Error) => void): RealtimeChannelLike;
  send(args: { type: "broadcast"; event: string; payload: unknown }): Promise<unknown>;
  httpSend(event: string, payload: unknown): Promise<unknown>;
}

export interface RealtimeClientLike {
  channel(
    name: string,
    opts?: { config?: { broadcast?: { self?: boolean; ack?: boolean } } },
  ): RealtimeChannelLike;
  removeChannel(channel: RealtimeChannelLike): Promise<unknown>;
}

const EVENT = "msg";
const SUBSCRIBE_TIMEOUT_MS = 8000;

export const roomTopic = (room: string) => `llce:${room}`;
export const inboxTopic = (room: string) => `llce:${room}:inbox`;

/**
 * Cross-device sync over Supabase Realtime broadcast.
 *
 * Two topics per room keep traffic (and the free-plan message quota) low:
 * - `llce:<room>`        host → everyone (snapshots, welcomes). Participants subscribe.
 * - `llce:<room>:inbox`  participants → host (hello, progress). Only the host subscribes;
 *                        participants post to it over REST without subscribing.
 */
export class SupabaseSyncProvider implements SyncProvider {
  readonly transport = "network" as const;
  private role: SyncRole = "participant";
  private clientId = "";
  private listen: RealtimeChannelLike | null = null;
  private room: RealtimeChannelLike | null = null;
  private inbox: RealtimeChannelLike | null = null;
  private handlers = new Set<(m: SyncMessage) => void>();

  constructor(private client: RealtimeClientLike) {}

  async joinRoom(roomCode: string, clientId: string, options: JoinOptions = {}): Promise<void> {
    await this.leaveRoom();
    this.clientId = clientId;
    this.role = options.role ?? "participant";
    const deliver = ({ payload }: { payload: unknown }) => {
      for (const h of this.handlers) h(payload as SyncMessage);
    };
    const config = { config: { broadcast: { self: false, ack: false } } };

    if (this.role === "host") {
      this.room = this.client.channel(roomTopic(roomCode), config);
      this.listen = this.client
        .channel(inboxTopic(roomCode), config)
        .on("broadcast", { event: EVENT }, deliver);
      await Promise.all([subscribed(this.room), subscribed(this.listen)]);
    } else {
      this.listen = this.client
        .channel(roomTopic(roomCode), config)
        .on("broadcast", { event: EVENT }, deliver);
      this.inbox = this.client.channel(inboxTopic(roomCode), config);
      await subscribed(this.listen);
    }
  }

  broadcast<T>(type: string, payload: T): void {
    const message: SyncMessage<T> = { type, payload, senderId: this.clientId, sentAt: Date.now() };
    if (this.role === "host") {
      if (!this.room) throw new Error("joinRoom() must be called before broadcast()");
      void this.room.send({ type: "broadcast", event: EVENT, payload: message });
    } else {
      if (!this.inbox) throw new Error("joinRoom() must be called before broadcast()");
      void this.inbox.httpSend(EVENT, message).catch(() => undefined);
    }
  }

  subscribe(handler: (message: SyncMessage) => void): Unsubscribe {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  async leaveRoom(): Promise<void> {
    const channels = [this.listen, this.room, this.inbox].filter(
      (c): c is RealtimeChannelLike => !!c,
    );
    this.listen = this.room = this.inbox = null;
    await Promise.all(channels.map((c) => this.client.removeChannel(c).catch(() => undefined)));
  }
}

function subscribed(channel: RealtimeChannelLike): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Realtime subscribe timed out")),
      SUBSCRIBE_TIMEOUT_MS,
    );
    channel.subscribe((status, err) => {
      if (status === "SUBSCRIBED") {
        clearTimeout(timer);
        resolve();
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
        clearTimeout(timer);
        reject(err ?? new Error(`Realtime channel ${status}`));
      }
    });
  });
}

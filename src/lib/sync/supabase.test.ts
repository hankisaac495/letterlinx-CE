import {
  inboxTopic,
  roomTopic,
  SupabaseSyncProvider,
  type RealtimeChannelLike,
  type RealtimeClientLike,
} from "./supabase";
import type { SyncMessage } from "./types";

/**
 * In-memory fake of Supabase Realtime broadcast: subscribed channels on the same
 * topic receive websocket sends (except the sender, self: false) and REST sends.
 */
function fakeRealtime(options: { failSubscribe?: boolean } = {}) {
  const listeners = new Map<string, Set<FakeChannel>>();
  const log: { topic: string; via: "ws" | "rest"; type: string }[] = [];

  class FakeChannel implements RealtimeChannelLike {
    callbacks: ((m: { payload: unknown }) => void)[] = [];
    subscribedFlag = false;
    constructor(public topic: string) {}
    on(_t: "broadcast", _f: { event: string }, cb: (m: { payload: unknown }) => void) {
      this.callbacks.push(cb);
      return this;
    }
    subscribe(cb?: (status: string) => void) {
      queueMicrotask(() => {
        if (options.failSubscribe) return cb?.("CHANNEL_ERROR");
        this.subscribedFlag = true;
        if (!listeners.has(this.topic)) listeners.set(this.topic, new Set());
        listeners.get(this.topic)!.add(this);
        cb?.("SUBSCRIBED");
      });
      return this;
    }
    private deliver(payload: unknown, skip?: FakeChannel) {
      for (const ch of listeners.get(this.topic) ?? [])
        if (ch !== skip) ch.callbacks.forEach((c) => c({ payload }));
    }
    async send(args: { type: "broadcast"; event: string; payload: unknown }) {
      if (!this.subscribedFlag) throw new Error("send before subscribe");
      log.push({ topic: this.topic, via: "ws", type: (args.payload as SyncMessage).type });
      this.deliver(args.payload, this);
      return "ok";
    }
    async httpSend(_event: string, payload: unknown) {
      log.push({ topic: this.topic, via: "rest", type: (payload as SyncMessage).type });
      this.deliver(payload);
      return { success: true };
    }
  }

  const client: RealtimeClientLike = {
    channel: (name) => new FakeChannel(name),
    removeChannel: async (ch) => {
      listeners.get((ch as FakeChannel).topic)?.delete(ch as FakeChannel);
      return "ok";
    },
  };
  return { client, log, listeners };
}

const flush = () => new Promise((r) => setTimeout(r, 0));

describe("SupabaseSyncProvider", () => {
  it("routes host messages to everyone and student messages only to the host", async () => {
    const { client, log } = fakeRealtime();
    const host = new SupabaseSyncProvider(client);
    const s1 = new SupabaseSyncProvider(client);
    const s2 = new SupabaseSyncProvider(client);
    await host.joinRoom("ABC234", "host", { role: "host" });
    await s1.joinRoom("ABC234", "s1");
    await s2.joinRoom("ABC234", "s2");
    expect(host.transport).toBe("network");

    const seen: Record<string, string[]> = { host: [], s1: [], s2: [] };
    host.subscribe((m) => seen.host.push(m.type));
    s1.subscribe((m) => seen.s1.push(m.type));
    s2.subscribe((m) => seen.s2.push(m.type));

    s1.broadcast("progress", { score: 10 });
    host.broadcast("snapshot", { phase: "playing" });
    await flush();

    expect(seen.host).toEqual(["progress"]); // host doesn't hear its own snapshot
    expect(seen.s1).toEqual(["snapshot"]); // students don't hear each other
    expect(seen.s2).toEqual(["snapshot"]);
    expect(log).toEqual([
      { topic: inboxTopic("ABC234"), via: "rest", type: "progress" },
      { topic: roomTopic("ABC234"), via: "ws", type: "snapshot" },
    ]);
  });

  it("keeps rooms separate and stops delivering after leaving", async () => {
    const { client } = fakeRealtime();
    const host = new SupabaseSyncProvider(client);
    const other = new SupabaseSyncProvider(client);
    await host.joinRoom("AAAAAA", "host", { role: "host" });
    await other.joinRoom("BBBBBB", "x");
    const seen: string[] = [];
    other.subscribe((m) => seen.push(m.type));
    host.broadcast("snapshot", {});
    await other.leaveRoom();
    await flush();
    expect(seen).toEqual([]);
  });

  it("rejects joinRoom when the channel can't subscribe (so callers can fall back)", async () => {
    const { client } = fakeRealtime({ failSubscribe: true });
    await expect(new SupabaseSyncProvider(client).joinRoom("ABC234", "s1")).rejects.toThrow(
      /CHANNEL_ERROR/,
    );
  });

  it("requires joining first", () => {
    const { client } = fakeRealtime();
    expect(() => new SupabaseSyncProvider(client).broadcast("x", 1)).toThrow();
  });
});

describe("createSyncProvider", () => {
  it("uses same-browser sync when Supabase isn't configured", async () => {
    const { createSyncProvider, networkSyncConfigured } = await import("./index");
    expect(networkSyncConfigured).toBe(false);
    expect(createSyncProvider().transport).toBe("local");
  });
});

import { BroadcastChannelSyncProvider, LocalStorageSyncProvider } from "./broadcastChannel";
import type { SyncMessage } from "./types";

const nextMessage = (subscribe: (h: (m: SyncMessage) => void) => () => void) =>
  new Promise<SyncMessage>((resolve) => {
    const off = subscribe((m) => {
      off();
      resolve(m);
    });
  });

describe("BroadcastChannelSyncProvider", () => {
  it("delivers messages between instances in the same room", async () => {
    const host = new BroadcastChannelSyncProvider();
    const student = new BroadcastChannelSyncProvider();
    await host.joinRoom("ABC234", "host");
    await student.joinRoom("ABC234", "s1");
    const received = nextMessage((h) => host.subscribe(h));
    student.broadcast("hello", { name: "Maya R." });
    await expect(received).resolves.toMatchObject({
      type: "hello",
      payload: { name: "Maya R." },
      senderId: "s1",
    });
    await host.leaveRoom();
    await student.leaveRoom();
  });

  it("keeps rooms separate", async () => {
    const a = new BroadcastChannelSyncProvider();
    const b = new BroadcastChannelSyncProvider();
    const c = new BroadcastChannelSyncProvider();
    await a.joinRoom("AAAAAA", "a");
    await b.joinRoom("BBBBBB", "b");
    await c.joinRoom("AAAAAA", "c");
    const seenByB: SyncMessage[] = [];
    b.subscribe((m) => seenByB.push(m));
    const toC = nextMessage((h) => c.subscribe(h));
    a.broadcast("ping", 1);
    await toC;
    expect(seenByB).toHaveLength(0);
    await Promise.all([a.leaveRoom(), b.leaveRoom(), c.leaveRoom()]);
  });

  it("requires joining first", () => {
    expect(() => new BroadcastChannelSyncProvider().broadcast("x", 1)).toThrow();
  });
});

describe("LocalStorageSyncProvider", () => {
  it("writes messages and reacts to storage events from other tabs", async () => {
    const p = new LocalStorageSyncProvider();
    await p.joinRoom("ROOM22", "tab1");
    p.broadcast("hello", { n: 1 });
    const key = "llce:sync:llce-room-ROOM22";
    expect(JSON.parse(localStorage.getItem(key)!).message).toMatchObject({
      type: "hello",
      senderId: "tab1",
    });

    const received = nextMessage((h) => p.subscribe(h));
    const other: SyncMessage = {
      type: "snapshot",
      payload: { ok: true },
      senderId: "tab2",
      sentAt: 1,
    };
    window.dispatchEvent(
      new StorageEvent("storage", {
        key,
        newValue: JSON.stringify({ message: other, nonce: "x" }),
      }),
    );
    await expect(received).resolves.toEqual(other);
    await p.leaveRoom();
  });
});

"use client";

import { useEffect } from "react";
import {
  MSG,
  toSnapshot,
  type HelloPayload,
  type ProgressPayload,
  type WelcomePayload,
} from "@/lib/live";
import { createSyncProvider, type SyncProvider } from "@/lib/sync";
import { useHostStore } from "@/store/hostStore";

const TICK_MS = 250;
const HEARTBEAT_MS = 2000;
const THROTTLE_MS = 150;

/** Runs the host side of a live room: messaging, snapshots and the clock tick. */
export function useHostSync(code: string | null) {
  useEffect(() => {
    if (!code) return;
    let provider: SyncProvider | null = createSyncProvider();
    let pending: number | null = null;
    let lastSent = 0;

    const send = () => {
      pending = null;
      const room = useHostStore.getState().room;
      if (!provider || !room || room.code !== code) return;
      lastSent = Date.now();
      provider.broadcast(MSG.snapshot, toSnapshot(room, lastSent));
    };
    const scheduleSend = () => {
      if (pending !== null) return;
      const wait = Math.max(0, THROTTLE_MS - (Date.now() - lastSent));
      pending = window.setTimeout(send, wait);
    };

    const ready = provider.joinRoom(code, "host").then(() => {
      provider?.subscribe((message) => {
        const store = useHostStore.getState();
        switch (message.type) {
          case MSG.hello: {
            const { playerId, name } = message.payload as HelloPayload;
            store.join(playerId, name);
            const player = useHostStore.getState().room?.players.find((p) => p.id === playerId);
            const welcome: WelcomePayload = { playerId, progress: player?.progress ?? null };
            provider?.broadcast(MSG.welcome, welcome);
            scheduleSend();
            break;
          }
          case MSG.progress: {
            const { playerId, progress, roundNumber } = message.payload as ProgressPayload;
            store.report(playerId, progress, roundNumber);
            break;
          }
          case MSG.leave:
            store.leave((message.payload as { playerId: string }).playerId);
            break;
        }
      });
      send();
    });

    const unsubscribe = useHostStore.subscribe((s, prev) => {
      if (s.room !== prev.room) scheduleSend();
    });
    const tick = window.setInterval(() => useHostStore.getState().tick(), TICK_MS);
    const heartbeat = window.setInterval(() => {
      if (Date.now() - lastSent >= HEARTBEAT_MS) send();
    }, HEARTBEAT_MS / 2);

    return () => {
      unsubscribe();
      window.clearInterval(tick);
      window.clearInterval(heartbeat);
      if (pending !== null) window.clearTimeout(pending);
      void ready.then(() => provider?.leaveRoom());
      provider = null;
    };
  }, [code]);
}

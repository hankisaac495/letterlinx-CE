"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  gameConfigFromSnapshot,
  makeGameClock,
  MSG,
  restoreGame,
  toProgress,
  type PlayerProgress,
  type ProgressPayload,
  type RoomSnapshot,
  type WelcomePayload,
} from "@/lib/live";
import { createSyncProvider, type SyncProvider } from "@/lib/sync";
import { newId } from "@/lib/util/id";
import { useGameStore } from "@/store/gameStore";

export type JoinStatus = "idle" | "connecting" | "notFound" | "joined";

interface Identity {
  playerId: string;
  name: string;
  code: string;
}

const IDENTITY_KEY = "llce:player";
const JOIN_TIMEOUT_MS = 3000;
const PROGRESS_HEARTBEAT_MS = 3000;

function loadIdentity(): Identity | null {
  try {
    const raw = sessionStorage.getItem(IDENTITY_KEY);
    return raw ? (JSON.parse(raw) as Identity) : null;
  } catch {
    return null;
  }
}

function saveIdentity(identity: Identity | null) {
  try {
    if (identity) sessionStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
    else sessionStorage.removeItem(IDENTITY_KEY);
  } catch {
    // private mode etc.: rejoin after reload just won't be automatic
  }
}

/**
 * Student side of a live room. Each browser tab is one student (identity is kept
 * in sessionStorage so a reload rejoins with the same progress).
 */
export function useStudentRoom() {
  const [status, setStatus] = useState<JoinStatus>("idle");
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  /** Host clock minus ours, measured when each snapshot arrives. */
  const [skewMs, setSkewMs] = useState(0);
  const providerRef = useRef<SyncProvider | null>(null);
  const identityRef = useRef<Identity | null>(null);
  const restoreRef = useRef<PlayerProgress | null>(null);
  const roundRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const sendProgress = useCallback(() => {
    const id = identityRef.current;
    const game = useGameStore.getState().game;
    const round = roundRef.current;
    if (!providerRef.current || !id || !game || round === null) return;
    const payload: ProgressPayload = {
      playerId: id.playerId,
      roundNumber: round,
      progress: toProgress(game),
    };
    providerRef.current.broadcast(MSG.progress, payload);
  }, []);

  const disconnect = useCallback(async () => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    const p = providerRef.current;
    providerRef.current = null;
    await p?.leaveRoom();
  }, []);

  const connect = useCallback(
    async (id: Identity) => {
      await disconnect();
      identityRef.current = id;
      setIdentity(id);
      setStatus("connecting");
      setSnapshot(null);
      useGameStore.getState().reset();
      roundRef.current = null;

      const provider = createSyncProvider();
      providerRef.current = provider;
      await provider.joinRoom(id.code, id.playerId);
      provider.subscribe((message) => {
        if (message.type === MSG.welcome) {
          const w = message.payload as WelcomePayload;
          if (w.playerId !== id.playerId) return;
          if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
          restoreRef.current =
            w.progress && w.progress.found.length + w.progress.hints.length > 0 ? w.progress : null;
          saveIdentity(id);
          setStatus("joined");
        } else if (message.type === MSG.snapshot) {
          const snap = message.payload as RoomSnapshot;
          setSnapshot(snap);
          setSkewMs(snap.hostNow - Date.now());
          // Host lost us (e.g. projector reloaded without us): say hello again.
          if (!snap.players.some((p) => p.id === id.playerId)) {
            provider.broadcast(MSG.hello, { playerId: id.playerId, name: id.name });
          }
        }
      });
      provider.broadcast(MSG.hello, { playerId: id.playerId, name: id.name });
      timeoutRef.current = window.setTimeout(() => {
        setStatus((s) => {
          if (s !== "connecting") return s;
          void disconnect();
          return "notFound";
        });
      }, JOIN_TIMEOUT_MS);
    },
    [disconnect],
  );

  const join = useCallback(
    (code: string, name: string) => {
      const existing = loadIdentity();
      const playerId =
        existing && existing.code === code && existing.name === name
          ? existing.playerId
          : newId("p");
      void connect({ playerId, name, code });
    },
    [connect],
  );

  const leave = useCallback(() => {
    const id = identityRef.current;
    if (id) providerRef.current?.broadcast(MSG.leave, { playerId: id.playerId });
    void disconnect();
    saveIdentity(null);
    identityRef.current = null;
    useGameStore.getState().reset();
    setIdentity(null);
    setSnapshot(null);
    setStatus("idle");
  }, [disconnect]);

  // Auto-rejoin after a reload.
  useEffect(() => {
    const saved = loadIdentity();
    // Deferred so the rejoin's state updates happen outside the effect body.
    if (saved) void Promise.resolve().then(() => connect(saved));
    return () => void disconnect();
  }, [connect, disconnect]);

  // Drive the local game from room snapshots.
  useEffect(() => {
    if (!snapshot || status !== "joined") return;
    const store = useGameStore.getState();
    const clock = makeGameClock(snapshot.clock, skewMs);
    if (snapshot.phase === "lobby") {
      if (store.game) store.reset();
      roundRef.current = snapshot.roundNumber;
      return;
    }
    if (roundRef.current !== snapshot.roundNumber || !store.game) {
      roundRef.current = snapshot.roundNumber;
      const config = gameConfigFromSnapshot(snapshot);
      const startAt = snapshot.clock.startAt ?? Date.now();
      const restore = restoreRef.current;
      restoreRef.current = null;
      if (restore) store.load(restoreGame(config, startAt, restore), clock);
      else store.start(config, { startedAt: startAt, toGameNow: clock });
    } else {
      store.setClock(clock);
    }
    if (snapshot.phase === "ended") useGameStore.getState().end();
  }, [snapshot, status, skewMs]);

  // Report progress whenever the game changes, plus a heartbeat.
  useEffect(() => {
    if (status !== "joined") return;
    const unsub = useGameStore.subscribe((s, prev) => {
      if (s.game && s.game !== prev.game) sendProgress();
    });
    const heartbeat = window.setInterval(sendProgress, PROGRESS_HEARTBEAT_MS);
    return () => {
      unsub();
      window.clearInterval(heartbeat);
    };
  }, [status, sendProgress]);

  return { status, identity, snapshot, skewMs, join, leave };
}

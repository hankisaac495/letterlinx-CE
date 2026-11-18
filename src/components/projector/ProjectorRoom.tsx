"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { useHostSync } from "@/hooks/useHostSync";
import { useHostReady, useHostStore } from "@/store/hostStore";
import { ControlBar } from "./ControlBar";
import { LiveView } from "./LiveView";
import { Lobby } from "./Lobby";
import { Results } from "./Results";

const BOT_BATCH = 18;
const BOT_STAGGER_MS = 140;

export function ProjectorRoom() {
  const { code } = useParams<{ code: string }>();
  const ready = useHostReady();
  const room = useHostStore((s) => s.room);
  const active = ready && room?.code === code;
  useHostSync(active ? code : null);

  // "Simulate class": bots join one by one so names visibly pop in.
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);
  const simulate = useCallback(() => {
    const inLobby = useHostStore.getState().room?.phase === "lobby";
    if (!inLobby) {
      useHostStore.getState().addBots(Math.ceil(BOT_BATCH / 2));
      return;
    }
    for (let i = 0; i < BOT_BATCH; i++) {
      timers.current.push(
        window.setTimeout(() => useHostStore.getState().addBots(1), i * BOT_STAGGER_MS),
      );
    }
  }, []);

  if (!ready) return <p className="p-8 text-xl text-white/60">Loading…</p>;
  if (!active || !room) {
    return (
      <div className="m-auto max-w-lg p-8 text-center">
        <h1 className="text-4xl font-black">Room {code} isn’t open here</h1>
        <p className="mt-3 text-xl text-white/70">
          Rooms run in the browser that launched them. Launch a new round from the dashboard.
        </p>
        <Link
          href="/teacher"
          className="mt-6 inline-block rounded-2xl bg-white px-6 py-3 text-xl font-black text-slate-950 focus-visible:ring-4 focus-visible:ring-sky-400/50 focus-visible:outline-none"
        >
          Go to dashboard
        </Link>
      </div>
    );
  }

  return (
    <>
      <ControlBar room={room} onSimulate={simulate} />
      {room.phase === "lobby" ? (
        <Lobby room={room} onSimulate={simulate} />
      ) : room.phase === "ended" ? (
        <Results key={room.roundNumber} room={room} />
      ) : (
        <LiveView room={room} />
      )}
    </>
  );
}

"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { useHostSync } from "@/hooks/useHostSync";
import { createRng, randomSeed, shuffle } from "@/lib/game";
import { getRosterProvider, studentDisplayName } from "@/lib/roster";
import { useHostReady, useHostStore } from "@/store/hostStore";
import { useReportsReady } from "@/store/reportStore";
import { ControlBar } from "./ControlBar";
import { LiveView } from "./LiveView";
import { Lobby } from "./Lobby";
import { Results } from "./Results";

const BOT_BATCH = 18;
const BOT_STAGGER_MS = 140;

export function ProjectorRoom() {
  const { code } = useParams<{ code: string }>();
  const ready = useHostReady();
  useReportsReady(); // load saved reports so finished rounds are appended, not overwritten
  const room = useHostStore((s) => s.room);
  const active = ready && room?.code === code;
  useHostSync(active ? code : null);

  // "Simulate class": bots join one by one so names visibly pop in.
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);
  const simulate = useCallback(() => {
    const current = useHostStore.getState().room;
    if (!current) return;
    // With a class, simulated students come from its roster; otherwise invented names.
    const sectionId = current.round.sectionId;
    const roster = getRosterProvider().data;
    const section = sectionId ? roster.sections.find((sec) => sec.id === sectionId) : undefined;
    const candidates = section
      ? shuffle(
          createRng(randomSeed()),
          roster.students
            .filter((s) => section.students.includes(s.id))
            .map((s) => ({ id: s.id, name: studentDisplayName(s) })),
        )
      : undefined;
    const count = candidates ? Math.max(1, Math.round(candidates.length * 0.8)) : BOT_BATCH;
    if (current.phase !== "lobby") {
      useHostStore.getState().addBots(Math.ceil(count / 2), candidates);
      return;
    }
    for (let i = 0; i < count; i++) {
      timers.current.push(
        window.setTimeout(() => useHostStore.getState().addBots(1, candidates), i * BOT_STAGGER_MS),
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

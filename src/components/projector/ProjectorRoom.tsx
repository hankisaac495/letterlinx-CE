"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { useHostSync } from "@/hooks/useHostSync";
import { useProjectorSounds } from "@/hooks/useProjectorSounds";
import { useT } from "@/lib/i18n";
import { createRng, randomSeed, shuffle } from "@/lib/game";
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
  const t = useT();
  const ready = useHostReady();
  useReportsReady(); // load saved reports so finished rounds are appended, not overwritten
  const room = useHostStore((s) => s.room);
  const active = ready && room?.code === code;
  useHostSync(active ? code : null);
  useProjectorSounds(active ? room : null);

  // "Simulate class": bots join one by one so names visibly pop in.
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);
  const simulate = useCallback(() => {
    const current = useHostStore.getState().room;
    if (!current) return;
    // With a class, simulated students come from its roster; otherwise invented names.
    const classStudents = current.round.classInfo?.students;
    const candidates = classStudents?.length
      ? shuffle(createRng(randomSeed()), [...classStudents])
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

  if (!ready) return <p className="p-8 text-xl text-white/60">{t("proj.loading")}</p>;
  if (!active || !room) {
    return (
      <div className="m-auto max-w-lg p-8 text-center">
        <h1 className="text-4xl font-black">{t("proj.notOpen", { code })}</h1>
        <p className="mt-3 text-xl text-white/70">{t("proj.notOpenBody")}</p>
        <Link
          href="/teacher"
          className="mt-6 inline-block rounded-2xl bg-white px-6 py-3 text-xl font-black text-slate-950 focus-visible:ring-4 focus-visible:ring-sky-400/50 focus-visible:outline-none"
        >
          {t("proj.goDashboard")}
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

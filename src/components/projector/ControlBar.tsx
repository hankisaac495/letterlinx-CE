"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { RoomState } from "@/lib/live";
import { useHostStore } from "@/store/hostStore";

const base =
  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-400/50 disabled:opacity-40";
const quiet = `${base} bg-white/10 text-white hover:bg-white/20`;
const on = `${base} bg-sky-300 text-slate-950 hover:bg-sky-200`;

function Toggle({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick(): void;
  children: React.ReactNode;
}) {
  return (
    <button type="button" aria-pressed={pressed} className={pressed ? on : quiet} onClick={onClick}>
      {children}
    </button>
  );
}

export function ControlBar({ room, onSimulate }: { room: RoomState; onSimulate(): void }) {
  const { setView, pause, resume, end } = useHostStore.getState();
  const [confirmEnd, setConfirmEnd] = useState(false);
  const live = room.phase === "countdown" || room.phase === "playing" || room.phase === "paused";

  useEffect(() => {
    if (!confirmEnd) return;
    const id = window.setTimeout(() => setConfirmEnd(false), 4000);
    return () => window.clearTimeout(id);
  }, [confirmEnd]);

  const fullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.();
  };

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-slate-950/80 px-5 py-2.5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="font-black tracking-tight">LetterLinx</span>
        <span className="truncate text-white/60">{room.round.title}</span>
        <span
          className="rounded-md bg-white/10 px-2 py-0.5 font-mono text-sm font-bold tracking-widest"
          data-testid="bar-code"
        >
          {room.code}
        </span>
        <span className="hidden text-xs text-amber-200/80 md:inline">Prototype · demo data</span>
      </div>
      <nav aria-label="Round controls" className="flex flex-wrap items-center gap-2">
        <Toggle
          pressed={room.view.hideNames}
          onClick={() => setView({ hideNames: !room.view.hideNames })}
        >
          Hide names
        </Toggle>
        <Toggle
          pressed={room.view.hideLeaderboard}
          onClick={() => setView({ hideLeaderboard: !room.view.hideLeaderboard })}
        >
          Hide leaderboard
        </Toggle>
        {room.phase !== "ended" && (
          <button type="button" className={quiet} onClick={onSimulate}>
            Simulate class
          </button>
        )}
        {(room.phase === "playing" || room.phase === "paused") && (
          <button
            type="button"
            className={quiet}
            onClick={room.phase === "paused" ? resume : pause}
          >
            {room.phase === "paused" ? "Resume" : "Pause"}
          </button>
        )}
        {live &&
          (confirmEnd ? (
            <button
              type="button"
              className={`${base} bg-rose-500 text-white hover:bg-rose-400`}
              onClick={() => {
                setConfirmEnd(false);
                end();
              }}
            >
              Confirm end round
            </button>
          ) : (
            <button type="button" className={quiet} onClick={() => setConfirmEnd(true)}>
              End round
            </button>
          ))}
        <button type="button" className={quiet} onClick={fullscreen}>
          Full screen
        </button>
        {!live && (
          <Link href="/teacher" className={quiet}>
            Dashboard
          </Link>
        )}
      </nav>
    </header>
  );
}

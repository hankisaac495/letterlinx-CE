"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { extremes, totalHints, wordStats, type RoomState } from "@/lib/live";
import { prepareRound, randomSeed } from "@/lib/game";
import { wordColor } from "@/lib/game/colors";
import { useHostStore } from "@/store/hostStore";
import { formatSeconds } from "./format";
import { Leaderboard } from "./Leaderboard";
import { PROJECTOR_LETTERS } from "./LiveView";
import { RevealBoard } from "./RevealBoard";

export function Results({ room }: { room: RoomState }) {
  const router = useRouter();
  const stats = wordStats(room);
  const { most, least } = extremes(stats);
  const players = room.players.length;
  const word = (id: number) => room.round.words.find((w) => w.id === id)!;

  const rematch = () => {
    const { draft, settings } = room.round;
    const prepared = prepareRound({ ...draft, display: settings.display }, randomSeed());
    if (!prepared.ok) return;
    useHostStore
      .getState()
      .rematch({ ...room.round, board: prepared.board, words: prepared.words });
  };

  return (
    <div className="grid h-[calc(100dvh-3.25rem)] grid-cols-[auto_minmax(0,1fr)] gap-8 overflow-hidden p-6">
      <div className="w-[min(calc((100dvh-7rem)*0.655),50vw)]" data-testid="reveal-board">
        <RevealBoard
          board={room.round.board}
          words={room.round.words}
          letterClassName={PROJECTOR_LETTERS}
        />
      </div>
      <div className="flex min-h-0 flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-5xl font-black">Round over</h1>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={rematch}
              className="rounded-2xl bg-emerald-500 px-5 py-2.5 text-lg font-black text-emerald-950 hover:bg-emerald-400 focus-visible:ring-4 focus-visible:ring-emerald-300/50 focus-visible:outline-none"
            >
              Play again (new board)
            </button>
            <Link
              href={`/teacher/reports/${room.code}-${room.roundNumber}`}
              className="rounded-2xl bg-white/10 px-5 py-2.5 text-lg font-bold hover:bg-white/20 focus-visible:ring-4 focus-visible:ring-sky-400/50 focus-visible:outline-none"
            >
              View report
            </Link>
            <Link
              href="/teacher"
              onClick={(e) => {
                e.preventDefault();
                useHostStore.getState().close();
                router.push("/teacher");
              }}
              className="rounded-2xl bg-white/10 px-5 py-2.5 text-lg font-bold hover:bg-white/20 focus-visible:ring-4 focus-visible:ring-sky-400/50 focus-visible:outline-none"
            >
              Close room
            </Link>
          </div>
        </div>
        {players > 0 && most && least && (
          <div className="grid grid-cols-2 gap-3 text-xl">
            <div className="rounded-2xl bg-emerald-500/15 p-4" data-testid="most-found">
              <p className="font-bold text-emerald-300 uppercase">Most found</p>
              <p className="text-3xl font-black">{word(most.wordId).display}</p>
              <p className="text-white/70">
                {Math.round(most.share * 100)}% of the class · avg {formatSeconds(most.avgMs)}
              </p>
            </div>
            <div className="rounded-2xl bg-amber-500/15 p-4" data-testid="least-found">
              <p className="font-bold text-amber-300 uppercase">Least found</p>
              <p className="text-3xl font-black">{word(least.wordId).display}</p>
              <p className="text-white/70">
                {Math.round(least.share * 100)}% of the class
                {least.avgMs !== null ? ` · avg ${formatSeconds(least.avgMs)}` : ""}
              </p>
            </div>
          </div>
        )}
        <ul className="flex flex-wrap gap-2 text-lg" aria-label="Words found by the class">
          {stats.map((s) => (
            <li
              key={s.wordId}
              className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-1 font-bold"
            >
              <span
                className="size-3 rounded-full"
                style={{ backgroundColor: wordColor(s.wordId).fill }}
                aria-hidden="true"
              />
              {word(s.wordId).display}
              <span className="text-white/60 tabular-nums">{Math.round(s.share * 100)}%</span>
            </li>
          ))}
          {room.round.settings.display.allowHints &&
            room.round.settings.display.mode === "hidden" && (
              <li className="rounded-xl bg-white/5 px-3 py-1 font-bold text-white/70">
                {totalHints(room)} hints used
              </li>
            )}
        </ul>
        <section className="min-h-0 flex-1 overflow-hidden" aria-labelledby="final-heading">
          <h2 id="final-heading" className="mb-2 text-xl font-bold text-white/60 uppercase">
            Final standings
          </h2>
          {room.view.hideLeaderboard ? (
            <p className="rounded-2xl bg-white/5 p-5 text-2xl font-bold text-white/50">
              Leaderboard hidden
            </p>
          ) : (
            <Leaderboard room={room} limit={7} />
          )}
        </section>
      </div>
    </div>
  );
}

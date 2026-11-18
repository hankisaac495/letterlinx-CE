"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MiniBoard } from "@/components/game/MiniBoard";
import { useNow } from "@/hooks/useNow";
import {
  gameElapsedMs,
  timeRemainingMs,
  totalHints,
  wordProgressDistribution,
  wordStats,
  type RoomState,
} from "@/lib/live";
import { wordColor } from "@/lib/game/colors";
import { formatMs, wordLabel, displayName } from "./format";
import { Leaderboard } from "./Leaderboard";

export const PROJECTOR_LETTERS = "text-[10.5cqw]";

function Timer({ room, now }: { room: RoomState; now: number }) {
  const reduceMotion = useReducedMotion();
  const remaining = timeRemainingMs(room, now);
  const urgent = remaining !== null && remaining <= 10_000 && room.phase === "playing";
  const value = remaining ?? Math.max(0, gameElapsedMs(room.clock, now));
  return (
    <div className="flex items-end justify-between gap-4">
      <p className="text-xl font-bold text-white/60 uppercase">
        {room.phase === "paused" ? "Paused" : remaining === null ? "Time" : "Time left"}
      </p>
      <motion.p
        data-testid="projector-timer"
        className={`rounded-2xl px-5 py-1 text-7xl font-black tabular-nums ${
          urgent
            ? "bg-rose-600 text-white"
            : room.phase === "paused"
              ? "bg-white/10 text-white/60"
              : "text-white"
        }`}
        animate={urgent && !reduceMotion ? { scale: [1, 1.06, 1] } : { scale: 1 }}
        transition={urgent ? { duration: 0.5, repeat: Infinity, repeatDelay: 0.5 } : undefined}
      >
        {formatMs(value)}
      </motion.p>
    </div>
  );
}

function WordsPanel({ room }: { room: RoomState }) {
  const { mode, showClues, allowHints } = room.round.settings.display;
  const players = room.players.length;

  if (mode === "hidden") {
    return (
      <div className="flex items-baseline justify-between rounded-2xl bg-white/5 px-5 py-3 text-2xl font-bold">
        <span>{room.round.words.length} hidden words</span>
        {allowHints && (
          <span className="text-white/70" data-testid="hints-used">
            {totalHints(room)} hints used
          </span>
        )}
      </div>
    );
  }

  if (mode === "oneAtATime") {
    const { onWord, done } = wordProgressDistribution(room);
    const segments = [
      ...onWord.map((n, i) => ({ key: `w${i}`, n, i })),
      { key: "done", n: done, i: -1 },
    ];
    return (
      <div className="rounded-2xl bg-white/5 px-5 py-3" data-testid="class-progress">
        <p className="text-xl font-bold text-white/70">Class progress</p>
        <div
          className="mt-2 flex h-10 overflow-hidden rounded-xl bg-white/10"
          role="img"
          aria-label="Students on each word"
        >
          {segments.map((s) =>
            s.n === 0 ? null : (
              <motion.div
                key={s.key}
                layout
                className="flex items-center justify-center text-lg font-black"
                style={{
                  width: `${(s.n / Math.max(1, players)) * 100}%`,
                  backgroundColor: s.i < 0 ? "#10b981" : wordColor(s.i).fill,
                  color: s.i < 0 ? "#052e16" : wordColor(s.i).ink,
                }}
              >
                {s.n}
              </motion.div>
            ),
          )}
        </div>
        <ol className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-base text-white/70">
          {room.round.words.map((w, i) => (
            <li key={w.id} className="flex items-center gap-1.5">
              <span
                className="size-3 rounded-full"
                style={{ backgroundColor: wordColor(i).fill }}
                aria-hidden="true"
              />
              {showClues ? `Word ${i + 1}` : w.display}
            </li>
          ))}
          <li className="flex items-center gap-1.5">
            <span className="size-3 rounded-full bg-emerald-500" aria-hidden="true" /> Done
          </li>
        </ol>
      </div>
    );
  }

  const stats = wordStats(room);
  return (
    <ul className="grid grid-cols-2 gap-2" aria-label="Words">
      {room.round.words.map((w, i) => (
        <li
          key={w.id}
          className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-1.5 text-xl font-extrabold"
        >
          <span
            className="flex size-6 shrink-0 items-center justify-center rounded-full text-sm"
            style={{ backgroundColor: wordColor(w.id).fill, color: wordColor(w.id).ink }}
            aria-hidden="true"
          >
            {w.id + 1}
          </span>
          <span className="flex-1 truncate">{showClues ? w.clue : w.display}</span>
          <span className="text-base text-white/60 tabular-nums">
            {stats[i].foundBy}/{players}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Feed({ room }: { room: RoomState }) {
  const reduceMotion = useReducedMotion();
  const hidden = room.round.settings.display.mode === "hidden";
  const items = room.feed.slice(0, 4);
  return (
    <ul
      className="flex flex-col gap-1 text-xl"
      aria-label="Recent finds"
      aria-live="polite"
      data-testid="feed"
    >
      <AnimatePresence initial={false}>
        {items.map((item) => {
          const player = room.players.find((p) => p.id === item.playerId);
          if (!player) return null;
          return (
            <motion.li
              key={item.id}
              layout
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="truncate text-white/80"
            >
              <strong className="text-white">{displayName(room, player)}</strong> found{" "}
              {hidden ? (
                "a word"
              ) : (
                <strong className="text-amber-300">{wordLabel(room, item.wordId)}</strong>
              )}
            </motion.li>
          );
        })}
      </AnimatePresence>
      {items.length === 0 && <li className="text-white/40">Finds will appear here.</li>}
    </ul>
  );
}

export function LiveView({ room }: { room: RoomState }) {
  const now = useNow(true, 200);
  const countdown =
    room.phase === "countdown" && room.clock.startAt !== null ? room.clock.startAt - now : null;

  return (
    <div className="grid h-[calc(100dvh-3.25rem)] grid-cols-[auto_minmax(0,1fr)] gap-8 overflow-hidden p-6">
      <div className="relative w-[min(calc((100dvh-7rem)*0.655),55vw)]">
        <MiniBoard board={room.round.board} letterClassName={PROJECTOR_LETTERS} />
        {countdown !== null && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[4%] bg-slate-950/80">
            <p className="text-4xl font-bold">Get ready</p>
            <motion.p
              key={Math.ceil(countdown / 1000)}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-[22vh] leading-none font-black tabular-nums"
            >
              {Math.max(1, Math.ceil(countdown / 1000))}
            </motion.p>
          </div>
        )}
        {room.phase === "paused" && (
          <div className="absolute inset-0 flex items-center justify-center rounded-[4%] bg-slate-950/80">
            <p className="text-7xl font-black" data-testid="projector-paused">
              Paused
            </p>
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-col gap-5" data-testid="projector-side">
        <Timer room={room} now={now} />
        <WordsPanel room={room} />
        <section aria-labelledby="lb-heading" className="min-h-0 flex-1 overflow-hidden">
          <h2 id="lb-heading" className="mb-2 text-xl font-bold text-white/60 uppercase">
            {room.round.settings.teamMode ? "Teams" : "Leaderboard"}
          </h2>
          {room.view.hideLeaderboard ? (
            <p className="rounded-2xl bg-white/5 p-5 text-2xl font-bold text-white/50">
              Leaderboard hidden
            </p>
          ) : (
            <Leaderboard room={room} limit={6} />
          )}
        </section>
        <section aria-labelledby="feed-heading">
          <h2 id="feed-heading" className="mb-1 text-xl font-bold text-white/60 uppercase">
            Recent finds
          </h2>
          <Feed room={room} />
        </section>
      </div>
    </div>
  );
}

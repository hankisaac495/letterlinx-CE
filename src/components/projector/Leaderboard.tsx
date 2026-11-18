"use client";

import { motion, useReducedMotion } from "framer-motion";
import { standings, teamStandings, TEAM_NAMES, type RoomState } from "@/lib/live";
import { displayName } from "./format";

const TEAM_COLORS = ["#E69F00", "#56B4E9", "#009E73", "#CC79A7", "#F0E442", "#D55E00"];

export function teamColor(team: number): string {
  return TEAM_COLORS[team % TEAM_COLORS.length];
}

export function Leaderboard({
  room,
  limit = 8,
  big,
}: {
  room: RoomState;
  limit?: number;
  big?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const total = room.round.words.length;
  const transition = reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 500, damping: 40 };

  if (room.round.settings.teamMode) {
    const teams = teamStandings(room);
    const max = Math.max(1, ...teams.map((t) => t.score));
    return (
      <ol className="flex flex-col gap-2" aria-label="Team standings" data-testid="team-standings">
        {teams.map((t, i) => (
          <motion.li
            key={t.team}
            layout
            transition={transition}
            className="rounded-xl bg-white/5 px-4 py-2.5"
          >
            <div
              className={`flex items-center gap-3 ${big ? "text-3xl" : "text-2xl"} font-extrabold`}
            >
              <span className="w-8 text-white/50 tabular-nums">{i + 1}</span>
              <span
                className="size-4 rounded-full"
                style={{ backgroundColor: teamColor(t.team) }}
                aria-hidden="true"
              />
              <span className="flex-1 truncate">{TEAM_NAMES[t.team]}</span>
              <span className="text-base font-semibold text-white/60">{t.members} players</span>
              <span className="w-24 text-right tabular-nums">{t.score}</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: teamColor(t.team) }}
                animate={{ width: `${(t.score / max) * 100}%` }}
                transition={transition}
              />
            </div>
          </motion.li>
        ))}
      </ol>
    );
  }

  const rows = standings(room).slice(0, limit);
  if (rows.length === 0) return <p className="text-xl text-white/60">No players yet.</p>;
  return (
    <ol className="flex flex-col gap-1.5" aria-label="Leaderboard" data-testid="leaderboard">
      {rows.map((s) => (
        <motion.li
          key={s.playerId}
          layout
          transition={transition}
          className={`flex items-center gap-3 rounded-xl px-3 py-1.5 font-extrabold ${big ? "text-3xl" : "text-2xl"} ${
            s.rank === 1 ? "bg-amber-400/20" : "bg-white/5"
          }`}
        >
          <span className="w-8 text-white/50 tabular-nums">{s.rank}</span>
          <span className="flex-1 truncate">
            {displayName(room, { id: s.playerId, name: s.name })}
          </span>
          <span className="text-lg font-semibold text-white/60 tabular-nums">
            {s.found}/{total}
          </span>
          <span className="w-20 text-right tabular-nums">{s.score}</span>
        </motion.li>
      ))}
    </ol>
  );
}

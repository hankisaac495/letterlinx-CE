"use client";

import { useT } from "@/lib/i18n";
import { motion, useReducedMotion } from "framer-motion";
import { timeRemainingMs, elapsedMs, type GameState } from "@/lib/game";

export function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function GameHeader({ game, now, title }: { game: GameState; now: number; title: string }) {
  const t = useT();
  const reduceMotion = useReducedMotion();
  const remaining = timeRemainingMs(game, now);
  const urgent = remaining !== null && remaining <= 10_000 && game.status === "playing";
  return (
    <header className="flex w-full items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold tracking-widest text-slate-500 uppercase">
          {title}
        </p>
        <p className="text-sm text-slate-500">
          {remaining === null ? t("game.untimed") : t("game.timeLeft")}
        </p>
      </div>
      <motion.div
        data-testid="timer"
        className={`rounded-xl px-3 py-1 text-2xl font-black tabular-nums ${
          urgent ? "bg-rose-600 text-white" : "bg-slate-900 text-white"
        }`}
        animate={urgent && !reduceMotion ? { scale: [1, 1.08, 1] } : { scale: 1 }}
        transition={urgent ? { duration: 0.5, repeat: Infinity, repeatDelay: 0.5 } : undefined}
        aria-label={remaining === null ? t("game.elapsed") : t("game.timeLeft")}
      >
        {remaining === null ? formatClock(elapsedMs(game, now)) : formatClock(remaining)}
      </motion.div>
      <div className="text-right">
        <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase">
          {t("game.score")}
        </p>
        <p className="text-2xl font-black tabular-nums" data-testid="score">
          {game.score}
        </p>
      </div>
    </header>
  );
}

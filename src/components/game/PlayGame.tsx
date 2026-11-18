"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { elapsedMs, timeRemainingMs, type GameState } from "@/lib/game";
import type { RoomPhase, Standing } from "@/lib/live";
import { useNow } from "@/hooks/useNow";
import { useT } from "@/lib/i18n";
import { useSfx } from "@/store/soundStore";
import { SoundToggle } from "@/components/ui/SoundToggle";
import { useRef } from "react";
import { useGameStore } from "@/store/gameStore";
import { GameBoard, type TileHighlight } from "./GameBoard";
import { formatClock, GameHeader } from "./GameHeader";
import { HintButton } from "./HintButton";
import { WordPanel } from "./WordPanel";

const HINT_CLEAR_MS = 1100;

function useHighlights(game: GameState | null) {
  return useMemo(() => {
    const map = new Map<number, TileHighlight>();
    if (!game) return map;
    for (const f of game.found) {
      f.path.forEach((tile, order) =>
        map.set(tile, { wordId: f.wordId, order, badge: order === 0 }),
      );
    }
    return map;
  }, [game]);
}

interface Feedback {
  key: number;
  text: string;
  tone: "good" | "neutral";
}

/** Extra state when the game is part of a live round. */
export interface LiveRoundInfo {
  phase: RoomPhase;
  /** ms until play starts, during the countdown. */
  countdownMs: number | null;
  standing: Standing | null;
  totalPlayers: number;
  teamName: string | null;
}

function ResultCard({
  game,
  live,
  onPlayAgain,
}: {
  game: GameState;
  live?: LiveRoundInfo;
  onPlayAgain(): void;
}) {
  const t = useT();
  const complete = game.status === "complete";
  const roundOver = !live || live.phase === "ended";
  const total = game.config.words.length;
  return (
    <motion.div
      role="status"
      data-testid="result"
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="mx-4 w-full max-w-xs rounded-2xl bg-white p-6 text-center shadow-2xl ring-1 ring-slate-200"
    >
      <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase">
        {complete
          ? t("game.complete")
          : game.status === "timeUp"
            ? t("game.timeUp")
            : t("game.roundOver")}
      </p>
      <h2 className="mt-1 text-2xl font-black text-slate-900">
        {complete ? t("game.allFound") : t("game.foundOf", { found: game.found.length, total })}
      </h2>
      <dl className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-100 p-3">
          <dt className="text-xs font-semibold text-slate-500 uppercase">{t("game.time")}</dt>
          <dd className="text-xl font-black tabular-nums">{formatClock(elapsedMs(game, 0))}</dd>
        </div>
        <div className="rounded-xl bg-slate-100 p-3">
          <dt className="text-xs font-semibold text-slate-500 uppercase">{t("game.score")}</dt>
          <dd className="text-xl font-black tabular-nums">{game.score}</dd>
        </div>
      </dl>
      {live?.standing && live.phase === "ended" && (
        <p className="mt-4 text-lg font-black text-slate-900" data-testid="final-rank">
          {t("game.placed", { rank: live.standing.rank, total: live.totalPlayers })}
        </p>
      )}
      {!roundOver && <p className="mt-4 text-sm text-slate-500">{t("game.waiting")}</p>}
      {live && roundOver && <p className="mt-2 text-sm text-slate-500">{t("game.lookUp")}</p>}
      {!live && (
        <button
          type="button"
          onClick={onPlayAgain}
          className="mt-5 w-full rounded-xl bg-blue-700 px-4 py-2.5 font-extrabold text-white hover:bg-blue-600 focus-visible:ring-4 focus-visible:ring-blue-200 focus-visible:outline-none"
        >
          {t("game.playAgain")}
        </button>
      )}
    </motion.div>
  );
}

export function PlayGame({
  title,
  onExit,
  live,
}: {
  title: string;
  onExit(): void;
  live?: LiveRoundInfo;
}) {
  const t = useT();
  const play = useSfx("student");
  const game = useGameStore((s) => s.game);
  const hint = useGameStore((s) => s.hint);
  const submit = useGameStore((s) => s.submit);
  const takeHint = useGameStore((s) => s.takeHint);
  const clearHint = useGameStore((s) => s.clearHint);
  const tick = useGameStore((s) => s.tick);
  const end = useGameStore((s) => s.end);
  const toGameNow = useGameStore((s) => s.toGameNow);
  const playing = game?.status === "playing";
  const roomActive = !live || live.phase === "playing";
  const realNow = useNow(playing || live?.phase === "countdown");
  const now = toGameNow(realNow);
  const highlights = useHighlights(game);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    if (playing) tick();
  }, [now, playing, tick]);

  useEffect(() => {
    if (!hint) return;
    const id = window.setTimeout(() => clearHint(hint.key), HINT_CLEAR_MS);
    return () => window.clearTimeout(id);
  }, [hint, clearHint]);

  // Last-10-seconds tick and the round-end flourish.
  const remaining = game ? timeRemainingMs(game, now) : null;
  const secsLeft = remaining === null ? null : Math.ceil(remaining / 1000);
  useEffect(() => {
    if (playing && roomActive && secsLeft !== null && secsLeft > 0 && secsLeft <= 10) play("tick");
  }, [secsLeft, playing, roomActive, play]);
  const prevStatus = useRef(game?.status);
  useEffect(() => {
    const status = game?.status;
    if (prevStatus.current === "playing" && (status === "timeUp" || status === "ended"))
      play("roundEnd");
    prevStatus.current = status;
  }, [game?.status, play]);
  const selectionLength = useRef(0);
  const onSelectionChange = (path: number[]) => {
    if (path.length > selectionLength.current) play("tock", { step: path.length - 1 });
    selectionLength.current = path.length;
  };

  useEffect(() => {
    if (!feedback) return;
    const id = window.setTimeout(() => setFeedback(null), 900);
    return () => window.clearTimeout(id);
  }, [feedback]);

  if (!game) return null;

  const onSubmit = (path: number[]) => {
    const outcome = submit(path);
    if (outcome.type === "found") {
      const allDone = useGameStore.getState().game?.status === "complete";
      play(allDone ? "allFound" : "found");
      setFeedback({
        key: Date.now(),
        text: `${t("game.foundToast", { word: outcome.word.display, points: outcome.found.points })}${outcome.found.hintPenalty ? " (½)" : ""}`,
        tone: "good",
      });
      setAnnouncement(
        t("game.foundAnnounce", { word: outcome.word.display, points: outcome.found.points }),
      );
    } else if (outcome.type === "alreadyFound") {
      setFeedback({
        key: Date.now(),
        text: t("game.alreadyFound", { word: outcome.word.display }),
        tone: "neutral",
      });
    } else if (outcome.type === "miss") {
      play("miss");
    }
    return outcome.type;
  };

  const onHint = () => {
    const r = takeHint();
    if (r?.ok) setAnnouncement(t("game.hintShown"));
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center gap-3 px-4 py-3 lg:max-w-5xl">
      <GameHeader game={game} now={now} title={title} />

      <div className="flex w-full flex-1 flex-col items-center gap-3 lg:flex-row lg:items-start lg:justify-center lg:gap-10">
        <div className="flex min-h-14 w-full items-center justify-center lg:w-80 lg:shrink-0 lg:justify-start lg:pt-2">
          <WordPanel game={game} />
        </div>

        <div className="flex w-full max-w-[min(520px,calc((100dvh_-_250px)*2/3))] min-w-[260px] flex-col gap-3 lg:max-w-[min(600px,calc((100dvh_-_170px)*2/3))]">
          <div className="relative w-full">
            <GameBoard
              board={game.config.board}
              highlights={highlights}
              hint={hint}
              disabled={!playing || !roomActive}
              onSubmit={onSubmit}
              onSelectionChange={onSelectionChange}
              label={t("game.boardLabel")}
            />

            <div className="pointer-events-none absolute inset-x-0 -top-2 flex justify-center">
              <AnimatePresence>
                {feedback && (
                  <motion.div
                    key={feedback.key}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: -6 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.25 }}
                    className={`rounded-full px-3 py-1 text-sm font-extrabold shadow-lg ${
                      feedback.tone === "good"
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-700 text-white"
                    }`}
                  >
                    {feedback.text}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {!playing && (
              <div className="absolute inset-0 flex items-center justify-center rounded-[4%] bg-slate-900/40 backdrop-blur-[1px]">
                <ResultCard game={game} live={live} onPlayAgain={onExit} />
              </div>
            )}
            {playing && live?.phase === "countdown" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[4%] bg-slate-900/70 text-white">
                <p className="text-lg font-bold">{t("game.getReady")}</p>
                <motion.p
                  key={Math.ceil((live.countdownMs ?? 0) / 1000)}
                  initial={{ scale: 1.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-8xl font-black tabular-nums"
                  data-testid="countdown"
                >
                  {Math.max(1, Math.ceil((live.countdownMs ?? 0) / 1000))}
                </motion.p>
              </div>
            )}
            {playing && live?.phase === "paused" && (
              <div className="absolute inset-0 flex items-center justify-center rounded-[4%] bg-slate-900/70 text-white">
                <p className="text-4xl font-black" data-testid="paused">
                  {t("game.paused")}
                </p>
              </div>
            )}
          </div>

          <div className="flex w-full items-center justify-between gap-3">
            {live ? (
              <p className="text-sm font-semibold text-slate-500">
                {live.teamName
                  ? t("game.team", { name: live.teamName })
                  : t("game.playing", { count: live.totalPlayers })}
              </p>
            ) : (
              <button
                type="button"
                onClick={() => (playing ? end() : onExit())}
                className="rounded-full px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 focus-visible:ring-4 focus-visible:ring-slate-300 focus-visible:outline-none"
              >
                {playing ? t("game.endRound") : t("game.back")}
              </button>
            )}
            <span className="mr-auto">
              <SoundToggle context="student" />
            </span>
            {playing && roomActive && <HintButton game={game} now={now} onHint={onHint} />}
          </div>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}

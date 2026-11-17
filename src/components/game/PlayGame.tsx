"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { elapsedMs, type GameState } from "@/lib/game";
import { useNow } from "@/hooks/useNow";
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

function ResultCard({ game, onPlayAgain }: { game: GameState; onPlayAgain(): void }) {
  const complete = game.status === "complete";
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
        {complete ? "Complete" : game.status === "timeUp" ? "Time's up" : "Round over"}
      </p>
      <h2 className="mt-1 text-2xl font-black text-slate-900">
        {complete ? "All words found!" : `${game.found.length} of ${total} found`}
      </h2>
      <dl className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-100 p-3">
          <dt className="text-xs font-semibold text-slate-500 uppercase">Time</dt>
          <dd className="text-xl font-black tabular-nums">{formatClock(elapsedMs(game, 0))}</dd>
        </div>
        <div className="rounded-xl bg-slate-100 p-3">
          <dt className="text-xs font-semibold text-slate-500 uppercase">Score</dt>
          <dd className="text-xl font-black tabular-nums">{game.score}</dd>
        </div>
      </dl>
      {complete && (
        <p className="mt-4 text-sm text-slate-500">Nice work. Waiting for the round to finish…</p>
      )}
      <button
        type="button"
        onClick={onPlayAgain}
        className="mt-5 w-full rounded-xl bg-blue-700 px-4 py-2.5 font-extrabold text-white hover:bg-blue-600 focus-visible:ring-4 focus-visible:ring-blue-200 focus-visible:outline-none"
      >
        Play again
      </button>
    </motion.div>
  );
}

export function PlayGame({ title, onExit }: { title: string; onExit(): void }) {
  const game = useGameStore((s) => s.game);
  const hint = useGameStore((s) => s.hint);
  const submit = useGameStore((s) => s.submit);
  const takeHint = useGameStore((s) => s.takeHint);
  const clearHint = useGameStore((s) => s.clearHint);
  const tick = useGameStore((s) => s.tick);
  const end = useGameStore((s) => s.end);
  const playing = game?.status === "playing";
  const now = useNow(playing);
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

  useEffect(() => {
    if (!feedback) return;
    const id = window.setTimeout(() => setFeedback(null), 900);
    return () => window.clearTimeout(id);
  }, [feedback]);

  if (!game) return null;

  const onSubmit = (path: number[]) => {
    const outcome = submit(path);
    if (outcome.type === "found") {
      setFeedback({
        key: Date.now(),
        text: `${outcome.word.display} +${outcome.found.points}${outcome.found.hintPenalty ? " (½)" : ""}`,
        tone: "good",
      });
      setAnnouncement(`Found ${outcome.word.display}. ${outcome.found.points} points.`);
    } else if (outcome.type === "alreadyFound") {
      setFeedback({
        key: Date.now(),
        text: `${outcome.word.display} already found`,
        tone: "neutral",
      });
    }
    return outcome.type;
  };

  const onHint = () => {
    const r = takeHint();
    if (r?.ok) setAnnouncement("Hint shown on the board.");
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
              disabled={!playing}
              onSubmit={onSubmit}
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
                <ResultCard game={game} onPlayAgain={onExit} />
              </div>
            )}
          </div>

          <div className="flex w-full items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => (playing ? end() : onExit())}
              className="rounded-full px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 focus-visible:ring-4 focus-visible:ring-slate-300 focus-visible:outline-none"
            >
              {playing ? "End round" : "Back"}
            </button>
            {playing && <HintButton game={game} now={now} onHint={onHint} />}
          </div>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}

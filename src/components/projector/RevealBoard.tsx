"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { boardGeometry, MiniBoard } from "@/components/game/MiniBoard";
import { wordColor } from "@/lib/game/colors";
import type { Board, TargetWord } from "@/lib/game";

const STEP_MS = 900;

/** End-of-round reveal: draws each word's path one after another. */
export function RevealBoard({
  board,
  words,
  letterClassName,
}: {
  board: Board;
  words: TargetWord[];
  letterClassName?: string;
}) {
  const reduceMotion = useReducedMotion();
  const [shown, setShown] = useState(0);
  const count = reduceMotion ? words.length : shown;

  useEffect(() => {
    if (reduceMotion || shown >= words.length) return;
    const id = window.setTimeout(() => setShown((n) => n + 1), shown === 0 ? 400 : STEP_MS);
    return () => window.clearTimeout(id);
  }, [shown, words.length, reduceMotion]);

  const revealed = words.slice(0, count);
  const revealedBoard: Board = {
    ...board,
    placements: revealed.map((w) => ({ word: w.normalized, path: w.path })),
  };
  const { at, height, tile } = boardGeometry(board);

  return (
    <MiniBoard
      board={revealedBoard}
      showWords
      wordIdFor={(word) => words.find((w) => w.normalized === word)?.id ?? 0}
      letterClassName={letterClassName}
    >
      <svg
        className="pointer-events-none absolute inset-0 size-full"
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {revealed.map((w) => (
          <motion.polyline
            key={w.id}
            points={w.path.map((i) => `${at(i).x},${at(i).y}`).join(" ")}
            fill="none"
            stroke={
              wordColor(w.id).ink === "#ffffff" ? "rgba(255,255,255,0.75)" : "rgba(15,23,42,0.55)"
            }
            strokeWidth={tile * 0.1}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: reduceMotion ? 1 : 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.6, ease: "easeInOut" }}
          />
        ))}
      </svg>
      <p className="sr-only" aria-live="polite">
        {revealed.map((w) => w.display).join(", ")}
      </p>
    </MiniBoard>
  );
}

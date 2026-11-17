"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { currentWord, type GameState, type TargetWord } from "@/lib/game";
import { wordColor } from "@/lib/game/colors";

function Badge({ word }: { word: TargetWord }) {
  const c = wordColor(word.id);
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold"
      style={{ backgroundColor: c.fill, color: c.ink }}
    >
      {word.id + 1}
    </span>
  );
}

function FoundCheck() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4 shrink-0 text-emerald-600">
      <path
        d="M3 8.5l3 3 7-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Full list: every word (or clue) above the tiles, found ones checked off. */
function FullList({ game, showClues }: { game: GameState; showClues: boolean }) {
  const foundIds = new Set(game.found.map((f) => f.wordId));
  return (
    <ul
      className={
        showClues
          ? "flex w-full flex-col gap-1.5"
          : "flex flex-wrap justify-center gap-2 lg:justify-start"
      }
      aria-label="Words to find"
    >
      {game.config.words.map((w) => {
        const found = foundIds.has(w.id);
        return (
          <li
            key={w.id}
            data-word={w.normalized}
            data-found={found}
            className={`flex items-center gap-2 rounded-lg px-2.5 py-1 text-sm transition-colors ${
              found
                ? "bg-slate-100 text-slate-500"
                : "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
            }`}
          >
            {found ? <FoundCheck /> : <Badge word={w} />}
            {showClues ? (
              <span className="flex-1">
                {found && (
                  <strong className="mr-1.5 font-extrabold text-slate-700">{w.display}</strong>
                )}
                <span className={found ? "line-through" : ""}>{w.clue}</span>
              </span>
            ) : (
              <span className={`font-extrabold tracking-wide ${found ? "line-through" : ""}`}>
                {w.display}
              </span>
            )}
            <span className="sr-only">{found ? "found" : "not found yet"}</span>
          </li>
        );
      })}
    </ul>
  );
}

/** One at a time: only the current target; the next slides in when it's found. */
function OneAtATime({ game, showClues }: { game: GameState; showClues: boolean }) {
  const reduceMotion = useReducedMotion();
  const word = currentWord(game);
  const total = game.config.words.length;
  return (
    <div className="flex flex-col items-center gap-1">
      <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase">
        Word {Math.min(game.found.length + 1, total)} of {total}
      </p>
      <div className="relative flex min-h-12 w-full items-center justify-center overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          {word ? (
            <motion.div
              key={word.id}
              data-current-word={word.normalized}
              initial={reduceMotion ? { opacity: 0 } : { x: 60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { x: -60, opacity: 0 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="flex items-center gap-2 text-center"
              aria-live="polite"
            >
              <Badge word={word} />
              {showClues ? (
                <span className="text-lg font-semibold text-slate-800">{word.clue}</span>
              ) : (
                <span className="text-3xl font-black tracking-wider text-slate-900">
                  {word.display}
                </span>
              )}
            </motion.div>
          ) : (
            <motion.p
              key="done"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-lg font-bold text-emerald-700"
            >
              All words found!
            </motion.p>
          )}
        </AnimatePresence>
      </div>
      {game.found.length > 0 && (
        <p className="text-xs text-slate-500">
          Found: {game.found.map((f) => game.config.words[f.wordId].display).join(" · ")}
        </p>
      )}
    </div>
  );
}

/** Hidden: only a counter, plus words as they're found. */
function Hidden({ game }: { game: GameState }) {
  const total = game.config.words.length;
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-lg font-extrabold text-slate-900" aria-live="polite" data-found-counter>
        {game.found.length} of {total} found
      </p>
      {game.found.length > 0 && (
        <ul className="flex flex-wrap justify-center gap-2" aria-label="Words found">
          {game.found.map((f) => {
            const w = game.config.words[f.wordId];
            return (
              <motion.li
                key={w.id}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-sm font-extrabold shadow-sm ring-1 ring-slate-200"
              >
                <Badge word={w} />
                {w.display}
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function WordPanel({ game }: { game: GameState }) {
  const { mode, showClues } = game.config.display;
  if (mode === "hidden") return <Hidden game={game} />;
  if (mode === "oneAtATime") return <OneAtATime game={game} showClues={showClues} />;
  return <FullList game={game} showClues={showClues} />;
}

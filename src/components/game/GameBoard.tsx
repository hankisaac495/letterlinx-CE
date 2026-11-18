"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { isAdjacent, type Board } from "@/lib/game";
import { wordColor } from "@/lib/game/colors";

export interface TileHighlight {
  wordId: number;
  /** Position of this tile along the word's path (drives the fill sequence). */
  order: number;
  /** Show the word's number badge on this tile (first tile of each found word). */
  badge: boolean;
}

export type SubmitReaction = "found" | "miss" | "alreadyFound" | "ignored";

interface GameBoardProps {
  board: Board;
  highlights: ReadonlyMap<number, TileHighlight>;
  hint: { key: number; path: number[] } | null;
  disabled?: boolean;
  onSubmit(path: number[]): SubmitReaction;
  onSelectionChange?(path: number[]): void;
  /** Accessible name for the board. */
  label?: string;
}

interface Point {
  x: number;
  y: number;
}

/** Share of the tile's width the pointer must be within (from centre) to select it. */
const HIT_RADIUS = 0.45;
const HINT_TOTAL_MS = 1000;
const MISS_MS = 360;

const TILE_BG = "#ffffff";
const TILE_INK = "#0f172a";
const SELECT_BG = "#5b21b6";
const SELECT_INK = "#ffffff";

export function GameBoard({
  board,
  highlights,
  hint,
  disabled,
  onSubmit,
  onSelectionChange,
  label = "Letter board. Drag across neighbouring letters to spell a word.",
}: GameBoardProps) {
  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const tileRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rectsRef = useRef<DOMRect[]>([]);
  const selectionRef = useRef<number[]>([]);
  const [selection, setSelection] = useState<number[]>([]);
  const [layout, setLayout] = useState<{ centers: Point[]; tileWidth: number }>({
    centers: [],
    tileWidth: 40,
  });
  const [miss, setMiss] = useState<{ key: number; path: number[] } | null>(null);

  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const origin = container.getBoundingClientRect();
    rectsRef.current = tileRefs.current.map((el) => el?.getBoundingClientRect() ?? new DOMRect());
    setLayout({
      centers: rectsRef.current.map((r) => ({
        x: r.left - origin.left + r.width / 2,
        y: r.top - origin.top + r.height / 2,
      })),
      tileWidth: rectsRef.current[0]?.width || 40,
    });
  }, []);

  useLayoutEffect(() => {
    measure();
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    window.addEventListener("scroll", measure, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", measure, true);
    };
  }, [measure, board]);

  useEffect(() => {
    if (!miss) return;
    const id = window.setTimeout(() => setMiss(null), MISS_MS);
    return () => window.clearTimeout(id);
  }, [miss]);

  const updateSelection = (next: number[]) => {
    selectionRef.current = next;
    setSelection(next);
    onSelectionChange?.(next);
  };

  const tileAt = (x: number, y: number): number | null => {
    const rects = rectsRef.current;
    for (let i = 0; i < rects.length; i++) {
      const r = rects[i];
      const dx = x - (r.left + r.width / 2);
      const dy = y - (r.top + r.height / 2);
      const radius = r.width * HIT_RADIUS;
      if (dx * dx + dy * dy <= radius * radius) return i;
    }
    return null;
  };

  const extendTo = (tile: number) => {
    const sel = selectionRef.current;
    const last = sel.at(-1);
    if (last === undefined || tile === last) return;
    if (tile === sel.at(-2)) {
      updateSelection(sel.slice(0, -1)); // drag back to undo
    } else if (!sel.includes(tile) && isAdjacent(last, tile, board.cols)) {
      updateSelection([...sel, tile]);
    }
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || (e.pointerType === "mouse" && e.button !== 0)) return;
    measure();
    const tile = tileAt(e.clientX, e.clientY);
    if (tile === null) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateSelection([tile]);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (selectionRef.current.length === 0) return;
    const tile = tileAt(e.clientX, e.clientY);
    if (tile !== null) extendTo(tile);
  };

  const finish = () => {
    const path = selectionRef.current;
    if (path.length === 0) return;
    updateSelection([]);
    const reaction = onSubmit(path);
    if (reaction === "miss") setMiss({ key: Date.now(), path });
  };

  const linePoints = selection
    .map((i) => layout.centers[i])
    .filter(Boolean)
    .map((p) => `${p.x},${p.y}`)
    .join(" ");
  const hintStep = hint ? HINT_TOTAL_MS / Math.max(1, hint.path.length) / 1000 : 0;

  return (
    <div className="@container w-full">
      <div
        ref={containerRef}
        role="application"
        aria-label={label}
        className="relative grid touch-none gap-[1.6cqw] rounded-[4cqw] bg-slate-900 p-[2.4cqw] select-none"
        style={{ gridTemplateColumns: `repeat(${board.cols}, minmax(0, 1fr))` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finish}
        onPointerCancel={finish}
        onContextMenu={(e) => e.preventDefault()}
      >
        {board.tiles.map((letter, i) => {
          const selIndex = selection.indexOf(i);
          const selected = selIndex >= 0;
          const highlight = highlights.get(i);
          const color = highlight ? wordColor(highlight.wordId) : null;
          const missed = miss?.path.includes(i);
          const hintIndex = hint ? hint.path.indexOf(i) : -1;
          return (
            <motion.div
              key={i}
              ref={(el) => {
                tileRefs.current[i] = el;
              }}
              data-tile={i}
              data-letter={letter}
              data-found={highlight ? highlight.wordId : undefined}
              className="relative flex aspect-square items-center justify-center rounded-[2cqw] text-[8.5cqw] leading-none font-black shadow-[inset_0_-0.8cqw_0_rgba(15,23,42,0.18)]"
              initial={false}
              animate={{
                backgroundColor: selected ? SELECT_BG : (color?.fill ?? TILE_BG),
                color: selected ? SELECT_INK : (color?.ink ?? TILE_INK),
                scale: selected && !reduceMotion ? 0.92 : 1,
                x: missed && !reduceMotion ? [0, -5, 5, -3, 3, 0] : 0,
              }}
              transition={{
                backgroundColor: {
                  duration: reduceMotion ? 0 : 0.18,
                  delay: !selected && highlight && !reduceMotion ? highlight.order * 0.045 : 0,
                },
                color: { duration: 0.12 },
                scale: { type: "spring", stiffness: 600, damping: 30 },
                x: { duration: MISS_MS / 1000 },
              }}
            >
              {letter}
              {highlight?.badge && (
                <span
                  aria-hidden="true"
                  className="absolute top-[0.6cqw] right-[0.8cqw] text-[2.6cqw] leading-none font-extrabold opacity-90"
                >
                  {highlight.wordId + 1}
                </span>
              )}
              {missed && (
                <span className="pointer-events-none absolute inset-0 rounded-[2cqw] bg-rose-500/25" />
              )}
              {hint && hintIndex >= 0 && (
                <motion.span
                  key={hint.key}
                  data-hint-tile
                  className="pointer-events-none absolute inset-0 rounded-[2cqw] ring-[1.2cqw] ring-amber-400 ring-inset"
                  style={{
                    backgroundColor: reduceMotion ? "transparent" : "rgba(251,191,36,0.75)",
                  }}
                  initial={{ opacity: reduceMotion ? 1 : 0 }}
                  animate={{ opacity: reduceMotion ? 1 : [0, 1, 1, 0] }}
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { duration: 0.42, delay: hintIndex * hintStep, times: [0, 0.2, 0.6, 1] }
                  }
                />
              )}
            </motion.div>
          );
        })}

        {selection.length > 1 && (
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 size-full overflow-visible"
          >
            <polyline
              points={linePoints}
              fill="none"
              stroke="rgba(255,255,255,0.5)"
              strokeWidth={layout.tileWidth * 0.16}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
    </div>
  );
}

import type { Board } from "@/lib/game";
import { wordColor } from "@/lib/game/colors";

interface MiniBoardProps {
  board: Board;
  /** Colour each planted word's tiles (preview / reveal). */
  showWords?: boolean;
  /** Order of word ids matching board.placements (defaults to placement index). */
  wordIdFor?(word: string): number;
  className?: string;
  /** Tailwind font-size class for letters (container-relative). */
  letterClassName?: string;
  /** Per-tile colour overrides (e.g. a selection in an illustration). */
  tileColors?: ReadonlyMap<number, { fill: string; ink: string }>;
  /** Purely visual: no img role (the parent describes it). */
  decorative?: boolean;
  /** Accessible name (defaults to an English description). */
  label?: string;
  children?: React.ReactNode;
}

/** Tile centres in % of board width (matches the cqw padding and gap below). */
export function boardGeometry(board: Pick<Board, "cols" | "rows">) {
  const pad = 2.4;
  const gap = 1.5;
  const tile = (100 - 2 * pad - (board.cols - 1) * gap) / board.cols;
  const height = 2 * pad + board.rows * tile + (board.rows - 1) * gap;
  const at = (i: number) => {
    const c = i % board.cols;
    const r = Math.floor(i / board.cols);
    return { x: pad + c * (tile + gap) + tile / 2, y: pad + r * (tile + gap) + tile / 2 };
  };
  return { at, height, tile };
}

/** Static, non-interactive board for previews and reports. */
export function MiniBoard({
  board,
  showWords,
  wordIdFor,
  className = "",
  letterClassName = "text-[8cqw]",
  tileColors,
  decorative,
  label,
  children,
}: MiniBoardProps) {
  const colorOf = new Map<number, number>();
  if (showWords) {
    board.placements.forEach((p, i) => {
      const id = wordIdFor ? wordIdFor(p.word) : i;
      for (const t of p.path) colorOf.set(t, id);
    });
  }
  return (
    <div className={`@container ${className}`}>
      <div
        className="relative grid gap-[1.5cqw] rounded-[4cqw] bg-slate-900 p-[2.4cqw]"
        style={{ gridTemplateColumns: `repeat(${board.cols}, minmax(0, 1fr))` }}
        role={decorative ? undefined : "img"}
        aria-label={
          decorative
            ? undefined
            : (label ?? `Board preview: ${board.rows} rows of ${board.cols} letters`)
        }
        data-testid={decorative ? undefined : "mini-board"}
        data-tiles={board.tiles.join("")}
      >
        {board.tiles.map((letter, i) => {
          const id = colorOf.get(i);
          const c = tileColors?.get(i) ?? (id === undefined ? null : wordColor(id));
          return (
            <div
              key={i}
              className={`flex aspect-square items-center justify-center rounded-[2cqw] leading-none font-black ${letterClassName}`}
              style={{ backgroundColor: c?.fill ?? "#ffffff", color: c?.ink ?? "#0f172a" }}
            >
              {letter}
            </div>
          );
        })}
        {children}
      </div>
    </div>
  );
}

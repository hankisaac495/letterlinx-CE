import type { Board } from "@/lib/game";
import { wordColor } from "@/lib/game/colors";

interface MiniBoardProps {
  board: Board;
  /** Colour each planted word's tiles (preview / reveal). */
  showWords?: boolean;
  /** Order of word ids matching board.placements (defaults to placement index). */
  wordIdFor?(word: string): number;
  className?: string;
}

/** Static, non-interactive board for previews and reports. */
export function MiniBoard({ board, showWords, wordIdFor, className = "" }: MiniBoardProps) {
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
        className="grid gap-[1.5cqw] rounded-[4cqw] bg-slate-900 p-[2.4cqw]"
        style={{ gridTemplateColumns: `repeat(${board.cols}, minmax(0, 1fr))` }}
        role="img"
        aria-label={`Board preview: ${board.rows} rows of ${board.cols} letters`}
        data-testid="mini-board"
        data-tiles={board.tiles.join("")}
      >
        {board.tiles.map((letter, i) => {
          const id = colorOf.get(i);
          const c = id === undefined ? null : wordColor(id);
          return (
            <div
              key={i}
              className="flex aspect-square items-center justify-center rounded-[2cqw] text-[8cqw] leading-none font-black"
              style={{ backgroundColor: c?.fill ?? "#ffffff", color: c?.ink ?? "#0f172a" }}
            >
              {letter}
            </div>
          );
        })}
      </div>
    </div>
  );
}

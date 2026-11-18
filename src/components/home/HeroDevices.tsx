import { boardGeometry, MiniBoard } from "@/components/game/MiniBoard";
import { prepareRound, SAMPLE_WORD_SETS, type Board, type TargetWord } from "@/lib/game";
import { wordColor } from "@/lib/game/colors";

/*
 * Home-page illustration: a classroom display running the projector view, with a
 * laptop and an iPad in front running the student game. Built from the real
 * board generator and colours; purely decorative (one label on the wrapper).
 */

const prepared = prepareRound(SAMPLE_WORD_SETS.science, 4242);
if (!prepared.ok) throw new Error("Hero board failed to generate");
const BOARD: Board = prepared.board;
const WORDS: TargetWord[] = prepared.words;

/** A board showing only some words as found. */
function withFound(ids: number[]): Board {
  return {
    ...BOARD,
    placements: WORDS.filter((w) => ids.includes(w.id)).map((w) => ({
      word: w.normalized,
      path: w.path,
    })),
  };
}
const idFor = (word: string) => WORDS.find((w) => w.normalized === word)?.id ?? 0;

const LEADERS = [
  ["Maya R.", 412],
  ["Kenji H.", 377],
  ["Rosa M.", 351],
  ["Dev V.", 298],
] as const;
const CLASS_FOUND = [18, 11, 9, 14, 4, 6];

function ProjectorScreen() {
  return (
    <div className="@container size-full bg-slate-950 text-white">
      <div className="flex h-[7%] items-center gap-[1.5cqw] border-b border-white/10 px-[2cqw] text-[1.6cqw] font-bold">
        <span>LetterLinx</span>
        <span className="text-white/50">Cell Biology</span>
        <span className="rounded bg-white/10 px-[0.8cqw] tracking-widest">GC6X3U</span>
      </div>
      <div className="flex h-[93%] gap-[3cqw] p-[2.4cqw]">
        <div className="aspect-[0.64] h-full">
          <MiniBoard board={BOARD} decorative letterClassName="text-[10cqw]" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-[1.6cqw]">
          <div className="flex items-end justify-between">
            <span className="text-[1.8cqw] font-bold text-white/60 uppercase">Time left</span>
            <span className="text-[6cqw] leading-none font-black tabular-nums">1:24</span>
          </div>
          <div className="grid grid-cols-2 gap-[0.8cqw]">
            {WORDS.map((w, i) => (
              <div
                key={w.id}
                className="flex items-center gap-[0.8cqw] rounded-[0.8cqw] bg-white/5 px-[1cqw] py-[0.6cqw] text-[1.7cqw] font-extrabold"
              >
                <span
                  className="size-[1.8cqw] rounded-full"
                  style={{ backgroundColor: wordColor(w.id).fill }}
                />
                <span className="flex-1 truncate">{w.display}</span>
                <span className="text-white/50">{CLASS_FOUND[i] ?? 3}/22</span>
              </div>
            ))}
          </div>
          <p className="mt-[0.6cqw] text-[1.6cqw] font-bold text-white/60 uppercase">Leaderboard</p>
          <div className="flex flex-col gap-[0.7cqw]">
            {LEADERS.map(([name, score], i) => (
              <div
                key={name}
                className={`flex items-center gap-[1.2cqw] rounded-[0.8cqw] px-[1.2cqw] py-[0.6cqw] text-[2.2cqw] font-extrabold ${
                  i === 0 ? "bg-amber-400/20" : "bg-white/5"
                }`}
              >
                <span className="w-[2cqw] text-white/50">{i + 1}</span>
                <span className="flex-1">{name}</span>
                <span className="tabular-nums">{score}</span>
              </div>
            ))}
          </div>
          <p className="mt-auto text-[1.8cqw] text-white/80">
            <strong className="text-white">Kenji H.</strong> found{" "}
            <strong className="text-amber-300">{WORDS[1].display}</strong>
          </p>
        </div>
      </div>
    </div>
  );
}

/** Student view on the laptop: full word list, three words found, a word mid-drag. */
function LaptopScreen() {
  const found = [0, 2, 3];
  const partial = WORDS[1].path.slice(0, 4);
  const selection = new Map(partial.map((t) => [t, { fill: "#5b21b6", ink: "#ffffff" }]));
  const g = boardGeometry(BOARD);
  return (
    <div className="@container size-full bg-slate-50">
      <div className="flex size-full items-stretch gap-[4cqw] p-[3cqw]">
        <div className="flex min-w-0 flex-1 flex-col gap-[2.4cqw] py-[1cqw]">
          <span className="text-[2.6cqw] font-bold text-slate-500 uppercase">Cell Biology</span>
          <div className="flex items-center justify-between">
            <span className="rounded-[1.2cqw] bg-slate-900 px-[1.6cqw] py-[0.4cqw] text-[4cqw] font-black text-white">
              1:24
            </span>
            <span className="text-right text-[2.2cqw] font-bold text-slate-500 uppercase">
              Score{" "}
              <span className="block text-[4.4cqw] leading-none font-black text-slate-900">
                270
              </span>
            </span>
          </div>
          <ul className="flex flex-col gap-[1.2cqw]">
            {WORDS.map((w) => {
              const done = found.includes(w.id);
              return (
                <li
                  key={w.id}
                  className={`flex items-center gap-[1.2cqw] rounded-[1.2cqw] px-[1.6cqw] py-[0.7cqw] text-[2.8cqw] font-extrabold ${
                    done
                      ? "bg-slate-200 text-slate-400 line-through"
                      : "bg-white text-slate-900 ring-1 ring-slate-200"
                  }`}
                >
                  <span
                    className="size-[2.4cqw] shrink-0 rounded-full"
                    style={{ backgroundColor: wordColor(w.id).fill }}
                  />
                  {w.display}
                </li>
              );
            })}
          </ul>
        </div>
        <div className="w-[36%] shrink-0 self-center">
          <MiniBoard
            board={withFound(found)}
            showWords
            wordIdFor={idFor}
            tileColors={selection}
            decorative
          >
            <svg
              className="pointer-events-none absolute inset-0 size-full"
              viewBox={`0 0 100 ${g.height}`}
              preserveAspectRatio="none"
            >
              <polyline
                points={partial.map((t) => `${g.at(t).x},${g.at(t).y}`).join(" ")}
                fill="none"
                stroke="rgba(255,255,255,0.55)"
                strokeWidth={g.tile * 0.16}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </MiniBoard>
        </div>
      </div>
    </div>
  );
}

/** Student view on the iPad: hidden-words mode with a hint button. */
function TabletScreen() {
  return (
    <div className="@container size-full bg-slate-50">
      <div className="flex size-full flex-col items-center gap-[2.5cqw] p-[5cqw]">
        <div className="flex w-full items-center justify-between">
          <span className="rounded-[2cqw] bg-slate-900 px-[2.5cqw] py-[0.6cqw] text-[6cqw] font-black text-white">
            1:24
          </span>
          <span className="text-[7cqw] font-black text-slate-900">185</span>
        </div>
        <p className="text-[6cqw] font-black text-slate-900">2 of 6 found</p>
        <div className="w-[68%]">
          <MiniBoard board={withFound([4, 5])} showWords wordIdFor={idFor} decorative />
        </div>
        <span className="mt-auto self-end rounded-full bg-amber-400 px-[4cqw] py-[1.2cqw] text-[4.6cqw] font-extrabold text-amber-950">
          Hint · 2 left
        </span>
      </div>
    </div>
  );
}

export function HeroDevices({ className = "" }: { className?: string }) {
  return (
    <div
      role="img"
      aria-label="LetterLinx running on a classroom display, a laptop and an iPad: the projector shows the board, timer and leaderboard while students find words on their own devices."
      className={`relative aspect-[640/500] w-full select-none ${className}`}
    >
      {/* Classroom display */}
      <div aria-hidden="true" className="absolute top-0 left-[6%] w-[88%]">
        <div className="rounded-[1.6%] bg-slate-800 p-[1.4%] shadow-2xl ring-1 ring-black/20">
          <div className="aspect-[16/10] overflow-hidden rounded-[0.8%]">
            <ProjectorScreen />
          </div>
        </div>
        <div className="mx-auto h-[min(5vw,2.5rem)] w-[10%] bg-gradient-to-b from-slate-700 to-slate-500" />
        <div className="mx-auto h-[0.6rem] w-[28%] rounded-t-full bg-slate-500 shadow-lg" />
      </div>

      {/* Laptop */}
      <div aria-hidden="true" className="absolute bottom-[1%] left-0 w-[50%] drop-shadow-2xl">
        <div className="mx-[7%] rounded-t-[3%] bg-slate-900 p-[2.2%] pb-[3%]">
          <div className="aspect-[16/10] overflow-hidden rounded-[1%]">
            <LaptopScreen />
          </div>
        </div>
        <div className="h-[0.55rem] rounded-b-[40%] bg-gradient-to-b from-slate-300 to-slate-400 ring-1 ring-slate-400/50" />
      </div>

      {/* iPad */}
      <div aria-hidden="true" className="absolute right-[1%] bottom-0 w-[25%] drop-shadow-2xl">
        <div className="rounded-[9%] bg-slate-900 p-[5%]">
          <div className="aspect-[3/4.2] overflow-hidden rounded-[5%]">
            <TabletScreen />
          </div>
        </div>
      </div>
    </div>
  );
}

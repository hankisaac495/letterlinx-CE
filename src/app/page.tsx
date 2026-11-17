import Link from "next/link";
import { PrototypeBanner } from "@/components/PrototypeBanner";
import { BOARD_COLS, BOARD_ROWS } from "@/lib/game/constants";

const SAMPLE = "LETTERLINXCLASSROOMEDITIONFINDWORDSTOGETHERREADYSETGOAB";

export default function Home() {
  const tiles = SAMPLE.slice(0, BOARD_COLS * BOARD_ROWS).split("");

  return (
    <>
      <PrototypeBanner />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center gap-10 px-4 py-12 md:flex-row md:justify-between">
        <section className="max-w-md text-center md:text-left">
          <p className="text-brand text-sm font-semibold tracking-widest uppercase">LetterLinx</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight md:text-5xl">
            Classroom Edition
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Enter a vocabulary list, we hide the words on a letter board, and your class races to
            find them — live on the projector.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 md:items-start">
            <Link
              href="/play"
              className="rounded-xl bg-blue-700 px-5 py-3 font-extrabold text-white shadow-sm hover:bg-blue-600 focus-visible:ring-4 focus-visible:ring-blue-200 focus-visible:outline-none"
            >
              Try a practice round
            </Link>
            <p className="text-sm text-slate-500">Coming soon: teacher sign-in and live rounds.</p>
          </div>
        </section>

        <div
          aria-hidden="true"
          className="grid gap-1.5 rounded-2xl bg-slate-900 p-3 shadow-xl"
          style={{ gridTemplateColumns: `repeat(${BOARD_COLS}, minmax(0, 1fr))` }}
        >
          {tiles.map((letter, i) => (
            <div
              key={i}
              className="bg-tile text-tile-ink flex size-9 items-center justify-center rounded-md text-lg font-extrabold sm:size-11 sm:text-xl"
            >
              {letter}
            </div>
          ))}
        </div>
      </main>
    </>
  );
}

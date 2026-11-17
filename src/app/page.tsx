import Image from "next/image";
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
          <Image
            src="/letterlinx-logo.svg"
            alt="LetterLinx"
            width={320}
            height={133}
            priority
            unoptimized
            className="mx-auto -mb-2 h-auto w-64 md:mx-0 md:-ml-5 md:w-72"
          />
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">Classroom Edition</h1>
          <p className="mt-4 text-lg text-slate-600">
            Enter a vocabulary list, we hide the words on a letter board, and your class races to
            find them — live on the projector.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 md:items-start">
            <div className="flex flex-wrap justify-center gap-3 md:justify-start">
              <Link
                href="/teacher"
                className="rounded-xl bg-blue-700 px-5 py-3 font-extrabold text-white shadow-sm hover:bg-blue-600 focus-visible:ring-4 focus-visible:ring-blue-200 focus-visible:outline-none"
              >
                Teacher dashboard
              </Link>
              <Link
                href="/play"
                className="rounded-xl bg-white px-5 py-3 font-bold text-slate-800 shadow-sm ring-1 ring-slate-300 hover:bg-slate-50 focus-visible:ring-4 focus-visible:ring-blue-200 focus-visible:outline-none"
              >
                Try a practice round
              </Link>
            </div>
            <p className="text-sm text-slate-500">Coming soon: class rosters and live rounds.</p>
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

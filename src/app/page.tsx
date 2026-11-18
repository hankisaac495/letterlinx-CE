import Image from "next/image";
import Link from "next/link";
import { LoginButtons } from "@/components/auth/LoginButtons";
import { PrototypeBanner } from "@/components/PrototypeBanner";
import { HeroDevices } from "@/components/home/HeroDevices";

export default function Home() {
  return (
    <>
      <PrototypeBanner />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center gap-10 px-4 py-12 md:flex-row md:justify-between">
        <section className="max-w-md text-center md:text-left">
          <Image
            src="/letterlinx-header-logo.svg"
            alt="LetterLinx"
            width={564}
            height={128}
            priority
            unoptimized
            className="mx-auto mb-4 h-auto w-64 md:mx-0 md:w-80"
          />
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">Classroom Edition</h1>
          <p className="mt-4 text-lg text-slate-600">
            Enter a vocabulary list, we hide the words on a letter board, and your class races to
            find them — live on the projector.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 md:items-start">
            <LoginButtons />
            <Link
              href="/play"
              className="text-sm font-semibold text-blue-700 hover:underline focus-visible:ring-4 focus-visible:ring-blue-200 focus-visible:outline-none"
            >
              Or try a practice round without signing in
            </Link>
            <p className="text-sm text-slate-500">
              Students:{" "}
              <Link href="/join" className="font-semibold text-blue-700 hover:underline">
                join a round
              </Link>{" "}
              with the code on the projector.
            </p>
          </div>
        </section>

        <HeroDevices className="max-w-2xl md:w-[58%] md:shrink-0" />
      </main>
    </>
  );
}

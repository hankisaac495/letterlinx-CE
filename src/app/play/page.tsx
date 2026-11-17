import type { Metadata } from "next";
import { PrototypeBanner } from "@/components/PrototypeBanner";
import { Suspense } from "react";
import { PlayDemoFromQuery } from "@/components/game/PlayDemo";

export const metadata: Metadata = { title: "Practice round · LetterLinx Classroom Edition" };

export default function PlayPage() {
  return (
    <>
      <PrototypeBanner />
      <main className="flex flex-1 flex-col">
        <Suspense fallback={<p className="p-6 text-slate-500">Loading…</p>}>
          <PlayDemoFromQuery />
        </Suspense>
      </main>
    </>
  );
}

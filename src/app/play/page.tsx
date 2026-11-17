import type { Metadata } from "next";
import { PrototypeBanner } from "@/components/PrototypeBanner";
import { PlayDemo } from "@/components/game/PlayDemo";

export const metadata: Metadata = { title: "Practice round · LetterLinx Classroom Edition" };

export default function PlayPage() {
  return (
    <>
      <PrototypeBanner />
      <main className="flex flex-1 flex-col">
        <PlayDemo />
      </main>
    </>
  );
}

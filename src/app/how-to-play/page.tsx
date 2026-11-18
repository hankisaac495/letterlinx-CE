import type { Metadata } from "next";
import { PrototypeBanner } from "@/components/PrototypeBanner";
import { HowToPlay } from "@/components/info/HowToPlay";

export const metadata: Metadata = { title: "How to play · LetterLinx Classroom Edition" };

export default function Page() {
  return (
    <>
      <PrototypeBanner />
      <main className="flex flex-1 flex-col">
        <HowToPlay />
      </main>
    </>
  );
}

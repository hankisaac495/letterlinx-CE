import type { Metadata } from "next";
import { PrototypeBanner } from "@/components/PrototypeBanner";
import { About } from "@/components/info/About";

export const metadata: Metadata = { title: "About · LetterLinx Classroom Edition" };

export default function Page() {
  return (
    <>
      <PrototypeBanner />
      <main className="flex flex-1 flex-col">
        <About />
      </main>
    </>
  );
}

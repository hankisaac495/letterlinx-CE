import type { Metadata } from "next";
import { PrototypeBanner } from "@/components/PrototypeBanner";
import { Faq } from "@/components/info/Faq";

export const metadata: Metadata = { title: "FAQ · LetterLinx Classroom Edition" };

export default function Page() {
  return (
    <>
      <PrototypeBanner />
      <main className="flex flex-1 flex-col">
        <Faq />
      </main>
    </>
  );
}

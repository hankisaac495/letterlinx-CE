import type { Metadata } from "next";
import { PrototypeBanner } from "@/components/PrototypeBanner";
import { Contact } from "@/components/info/Contact";

export const metadata: Metadata = { title: "Contact us · LetterLinx Classroom Edition" };

export default function Page() {
  return (
    <>
      <PrototypeBanner />
      <main className="flex flex-1 flex-col">
        <Contact />
      </main>
    </>
  );
}

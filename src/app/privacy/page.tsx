import type { Metadata } from "next";
import { PrototypeBanner } from "@/components/PrototypeBanner";
import { Privacy } from "@/components/info/Privacy";

export const metadata: Metadata = { title: "Privacy policy · LetterLinx Classroom Edition" };

export default function Page() {
  return (
    <>
      <PrototypeBanner />
      <main className="flex flex-1 flex-col">
        <Privacy />
      </main>
    </>
  );
}

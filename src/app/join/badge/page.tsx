import type { Metadata } from "next";
import { PrototypeBanner } from "@/components/PrototypeBanner";
import { BadgeLogin } from "@/components/student/BadgeLogin";

export const metadata: Metadata = {
  title: "Clever badge (simulated) · LetterLinx Classroom Edition",
};

export default function BadgePage() {
  return (
    <>
      <PrototypeBanner />
      <main className="flex flex-1 flex-col px-4">
        <BadgeLogin />
      </main>
    </>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { PrototypeBanner } from "@/components/PrototypeBanner";
import { BadgeLogin } from "@/components/student/BadgeLogin";

export const metadata: Metadata = {
  title: "Badge sign-in (simulated) · LetterLinx Classroom Edition",
};

export default function BadgePage() {
  return (
    <>
      <PrototypeBanner />
      <main className="flex flex-1 flex-col px-4">
        <Suspense fallback={<p className="p-6 text-slate-500">…</p>}>
          <BadgeLogin />
        </Suspense>
      </main>
    </>
  );
}

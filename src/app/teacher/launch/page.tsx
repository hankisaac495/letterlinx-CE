import type { Metadata } from "next";
import { Suspense } from "react";
import { LaunchRound } from "@/components/teacher/LaunchRound";

export const metadata: Metadata = { title: "Launch round · LetterLinx Classroom Edition" };

export default function LaunchPage() {
  return (
    <Suspense fallback={<p className="p-6 text-slate-500">Loading…</p>}>
      <LaunchRound />
    </Suspense>
  );
}

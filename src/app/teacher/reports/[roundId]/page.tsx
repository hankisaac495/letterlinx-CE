import type { Metadata } from "next";
import { Suspense } from "react";
import { RoundReport } from "@/components/reports/RoundReport";

export const metadata: Metadata = { title: "Round report · LetterLinx Classroom Edition" };

export default function RoundReportPage() {
  return (
    <Suspense fallback={<p className="p-6 text-slate-500">Loading…</p>}>
      <RoundReport />
    </Suspense>
  );
}

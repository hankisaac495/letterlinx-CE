import type { Metadata } from "next";
import { Suspense } from "react";
import { ReportsOverview } from "@/components/reports/ReportsOverview";

export const metadata: Metadata = { title: "Reports · LetterLinx Classroom Edition" };

export default function ReportsPage() {
  return (
    <Suspense fallback={<p className="p-6 text-slate-500">Loading…</p>}>
      <ReportsOverview />
    </Suspense>
  );
}

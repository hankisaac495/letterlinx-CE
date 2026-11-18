import type { Metadata } from "next";
import { Suspense } from "react";
import { PrototypeBanner } from "@/components/PrototypeBanner";
import { StudentJoin } from "@/components/student/StudentJoin";

export const metadata: Metadata = { title: "Join · LetterLinx Classroom Edition" };

export default function JoinPage() {
  return (
    <>
      <PrototypeBanner />
      <main className="flex flex-1 flex-col">
        <Suspense fallback={<p className="p-6 text-slate-500">Loading…</p>}>
          <StudentJoin />
        </Suspense>
      </main>
    </>
  );
}

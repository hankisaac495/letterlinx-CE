import type { Metadata } from "next";
import { Suspense } from "react";
import { EditWordSet } from "@/components/teacher/EditWordSet";

export const metadata: Metadata = { title: "Edit word set · LetterLinx Classroom Edition" };

export default function EditWordSetPage() {
  return (
    <Suspense fallback={<p className="p-6 text-slate-500">Loading…</p>}>
      <EditWordSet />
    </Suspense>
  );
}

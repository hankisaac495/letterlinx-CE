import type { Metadata } from "next";
import { Suspense } from "react";
import { ClassEditor } from "@/components/teacher/ClassEditor";

export const metadata: Metadata = { title: "New class · LetterLinx Classroom Edition" };

export default function NewClassPage() {
  return (
    <Suspense fallback={<p className="p-6 text-slate-500">…</p>}>
      <ClassEditor isNew />
    </Suspense>
  );
}

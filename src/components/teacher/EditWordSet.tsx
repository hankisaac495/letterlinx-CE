"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { btn } from "@/components/ui/styles";
import { useWordSetsReady, useWordSetStore } from "@/store/wordSetStore";
import { WordSetEditor } from "./WordSetEditor";

export function EditWordSet() {
  const { id } = useParams<{ id: string }>();
  const ready = useWordSetsReady();
  const wordSet = useWordSetStore((s) => s.wordSets.find((w) => w.id === id));
  if (!ready) return <p className="p-6 text-slate-500">Loading…</p>;
  if (!wordSet) {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <h1 className="text-2xl font-black">Word set not found</h1>
        <p className="mt-2 text-slate-600">
          It may have been deleted, or saved in a different browser.
        </p>
        <Link href="/teacher" className={`${btn.primary} mt-5`}>
          Back to dashboard
        </Link>
      </div>
    );
  }
  return <WordSetEditor key={wordSet.id} existing={wordSet} />;
}

"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { btn } from "@/components/ui/styles";
import { useT } from "@/lib/i18n";
import { useWordSetsReady, useWordSetStore } from "@/store/wordSetStore";
import { WordSetEditor } from "./WordSetEditor";

export function EditWordSet() {
  const { id } = useParams<{ id: string }>();
  const t = useT();
  const ready = useWordSetsReady();
  const wordSet = useWordSetStore((s) => s.wordSets.find((w) => w.id === id));
  if (!ready) return <p className="p-6 text-slate-500">{t("common.loading")}</p>;
  if (!wordSet) {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <h1 className="text-2xl font-black">{t("edit.notFound")}</h1>
        <p className="mt-2 text-slate-600">{t("edit.notFoundBody")}</p>
        <Link href="/teacher" className={`${btn.primary} mt-5`}>
          {t("edit.backDashboard")}
        </Link>
      </div>
    );
  }
  return <WordSetEditor key={wordSet.id} existing={wordSet} />;
}

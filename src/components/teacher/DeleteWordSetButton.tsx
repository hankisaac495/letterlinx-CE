"use client";

import { useRef } from "react";
import { btn } from "@/components/ui/styles";
import { useT } from "@/lib/i18n";
import { useWordSetStore, type WordSet } from "@/store/wordSetStore";

/** Delete with a native modal confirmation (keyboard and screen-reader friendly). */
export function DeleteWordSetButton({
  wordSet,
  onDeleted,
  compact,
}: {
  wordSet: WordSet;
  onDeleted?(): void;
  compact?: boolean;
}) {
  const t = useT();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const remove = useWordSetStore((s) => s.remove);
  return (
    <>
      <button
        type="button"
        className={
          compact ? `${btn.ghost} text-rose-700 hover:bg-rose-50` : `${btn.secondary} text-rose-700`
        }
        onClick={() => dialogRef.current?.showModal()}
        aria-label={compact ? t("delete.aria", { title: wordSet.title }) : undefined}
      >
        {t("delete.button")}
      </button>
      <dialog
        ref={dialogRef}
        className="m-auto w-[min(92vw,26rem)] rounded-2xl p-6 shadow-2xl backdrop:bg-slate-900/50"
        aria-labelledby={`del-${wordSet.id}`}
      >
        <h2 id={`del-${wordSet.id}`} className="text-lg font-black">
          {t("delete.title", { title: wordSet.title })}
        </h2>
        <p className="mt-2 text-sm text-slate-600">{t("delete.body")}</p>
        <form method="dialog" className="mt-5 flex justify-end gap-2">
          <button className={btn.secondary} autoFocus>
            {t("common.cancel")}
          </button>
          <button
            type="button"
            className={btn.danger}
            onClick={() => {
              dialogRef.current?.close();
              remove(wordSet.id);
              onDeleted?.();
            }}
          >
            {t("delete.button")}
          </button>
        </form>
      </dialog>
    </>
  );
}

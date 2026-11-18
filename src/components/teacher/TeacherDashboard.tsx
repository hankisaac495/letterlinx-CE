"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { WordDisplayMode } from "@/lib/game";
import { btn, card } from "@/components/ui/styles";
import { useT, type MessageKey, type Translate } from "@/lib/i18n";
import { useHostReady, useHostStore } from "@/store/hostStore";
import { useWordSetsReady, useWordSetStore, type WordSet } from "@/store/wordSetStore";
import { ClassesSection } from "./ClassesSection";
import { DeleteWordSetButton } from "./DeleteWordSetButton";

const MODE_LABEL: Record<WordDisplayMode, MessageKey> = {
  list: "mode.list",
  oneAtATime: "mode.oneAtATime",
  hidden: "mode.hidden",
};

function describeDisplay(ws: WordSet, t: Translate): string {
  const parts = [t(MODE_LABEL[ws.display.mode])];
  if (ws.display.showClues && ws.display.mode !== "hidden") parts.push(t("mode.clues"));
  if (ws.display.allowHints && ws.display.mode === "hidden") parts.push(t("mode.hints"));
  return parts.join(" · ");
}

function WordSetCard({ ws }: { ws: WordSet }) {
  const t = useT();
  const router = useRouter();
  const duplicate = useWordSetStore((s) => s.duplicate);
  const letters = ws.words.reduce((n, w) => n + [...w.text].length, 0);
  return (
    <li className={`${card} flex flex-col gap-3 p-4`} data-testid="word-set-card">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg leading-tight font-black">{ws.title}</h3>
        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
          {ws.language === "es" ? "Español" : "English"}
        </span>
      </div>
      <p className="flex flex-wrap gap-1.5">
        {ws.words.map((w) => (
          <span
            key={w.text}
            className="rounded-md bg-slate-50 px-1.5 py-0.5 text-xs font-extrabold tracking-wide text-slate-700 ring-1 ring-slate-200"
          >
            {w.text}
          </span>
        ))}
      </p>
      <p className="text-sm text-slate-500">
        {t("dash.cardMeta", { words: ws.words.length, letters, display: describeDisplay(ws, t) })}
      </p>
      <div className="mt-auto flex flex-wrap items-center gap-1 border-t border-slate-100 pt-3">
        <Link
          href={`/teacher/launch?set=${ws.id}`}
          className="mr-1 inline-flex items-center rounded-lg bg-blue-700 px-3 py-1.5 text-sm font-extrabold text-white hover:bg-blue-600 focus-visible:ring-4 focus-visible:ring-blue-200 focus-visible:outline-none"
        >
          {t("dash.launch")}
        </Link>
        <Link href={`/teacher/word-sets/${ws.id}`} className={btn.ghost}>
          {t("dash.edit")}
        </Link>
        <Link href={`/play?set=${ws.id}`} className={btn.ghost}>
          {t("dash.practice")}
        </Link>
        <button
          type="button"
          className={btn.ghost}
          onClick={() => {
            const id = duplicate(ws.id);
            if (id) router.push(`/teacher/word-sets/${id}`);
          }}
        >
          {t("dash.duplicate")}
        </button>
        <span className="ml-auto">
          <DeleteWordSetButton wordSet={ws} compact />
        </span>
      </div>
    </li>
  );
}

export function TeacherDashboard() {
  const t = useT();
  const ready = useWordSetsReady();
  const wordSets = useWordSetStore((s) => s.wordSets);
  const hostReady = useHostReady();
  const openRoom = useHostStore((s) => s.room);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">{t("dash.title")}</h1>
        <p className="mt-1 text-slate-600">{t("dash.lead")}</p>
      </div>

      {hostReady && openRoom && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-emerald-50 px-5 py-4 ring-1 ring-emerald-200">
          <p className="text-emerald-900">
            {t("dash.liveRound", {
              code: openRoom.code,
              title: openRoom.round.title,
              count: openRoom.players.length,
            })}
          </p>
          <Link href={`/projector/${openRoom.code}`} className={btn.primary}>
            {t("dash.openProjector")}
          </Link>
        </div>
      )}

      <ClassesSection />

      <section aria-labelledby="sets-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="sets-heading" className="text-xl font-black">
            {t("dash.wordSets")}
          </h2>
          <Link href="/teacher/word-sets/new" className={btn.primary}>
            {t("dash.newSet")}
          </Link>
        </div>
        {!ready ? (
          <p className="mt-3 text-slate-500">{t("common.loading")}</p>
        ) : wordSets.length === 0 ? (
          <div className={`${card} mt-3 p-8 text-center`}>
            <p className="font-bold">{t("dash.empty")}</p>
            <p className="mt-1 text-slate-500">{t("dash.emptyHelp")}</p>
          </div>
        ) : (
          <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {wordSets.map((ws) => (
              <WordSetCard key={ws.id} ws={ws} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

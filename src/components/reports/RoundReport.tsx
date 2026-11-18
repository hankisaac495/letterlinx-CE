"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { MiniBoard } from "@/components/game/MiniBoard";
import { btn, card } from "@/components/ui/styles";
import { wordColor } from "@/lib/game/colors";
import {
  csvFileName,
  regenerateBoard,
  roundSummary,
  studentRows,
  studentsCsv,
  wordRows,
  wordsCsv,
} from "@/lib/reports";
import { downloadText } from "@/lib/util/download";
import { useReportsReady, useReportStore } from "@/store/reportStore";
import { useLocale, useT, type MessageKey } from "@/lib/i18n";
import { formatDate, MODE_LABEL, pct, secs } from "./format";

function Stat({
  label,
  value,
  testId,
}: {
  label: string;
  value: string | number;
  testId?: string;
}) {
  return (
    <div className={`${card} p-4`}>
      <dt className="text-xs font-semibold text-slate-500 uppercase">{label}</dt>
      <dd className="mt-1 text-3xl font-black tabular-nums" data-testid={testId}>
        {value}
      </dd>
    </div>
  );
}

function WordBadge({ id }: { id: number }) {
  const c = wordColor(id);
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold"
      style={{ backgroundColor: c.fill, color: c.ink }}
    >
      {id + 1}
    </span>
  );
}

export function RoundReport() {
  const t = useT();
  const locale = useLocale();
  const { roundId } = useParams<{ roundId: string }>();
  const ready = useReportsReady();
  const result = useReportStore((s) => s.results.find((r) => r.id === roundId));
  const board = useMemo(() => (result ? regenerateBoard(result) : null), [result]);

  if (!ready) return <p className="p-6 text-slate-500">{t("common.loading")}</p>;
  if (!result) {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <h1 className="text-2xl font-black">{t("rep.notFound")}</h1>
        <p className="mt-2 text-slate-600">{t("rep.notFoundBody")}</p>
        <Link href="/teacher/reports" className={`${btn.primary} mt-5`}>
          {t("rep.all")}
        </Link>
      </div>
    );
  }

  const summary = roundSummary(result);
  const students = studentRows(result);
  const words = wordRows(result);
  const review = words.filter((w) => w.review);
  const section = result.className
    ? { name: result.className, period: result.classPeriod ?? "" }
    : undefined;
  const hints = result.settings.display.mode === "hidden" && result.settings.display.allowHints;
  const { display, duration, teamMode } = result.settings;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href={`/teacher/reports${result.sectionId ? `?section=${result.sectionId}` : "?section=none"}`}
            className="text-sm font-semibold text-blue-700 hover:underline"
          >
            {t("rep.back")}
          </Link>
          <h1 className="mt-1 text-3xl font-black tracking-tight">
            {result.title}
            {result.sample && (
              <span className="ml-3 rounded-md bg-slate-200 px-2 py-0.5 align-middle text-sm font-bold text-slate-600">
                {t("rep.sample")}
              </span>
            )}
          </h1>
          <p className="mt-1 text-slate-600">
            {formatDate(result.startedAt, true, locale)} ·{" "}
            {section
              ? t("rep.sectionPeriod", { name: section.name, period: section.period })
              : t("rep.noClass")}{" "}
            · {t(MODE_LABEL[display.mode])}
            {display.showClues ? t("rep.withClues") : ""} ·{" "}
            {duration === "untimed" ? t("common.untimed") : t("rep.timer", { n: duration })} ·{" "}
            {t("rep.played", { time: secs(result.playedMs) })}
            {teamMode ? t("rep.teams", { count: result.settings.teamCount }) : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={btn.secondary}
            onClick={() => downloadText(csvFileName(result, "students"), studentsCsv(result))}
          >
            {t("rep.exportStudents")}
          </button>
          <button
            type="button"
            className={btn.secondary}
            onClick={() => downloadText(csvFileName(result, "words"), wordsCsv(result))}
          >
            {t("rep.exportWords")}
          </button>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label={t("rep.students")} value={summary.players} testId="stat-students" />
        <Stat label={t("rep.avgScoreLong")} value={summary.avgScore} />
        <Stat label={t("rep.wordsFound")} value={pct(summary.wordsFoundShare)} />
        <Stat label={t("rep.foundEvery")} value={pct(summary.completionShare)} />
        {hints && <Stat label={t("rep.hintsUsed")} value={summary.hintsUsed} />}
      </dl>

      {review.length > 0 && (
        <div
          className="rounded-2xl bg-amber-50 px-5 py-4 ring-1 ring-amber-200"
          data-testid="review-callout"
        >
          <p className="font-bold text-amber-900">{t("rep.review")}</p>
          <p className="mt-1 text-amber-900">
            {review
              .map((w) => t("rep.reviewItem", { word: w.word, pct: pct(w.share) }))
              .join(" · ")}
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <section className={`${card} p-5`} aria-labelledby="words-heading">
          <h2 id="words-heading" className="text-xl font-black">
            {t("rep.byWord")}
          </h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm" data-testid="words-table">
              <thead className="border-b border-slate-200 text-xs text-slate-500 uppercase">
                <tr>
                  <th scope="col" className="py-2 pr-3 font-semibold">
                    {t("rep.word")}
                  </th>
                  <th scope="col" className="py-2 pr-3 font-semibold">
                    {t("rep.foundByClass")}
                  </th>
                  <th scope="col" className="py-2 pr-3 text-right font-semibold">
                    {t("rep.avgTime")}
                  </th>
                  {hints && (
                    <th scope="col" className="py-2 pr-3 text-right font-semibold">
                      {t("rep.hints")}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {words.map((w) => (
                  <tr
                    key={w.id}
                    className={`border-b border-slate-100 ${w.review ? "bg-amber-50" : ""}`}
                  >
                    <td className="py-2 pr-3">
                      <span className="flex items-center gap-2 font-extrabold">
                        <WordBadge id={w.id} />
                        {w.word}
                        {w.review && (
                          <span className="rounded bg-amber-200 px-1.5 py-0.5 text-[11px] font-bold text-amber-900">
                            {t("rep.reviewTag")}
                          </span>
                        )}
                      </span>
                      {w.clue && (
                        <span className="mt-0.5 block text-xs text-slate-500">{w.clue}</span>
                      )}
                    </td>
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-28 overflow-hidden rounded-full bg-slate-200"
                          aria-hidden="true"
                        >
                          <div
                            className="h-full rounded-full bg-blue-600"
                            style={{ width: pct(w.share) }}
                          />
                        </div>
                        <span className="tabular-nums">
                          {pct(w.share)}{" "}
                          <span className="text-slate-500">
                            ({w.foundBy}/{w.players})
                          </span>
                        </span>
                      </div>
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">{secs(w.avgMs)}</td>
                    {hints && <td className="py-2 pr-3 text-right tabular-nums">{w.hints}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className={`${card} flex h-fit flex-col gap-2 p-5`} aria-labelledby="board-heading">
          <h2 id="board-heading" className="text-lg font-black">
            {t("rep.board")}
          </h2>
          {board ? (
            <>
              <MiniBoard
                label={t("board.preview", { rows: 9, cols: 6 })}
                board={board}
                showWords
                wordIdFor={(word) => result.words.find((w) => w.normalized === word)?.id ?? 0}
              />
              <p className="text-xs text-slate-500">{t("rep.rebuilt", { seed: result.seed })}</p>
            </>
          ) : (
            <p className="text-sm text-slate-500">{t("rep.cantRebuild")}</p>
          )}
        </aside>
      </div>

      <section className={`${card} p-5`} aria-labelledby="students-heading">
        <h2 id="students-heading" className="text-xl font-black">
          {t("rep.byStudent")}
        </h2>
        <div className="mt-3 overflow-x-auto">
          <table
            className="w-full text-left text-sm whitespace-nowrap"
            data-testid="students-table"
          >
            <thead className="border-b border-slate-200 text-xs text-slate-500 uppercase">
              <tr>
                <th scope="col" className="py-2 pr-3 font-semibold">
                  #
                </th>
                <th scope="col" className="py-2 pr-3 font-semibold">
                  {t("rep.student")}
                </th>
                {teamMode && (
                  <th scope="col" className="py-2 pr-3 font-semibold">
                    {t("rep.team")}
                  </th>
                )}
                <th scope="col" className="py-2 pr-3 text-right font-semibold">
                  {t("rep.score")}
                </th>
                <th scope="col" className="py-2 pr-3 text-right font-semibold">
                  {t("rep.found")}
                </th>
                <th scope="col" className="py-2 pr-3 font-semibold">
                  {t("rep.completed")}
                </th>
                {hints && (
                  <th scope="col" className="py-2 pr-3 font-semibold">
                    {t("rep.hints")}
                  </th>
                )}
                {result.words.map((w) => (
                  <th key={w.id} scope="col" className="py-2 pr-3 text-right font-semibold">
                    <span className="inline-flex items-center gap-1">
                      <WordBadge id={w.id} />
                      {w.display}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-b border-slate-100">
                  <td className="py-2 pr-3 text-slate-500 tabular-nums">{s.rank}</td>
                  <td className="py-2 pr-3 font-semibold">
                    {s.name}
                    {s.isBot && (
                      <span
                        className="ml-1.5 rounded bg-slate-100 px-1 text-[11px] font-bold text-slate-500"
                        title={t("rep.simStudent")}
                      >
                        sim
                      </span>
                    )}
                  </td>
                  {teamMode && (
                    <td className="py-2 pr-3">
                      {s.team !== null ? t(`team.${s.team}` as MessageKey) : "—"}
                    </td>
                  )}
                  <td className="py-2 pr-3 text-right font-bold tabular-nums">{s.score}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">
                    {s.found}/{s.total}
                  </td>
                  <td className="py-2 pr-3">
                    {s.completed ? t("rep.yesTime", { time: secs(s.finishedMs) }) : t("rep.no")}
                  </td>
                  {hints && (
                    <td className="py-2 pr-3">
                      {s.hintsUsed === 0 ? "—" : `${s.hintsUsed} · ${s.hintedWords.join(", ")}`}
                    </td>
                  )}
                  {s.wordTimes.map((time, i) => (
                    <td
                      key={i}
                      className={`py-2 pr-3 text-right tabular-nums ${time === null ? "text-slate-300" : ""}`}
                    >
                      {secs(time)}
                      {s.halfPointWords.includes(result.words[i].id) && (
                        <span className="ml-0.5 text-amber-600" title={t("rep.halfAfterHint")}>
                          ½
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-500">{t("rep.timesNote")}</p>
      </section>
    </div>
  );
}

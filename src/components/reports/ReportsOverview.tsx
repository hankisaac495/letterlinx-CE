"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { btn, card, select } from "@/components/ui/styles";
import { useNow } from "@/hooks/useNow";
import { useSections } from "@/hooks/useRoster";
import { useTeacher } from "@/hooks/useTeacher";
import { roundSummary, sampleHistory, sectionHistory } from "@/lib/reports";
import { studentDisplayName } from "@/lib/roster";
import { useReportsReady, useReportStore } from "@/store/reportStore";
import { useWordSetStore, useWordSetsReady } from "@/store/wordSetStore";
import { formatDate, MODE_LABEL, pct } from "./format";
import { useLocale, useT } from "@/lib/i18n";
import { RoundsChart } from "./RoundsChart";

const NO_CLASS = "none";

export function ReportsOverview() {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const { teacher, roster } = useTeacher();
  const reportsReady = useReportsReady();
  const setsReady = useWordSetsReady();
  const results = useReportStore((s) => s.results);
  const addMany = useReportStore((s) => s.addMany);
  const clearSamples = useReportStore((s) => s.clearSamples);
  const wordSets = useWordSetStore((s) => s.wordSets);
  const { data: sections } = useSections();
  const now = useNow(false);

  if (!reportsReady || !setsReady || !sections || !teacher)
    return <p className="p-6 text-slate-500">{t("common.loading")}</p>;

  const mine = results.filter(
    (r) => r.teacherId === teacher.id || sections.some((s) => s.id === r.sectionId),
  );
  const hasUnassigned = mine.some((r) => r.sectionId === null);
  const selectedParam = params.get("section");
  const selected =
    selectedParam === NO_CLASS
      ? null
      : (sections.find((s) => s.id === selectedParam) ?? sections[0]);
  const sectionId = selectedParam === NO_CLASS ? null : (selected?.id ?? null);
  const rounds = sectionHistory(mine, sectionId);
  const hasSamples = rounds.some((r) => r.sample);

  const addSamples = async () => {
    if (!selected || !roster) return;
    const students = (await roster.getStudents(selected.id)).map((s) => ({
      id: s.id,
      name: studentDisplayName(s),
    }));
    if (students.length === 0) return;
    addMany(
      sampleHistory({
        sectionId: selected.id,
        teacherId: teacher.id,
        students,
        wordSets: wordSets.length ? wordSets : [],
        rounds: 6,
        now,
        seed: selected.id.charCodeAt(0) * 31 + selected.id.charCodeAt(1),
      }).map((r) => ({ ...r, className: selected.name, classPeriod: selected.period })),
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">{t("rep.title")}</h1>
          <p className="mt-1 text-slate-600">{t("rep.lead")}</p>
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-bold">{t("launch.class")}</span>
          <select
            aria-label={t("launch.class")}
            className={`${select} py-2`}
            value={sectionId ?? NO_CLASS}
            onChange={(e) => router.replace(`/teacher/reports?section=${e.target.value}`)}
          >
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · Period {s.period}
              </option>
            ))}
            {hasUnassigned && <option value={NO_CLASS}>{t("rep.noClass")}</option>}
          </select>
        </label>
      </div>

      <section className={`${card} flex flex-col gap-5 p-5`} aria-labelledby="history-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="history-heading" className="text-xl font-black">
            {selected
              ? t("rep.sectionTitle", { name: selected.name, period: selected.period })
              : t("rep.withoutClass")}
            <span
              className="ml-2 text-base font-semibold text-slate-500"
              data-testid="rounds-count"
            >
              {rounds.length === 1
                ? t("rep.roundPlayed")
                : t("rep.roundsPlayed", { count: rounds.length })}
            </span>
          </h2>
          {selected &&
            (hasSamples ? (
              <button type="button" className={btn.ghost} onClick={() => clearSamples(selected.id)}>
                {t("rep.removeSamples")}
              </button>
            ) : (
              <button
                type="button"
                className={btn.secondary}
                onClick={() => void addSamples()}
                disabled={!wordSets.length}
              >
                {t("rep.addSamples")}
              </button>
            ))}
        </div>

        {rounds.length === 0 ? (
          <p className="rounded-xl bg-slate-50 p-6 text-center text-slate-600">
            {t("rep.noRounds")}{" "}
            {selected && (
              <Link
                href={`/teacher/launch?section=${selected.id}`}
                className="font-semibold text-blue-700 hover:underline"
              >
                {t("rep.launchOne")}
              </Link>
            )}
            {selected && t("rep.orSamples")}
          </p>
        ) : (
          <>
            <RoundsChart rounds={rounds} />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm" data-testid="rounds-table">
                <caption className="sr-only">{t("rep.roundsCaption")}</caption>
                <thead className="border-b border-slate-200 text-xs text-slate-500 uppercase">
                  <tr>
                    <th scope="col" className="py-2 pr-3 font-semibold">
                      {t("rep.date")}
                    </th>
                    <th scope="col" className="py-2 pr-3 font-semibold">
                      {t("rep.wordSet")}
                    </th>
                    <th scope="col" className="py-2 pr-3 font-semibold">
                      {t("rep.display")}
                    </th>
                    <th scope="col" className="py-2 pr-3 text-right font-semibold">
                      {t("rep.students")}
                    </th>
                    <th scope="col" className="py-2 pr-3 text-right font-semibold">
                      {t("rep.wordsFound")}
                    </th>
                    <th scope="col" className="py-2 pr-3 text-right font-semibold">
                      {t("rep.completed")}
                    </th>
                    <th scope="col" className="py-2 pr-3 text-right font-semibold">
                      {t("rep.avgScore")}
                    </th>
                    <th scope="col" className="py-2 font-semibold">
                      <span className="sr-only">{t("rep.report")}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...rounds].reverse().map((r) => {
                    const s = roundSummary(r);
                    return (
                      <tr key={r.id} className="border-b border-slate-100">
                        <td className="py-2 pr-3 whitespace-nowrap">
                          {formatDate(r.startedAt, true, locale)}
                        </td>
                        <td className="py-2 pr-3 font-semibold">
                          {r.title}
                          {r.sample && (
                            <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-bold text-slate-500">
                              {t("rep.sample")}
                            </span>
                          )}
                        </td>
                        <td className="py-2 pr-3 text-slate-600">
                          {t(MODE_LABEL[r.settings.display.mode])}
                        </td>
                        <td className="py-2 pr-3 text-right tabular-nums">{s.players}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">
                          {pct(s.wordsFoundShare)}
                        </td>
                        <td className="py-2 pr-3 text-right tabular-nums">
                          {pct(s.completionShare)}
                        </td>
                        <td className="py-2 pr-3 text-right tabular-nums">{s.avgScore}</td>
                        <td className="py-2 text-right">
                          <Link
                            href={`/teacher/reports/${r.id}`}
                            className="font-semibold text-blue-700 hover:underline"
                          >
                            {t("rep.view")}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

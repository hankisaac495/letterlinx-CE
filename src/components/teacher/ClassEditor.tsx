"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { btn, card, input } from "@/components/ui/styles";
import { useTeacher } from "@/hooks/useTeacher";
import { useT } from "@/lib/i18n";
import {
  MAX_CLASS_SIZE,
  manualStudentName,
  parseStudentNames,
  type ManualClass,
} from "@/lib/roster";
import {
  useManualRostersReady,
  useManualRosterStore,
  type ClassDraft,
} from "@/store/manualRosterStore";

type Row = ClassDraft["students"][number] & { key: string };

let rowKey = 0;
const toRow = (s: ClassDraft["students"][number]): Row => ({ ...s, key: `r${++rowKey}` });

function Editor({ existing, ownerId }: { existing?: ManualClass; ownerId: string }) {
  const t = useT();
  const router = useRouter();
  const save = useManualRosterStore((s) => s.save);
  const remove = useManualRosterStore((s) => s.remove);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState(existing?.name ?? "");
  const [period, setPeriod] = useState(existing?.period ?? "");
  const [grade, setGrade] = useState(existing?.grade ?? "");
  const [subject, setSubject] = useState(existing?.subject ?? "");
  const [rows, setRows] = useState<Row[]>(() => (existing?.students ?? []).map(toRow));
  const [paste, setPaste] = useState("");
  const [skipped, setSkipped] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const names = rows.map((r) => manualStudentName(r).toLocaleLowerCase());
  const duplicates = new Set(names.filter((n, i) => n.trim() && names.indexOf(n) !== i));
  const errors = {
    name: !name.trim() ? t("classEd.nameRequired") : null,
    students: rows.length === 0 ? t("classEd.studentsRequired") : null,
    blank: rows.some((r) => !r.first.trim()) ? t("classEd.blankStudent") : null,
    tooMany: rows.length > MAX_CLASS_SIZE ? t("classEd.tooMany", { max: MAX_CLASS_SIZE }) : null,
  };
  const valid = !Object.values(errors).some(Boolean);

  const addPasted = () => {
    const parsed = parseStudentNames(paste);
    setRows((r) => [...r, ...parsed.students.map(toRow)].slice(0, MAX_CLASS_SIZE));
    setSkipped(parsed.invalid);
    setPaste("");
  };

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!valid) return;
    save(
      ownerId,
      {
        name,
        period,
        grade,
        subject,
        students: rows.map(({ id, first, lastInitial }) => ({ id, first, lastInitial })),
      },
      existing?.id,
    );
    router.push("/teacher");
  };

  return (
    <form
      onSubmit={onSave}
      noValidate
      className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/teacher" className="text-sm font-semibold text-blue-700 hover:underline">
            {t("editor.backDashboard")}
          </Link>
          <h1 className="mt-1 text-3xl font-black tracking-tight">
            {existing ? t("classEd.editTitle") : t("classEd.newTitle")}
          </h1>
        </div>
        <div className="flex gap-2">
          {existing && (
            <button
              type="button"
              className={`${btn.secondary} text-rose-700`}
              onClick={() => dialogRef.current?.showModal()}
            >
              {t("delete.button")}
            </button>
          )}
          <Link href="/teacher" className={btn.secondary}>
            {t("common.cancel")}
          </Link>
          <button type="submit" className={btn.primary}>
            {t("classEd.save")}
          </button>
        </div>
      </div>

      {submitted && !valid && (
        <p
          role="alert"
          className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800 ring-1 ring-rose-200"
        >
          {[errors.name, errors.students, errors.blank, errors.tooMany].filter(Boolean).join(" ")}
        </p>
      )}

      <section className={`${card} grid gap-4 p-5 sm:grid-cols-[2fr_1fr_1fr]`}>
        <div className="flex flex-col gap-1 sm:col-span-3 md:col-span-1">
          <label htmlFor="class-name" className="text-sm font-bold">
            {t("classEd.name")}
          </label>
          <input
            id="class-name"
            className={input}
            value={name}
            maxLength={60}
            placeholder={t("classEd.namePlaceholder")}
            aria-invalid={submitted && !!errors.name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="class-period" className="text-sm font-bold">
            {t("classEd.period")}
          </label>
          <input
            id="class-period"
            className={input}
            value={period}
            maxLength={10}
            onChange={(e) => setPeriod(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="class-grade" className="text-sm font-bold">
            {t("classEd.grade")}
          </label>
          <input
            id="class-grade"
            className={input}
            value={grade}
            maxLength={10}
            onChange={(e) => setGrade(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1 sm:col-span-3">
          <label htmlFor="class-subject" className="text-sm font-bold">
            {t("classEd.subject")}
          </label>
          <input
            id="class-subject"
            className={input}
            value={subject}
            maxLength={60}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>
      </section>

      <section className={`${card} flex flex-col gap-4 p-5`} aria-labelledby="students-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="students-heading" className="text-lg font-black">
            {t("classEd.students")}
          </h2>
          <span className="text-sm font-bold text-slate-600" data-testid="student-count">
            {t("classEd.count", { count: rows.length, max: MAX_CLASS_SIZE })}
          </span>
        </div>
        <p className="text-sm text-slate-500">{t("classEd.privacy")}</p>

        <div className="flex flex-col gap-2">
          <label htmlFor="class-paste" className="text-sm font-bold">
            {t("classEd.pasteLabel")}
          </label>
          <textarea
            id="class-paste"
            className={`${input} min-h-28 font-mono text-sm`}
            value={paste}
            placeholder={"Maya Rodriguez\nKenji H\nLopez, Ana"}
            onChange={(e) => setPaste(e.target.value)}
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className={btn.secondary}
              onClick={addPasted}
              disabled={!paste.trim()}
            >
              {t("classEd.addNames")}
            </button>
            {skipped.length > 0 && (
              <p className="text-sm font-semibold text-amber-700">
                {t("classEd.skipped", { lines: skipped.join(", ") })}
              </p>
            )}
          </div>
        </div>

        {rows.length > 0 && (
          <ol className="flex max-w-xl flex-col gap-2" aria-label={t("classEd.students")}>
            {rows.map((row, i) => {
              const dup = duplicates.has(manualStudentName(row).toLocaleLowerCase());
              return (
                <li
                  key={row.key}
                  className="grid grid-cols-[1.5rem_1fr_4rem_auto] items-center gap-2"
                  data-testid="student-row"
                >
                  <span className="text-right text-xs font-bold text-slate-400">{i + 1}</span>
                  <input
                    aria-label={t("classEd.firstN", { n: i + 1 })}
                    className={`${input} py-1.5`}
                    value={row.first}
                    maxLength={30}
                    aria-invalid={submitted && !row.first.trim()}
                    onChange={(e) =>
                      setRows((rs) =>
                        rs.map((r) => (r.key === row.key ? { ...r, first: e.target.value } : r)),
                      )
                    }
                  />
                  <input
                    aria-label={t("classEd.initialN", { n: i + 1 })}
                    className={`${input} py-1.5 text-center uppercase`}
                    value={row.lastInitial}
                    maxLength={1}
                    onChange={(e) =>
                      setRows((rs) =>
                        rs.map((r) =>
                          r.key === row.key ? { ...r, lastInitial: e.target.value } : r,
                        ),
                      )
                    }
                  />
                  <button
                    type="button"
                    className={`${btn.ghost} text-slate-500`}
                    aria-label={t("classEd.removeN", { n: i + 1 })}
                    onClick={() => setRows((rs) => rs.filter((r) => r.key !== row.key))}
                  >
                    ✕
                  </button>
                  {dup && (
                    <p className="col-start-2 col-end-5 text-xs font-semibold text-amber-700">
                      ⚠ {t("classEd.duplicate")}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        )}
        <button
          type="button"
          className={`${btn.ghost} self-start`}
          disabled={rows.length >= MAX_CLASS_SIZE}
          onClick={() => setRows((r) => [...r, toRow({ first: "", lastInitial: "" })])}
        >
          {t("classEd.addOne")}
        </button>
      </section>

      {existing && (
        <dialog
          ref={dialogRef}
          className="m-auto w-[min(92vw,26rem)] rounded-2xl p-6 shadow-2xl backdrop:bg-slate-900/50"
          aria-labelledby="del-class"
        >
          <h2 id="del-class" className="text-lg font-black">
            {t("delete.title", { title: existing.name })}
          </h2>
          <p className="mt-2 text-sm text-slate-600">{t("classEd.deleteBody")}</p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              className={btn.secondary}
              autoFocus
              onClick={() => dialogRef.current?.close()}
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              className={btn.danger}
              onClick={() => {
                dialogRef.current?.close();
                remove(existing.id);
                router.push("/teacher");
              }}
            >
              {t("delete.button")}
            </button>
          </div>
        </dialog>
      )}
    </form>
  );
}

/** Create or edit a typed-in class (email accounts only). */
export function ClassEditor({ isNew }: { isNew?: boolean }) {
  const t = useT();
  const params = useParams<{ id?: string }>();
  const { ready, session, teacher } = useTeacher();
  const classesReady = useManualRostersReady();
  const existing = useManualRosterStore((s) =>
    isNew ? undefined : s.classes.find((c) => c.id === params.id && c.ownerId === teacher?.id),
  );
  if (!ready || !classesReady || !teacher)
    return <p className="p-6 text-slate-500">{t("common.loading")}</p>;
  if (session?.provider !== "email") {
    return (
      <p className="mx-auto max-w-md p-8 text-center text-slate-600">
        {t("classEd.rosteringOnly")}
      </p>
    );
  }
  if (!isNew && !existing) {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <h1 className="text-2xl font-black">{t("classEd.notFound")}</h1>
        <Link href="/teacher" className={`${btn.primary} mt-5`}>
          {t("edit.backDashboard")}
        </Link>
      </div>
    );
  }
  return <Editor key={existing?.id ?? "new"} existing={existing} ownerId={teacher.id} />;
}

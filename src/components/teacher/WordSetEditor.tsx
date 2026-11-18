"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  DEFAULT_DISPLAY_SETTINGS,
  generateBoard,
  MAX_CLUE_LENGTH,
  MAX_WORDS,
  MIN_WORDS,
  randomSeed,
  validateWordSet,
  type Language,
  type ValidationIssue,
  type WordEntry,
  type WordSetDraft,
} from "@/lib/game";
import { MiniBoard } from "@/components/game/MiniBoard";
import { useT } from "@/lib/i18n";
import { generationMessage, issueMessage } from "@/lib/i18n/game";
import { btn, card, check, input, select } from "@/components/ui/styles";
import { useWordSetStore, type WordSet } from "@/store/wordSetStore";
import { DisplaySettingsFields } from "./DisplaySettingsFields";
import { DeleteWordSetButton } from "./DeleteWordSetButton";

const BLANK_ROWS = 4;
/** Fixed starting seed so the page can prerender; Shuffle picks a random one. */
const INITIAL_SEED = 20_241_117;

function initialDraft(existing?: WordSet): WordSetDraft {
  if (existing) {
    const words = existing.words.map((w) => ({ text: w.text, clue: w.clue ?? "" }));
    while (words.length < MIN_WORDS) words.push({ text: "", clue: "" });
    return { title: existing.title, language: existing.language, display: existing.display, words };
  }
  return {
    title: "",
    language: "en",
    display: DEFAULT_DISPLAY_SETTINGS,
    words: Array.from({ length: BLANK_ROWS }, () => ({ text: "", clue: "" })),
  };
}

const WORD_LEVEL = new Set(["word", "words"]);

function LetterCounter({ count, max }: { count: number; max: number }) {
  const t = useT();
  const ratio = Math.min(1, count / max);
  const tone = count > max ? "bg-rose-600" : count > max * 0.85 ? "bg-amber-500" : "bg-emerald-600";
  return (
    <div className="flex items-center gap-3" aria-live="polite">
      <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-200" aria-hidden="true">
        <div className={`h-full ${tone} transition-[width]`} style={{ width: `${ratio * 100}%` }} />
      </div>
      <span
        data-testid="letter-counter"
        className={`text-sm font-bold tabular-nums ${count > max ? "text-rose-700" : "text-slate-700"}`}
      >
        {t("editor.lettersCount", { count, max })}
      </span>
    </div>
  );
}

export function WordSetEditor({ existing }: { existing?: WordSet }) {
  const t = useT();
  const router = useRouter();
  const createSet = useWordSetStore((s) => s.create);
  const updateSet = useWordSetStore((s) => s.update);
  const [draft, setDraft] = useState<WordSetDraft>(() => initialDraft(existing));
  const [seed, setSeed] = useState<number>(existing?.previewSeed ?? INITIAL_SEED);
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [showWords, setShowWords] = useState(true);

  const validation = useMemo(() => validateWordSet(draft), [draft]);
  const preview = useMemo(() => {
    const blocking = validation.errors.some((e) => WORD_LEVEL.has(e.field));
    if (blocking) return null;
    return generateBoard(
      validation.words.map((w) => w.normalized),
      { seed, language: draft.language },
    );
  }, [validation, seed, draft.language]);

  const visible = (key: string) => submitted || touched.has(key);
  const touch = (key: string) => setTouched((t) => (t.has(key) ? t : new Set(t).add(key)));
  const issuesFor = (list: ValidationIssue[], field: string, index?: number) =>
    list.filter((e) => e.field === field && e.index === index);

  const updateWord = (index: number, patch: Partial<WordEntry>) =>
    setDraft((d) => ({
      ...d,
      words: d.words.map((w, i) => (i === index ? { ...w, ...patch } : w)),
    }));
  const removeWord = (index: number) =>
    setDraft((d) => ({
      ...d,
      words:
        d.words.length > MIN_WORDS
          ? d.words.filter((_, i) => i !== index)
          : d.words.map((w, i) => (i === index ? { text: "", clue: "" } : w)),
    }));
  const addWord = () => setDraft((d) => ({ ...d, words: [...d.words, { text: "", clue: "" }] }));

  const generationError = preview && !preview.ok ? generationMessage(t, preview.error) : null;
  const listIssue = issuesFor(validation.errors, "words")[0];
  const listError = listIssue ? issueMessage(t, listIssue) : undefined;
  const displayIssue = issuesFor(validation.errors, "display")[0];
  const displayError = displayIssue ? issueMessage(t, displayIssue) : undefined;
  const errorCount = validation.errors.length + (generationError ? 1 : 0);

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!validation.valid || !preview?.ok) {
      const first = validation.errors[0];
      const targetId =
        first?.field === "title"
          ? "ws-title"
          : first?.field === "word"
            ? `ws-word-${first.index}`
            : first?.field === "clue"
              ? `ws-clue-${first.index}`
              : "ws-errors";
      requestAnimationFrame(() => document.getElementById(targetId)?.focus());
      return;
    }
    if (existing) updateSet(existing.id, draft, seed);
    else createSet(draft, seed);
    router.push("/teacher");
  };

  const titleErrors = issuesFor(validation.errors, "title");

  return (
    <form
      onSubmit={onSave}
      noValidate
      className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/teacher" className="text-sm font-semibold text-blue-700 hover:underline">
            {t("editor.backDashboard")}
          </Link>
          <h1 className="mt-1 text-3xl font-black tracking-tight">
            {existing ? t("editor.editTitle") : t("editor.newTitle")}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {existing && (
            <DeleteWordSetButton wordSet={existing} onDeleted={() => router.push("/teacher")} />
          )}
          <Link href="/teacher" className={btn.secondary}>
            {t("common.cancel")}
          </Link>
          <button type="submit" className={btn.primary}>
            {t("editor.save")}
          </button>
        </div>
      </div>

      {submitted && errorCount > 0 && (
        <div
          id="ws-errors"
          tabIndex={-1}
          role="alert"
          className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800 ring-1 ring-rose-200"
        >
          {errorCount === 1 ? t("editor.fixOne") : t("editor.fixMany", { count: errorCount })}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-6">
          <section className={`${card} grid gap-4 p-5 sm:grid-cols-[1fr_auto]`}>
            <div className="flex flex-col gap-1">
              <label htmlFor="ws-title" className="text-sm font-bold">
                {t("editor.title")}
              </label>
              <input
                id="ws-title"
                className={input}
                value={draft.title}
                placeholder={t("editor.titlePlaceholder")}
                maxLength={80}
                aria-invalid={visible("title") && titleErrors.length > 0}
                aria-describedby={titleErrors.length ? "ws-title-error" : undefined}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                onBlur={() => touch("title")}
              />
              {visible("title") && titleErrors[0] && (
                <p id="ws-title-error" className="text-sm font-semibold text-rose-700">
                  {issueMessage(t, titleErrors[0])}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="ws-language" className="text-sm font-bold">
                {t("editor.language")}
              </label>
              <select
                id="ws-language"
                className={`${select} py-2`}
                value={draft.language}
                onChange={(e) => setDraft((d) => ({ ...d, language: e.target.value as Language }))}
              >
                <option value="en">{t("common.english")}</option>
                <option value="es">{t("common.spanish")}</option>
              </select>
            </div>
          </section>

          <section className={`${card} p-5`} aria-labelledby="ws-words-heading">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 id="ws-words-heading" className="text-lg font-black">
                  Words
                </h2>
                <p className="text-sm text-slate-500">
                  {t(draft.language === "es" ? "editor.rulesEs" : "editor.rules", {
                    min: MIN_WORDS,
                    max: MAX_WORDS,
                  })}
                </p>
              </div>
              <LetterCounter count={validation.totalLetters} max={validation.maxLetters} />
            </div>

            <ol className="mt-4 flex flex-col gap-3">
              {draft.words.map((w, index) => {
                const wordErrors = issuesFor(validation.errors, "word", index);
                const clueErrors = issuesFor(validation.errors, "clue", index);
                const warnings = issuesFor(validation.warnings, "word", index);
                const showWordErr = visible(`word-${index}`) && wordErrors.length > 0;
                const showClueErr =
                  (visible(`clue-${index}`) || visible(`word-${index}`)) && clueErrors.length > 0;
                const letters = [
                  ...(validation.words.find((v) => v.index === index)?.normalized ?? ""),
                ].length;
                const clueLen = (w.clue ?? "").length;
                return (
                  <li
                    key={index}
                    className="grid grid-cols-[auto_1fr_auto] items-start gap-x-3 gap-y-1"
                    data-row={index}
                  >
                    <span className="mt-2.5 w-5 text-right text-sm font-bold text-slate-400">
                      {index + 1}
                    </span>
                    <div className="grid gap-2 sm:grid-cols-[minmax(0,14rem)_1fr]">
                      <div className="relative">
                        <label htmlFor={`ws-word-${index}`} className="sr-only">
                          {t("editor.wordN", { n: index + 1 })}
                        </label>
                        <input
                          id={`ws-word-${index}`}
                          className={`${input} pr-10 font-extrabold tracking-wide uppercase`}
                          value={w.text}
                          placeholder={t("editor.wordPlaceholder")}
                          autoComplete="off"
                          spellCheck={false}
                          maxLength={20}
                          aria-invalid={showWordErr}
                          aria-describedby={`ws-word-${index}-msg`}
                          onChange={(e) => updateWord(index, { text: e.target.value })}
                          onBlur={() => touch(`word-${index}`)}
                        />
                        {letters > 0 && (
                          <span
                            aria-hidden="true"
                            className="absolute top-1/2 right-3 -translate-y-1/2 text-xs font-bold text-slate-400 tabular-nums"
                          >
                            {letters}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <label htmlFor={`ws-clue-${index}`} className="sr-only">
                          {t("editor.clueN", { n: index + 1 })}
                        </label>
                        <input
                          id={`ws-clue-${index}`}
                          className={`${input} pr-14 text-sm`}
                          value={w.clue ?? ""}
                          placeholder={
                            draft.display.showClues
                              ? t("editor.clueRequiredPlaceholder")
                              : t("editor.cluePlaceholder")
                          }
                          maxLength={MAX_CLUE_LENGTH + 20}
                          aria-invalid={showClueErr}
                          aria-describedby={`ws-word-${index}-msg`}
                          onChange={(e) => updateWord(index, { clue: e.target.value })}
                          onBlur={() => touch(`clue-${index}`)}
                        />
                        {clueLen > 0 && (
                          <span
                            aria-hidden="true"
                            className={`absolute top-1/2 right-3 -translate-y-1/2 text-xs font-bold tabular-nums ${
                              clueLen > MAX_CLUE_LENGTH ? "text-rose-700" : "text-slate-400"
                            }`}
                          >
                            {clueLen}/{MAX_CLUE_LENGTH}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      className={`${btn.ghost} mt-1 text-slate-500`}
                      onClick={() => removeWord(index)}
                      aria-label={t("editor.removeWord", { n: index + 1 })}
                    >
                      <svg viewBox="0 0 20 20" className="size-4" aria-hidden="true">
                        <path
                          d="M5 5l10 10M15 5L5 15"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                    <div
                      id={`ws-word-${index}-msg`}
                      className="col-start-2 flex flex-col gap-0.5 text-sm"
                    >
                      {showWordErr &&
                        wordErrors.map((e) => (
                          <p key={e.code} className="font-semibold text-rose-700">
                            {issueMessage(t, e)}
                          </p>
                        ))}
                      {showClueErr &&
                        clueErrors.map((e) => (
                          <p key={e.code} className="font-semibold text-rose-700">
                            {issueMessage(t, e)}
                          </p>
                        ))}
                      {warnings.map((e, i) => (
                        <p key={i} className="font-semibold text-amber-700">
                          ⚠ {issueMessage(t, e)}
                        </p>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ol>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                className={btn.secondary}
                onClick={addWord}
                disabled={draft.words.length >= MAX_WORDS}
              >
                {t("editor.addWord")}
              </button>
              {(submitted || touched.size > 1) && listError && (
                <p className="text-sm font-semibold text-rose-700" role="status">
                  {listError}
                </p>
              )}
            </div>
          </section>

          <section className={`${card} p-5`}>
            <DisplaySettingsFields
              value={draft.display}
              onChange={(display) => setDraft((d) => ({ ...d, display }))}
              error={displayError}
            />
          </section>
        </div>

        <aside
          className={`${card} flex h-fit flex-col gap-3 self-start p-5 lg:sticky lg:top-4`}
          aria-labelledby="ws-preview"
        >
          <div className="flex items-center justify-between">
            <h2 id="ws-preview" className="text-lg font-black">
              {t("editor.preview")}
            </h2>
            <button
              type="button"
              className={btn.ghost}
              onClick={() => setSeed(randomSeed())}
              disabled={!preview?.ok}
            >
              <svg viewBox="0 0 20 20" className="size-4" aria-hidden="true">
                <path
                  d="M3 6h3l8 8h3M3 14h3l2-2m4-4l2-2h3m-2-2l2 2-2 2m0 4l2 2-2 2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {t("editor.shuffle")}
            </button>
          </div>
          {preview?.ok ? (
            <>
              <MiniBoard
                label={t("board.preview", { rows: 9, cols: 6 })}
                board={preview.board}
                showWords={showWords}
                wordIdFor={(word) => validation.words.findIndex((w) => w.normalized === word)}
              />
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  className={check}
                  checked={showWords}
                  onChange={(e) => setShowWords(e.target.checked)}
                />
                {t("editor.highlight")}
              </label>
              <p className="text-xs text-slate-500">{t("editor.sameBoard")}</p>
            </>
          ) : generationError ? (
            <p
              role="alert"
              className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-800"
            >
              {generationError}
            </p>
          ) : (
            <div className="flex min-h-40 items-center justify-center rounded-2xl bg-slate-100 p-6 text-center text-sm text-slate-500 lg:aspect-[2/3]">
              {validation.words.length < MIN_WORDS
                ? t("editor.addMore", { min: MIN_WORDS })
                : t("editor.fixWords")}
            </div>
          )}
        </aside>
      </div>
    </form>
  );
}

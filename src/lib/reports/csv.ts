import type { RoundResult } from "./types";
import { studentRows, wordRows } from "./report";

type Cell = string | number | boolean | null | undefined;

/**
 * RFC 4180 escaping, plus a guard against spreadsheet formula injection
 * (cells starting with = + - @ are prefixed with an apostrophe).
 */
export function csvCell(value: Cell): string {
  if (value === null || value === undefined) return "";
  let s = String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: Cell[][]): string {
  return rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

const seconds = (ms: number | null) => (ms === null ? "" : (ms / 1000).toFixed(1));

export function studentsCsv(result: RoundResult): string {
  const words = result.words.map((w) => w.display);
  const header = [
    "Rank",
    "Student",
    "Simulated",
    "Score",
    "Words found",
    "Total words",
    "Completed",
    "Time to finish (s)",
    "Hints used",
    "Hinted words",
    ...words.map((w) => `${w} (s)`),
  ];
  const rows = studentRows(result).map((r) => [
    r.rank,
    r.name,
    r.isBot ? "yes" : "no",
    r.score,
    r.found,
    r.total,
    r.completed ? "yes" : "no",
    seconds(r.finishedMs),
    r.hintsUsed,
    r.hintedWords.join("; "),
    ...r.wordTimes.map(seconds),
  ]);
  return toCsv([header, ...rows]);
}

export function wordsCsv(result: RoundResult): string {
  const header = [
    "Word",
    "Clue",
    "Found by",
    "Students",
    "Found (%)",
    "Average time (s)",
    "Hints",
    "Review",
  ];
  const rows = wordRows(result).map((w) => [
    w.word,
    w.clue,
    w.foundBy,
    w.players,
    Math.round(w.share * 100),
    seconds(w.avgMs),
    w.hints,
    w.review ? "yes" : "no",
  ]);
  return toCsv([header, ...rows]);
}

export function csvFileName(result: RoundResult, kind: "students" | "words"): string {
  const date = new Date(result.startedAt).toISOString().slice(0, 10);
  const slug =
    result.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "round";
  return `letterlinx-${slug}-${date}-${kind}.csv`;
}

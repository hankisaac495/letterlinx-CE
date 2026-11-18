import { DEFAULT_DISPLAY_SETTINGS, prepareRound, SAMPLE_WORD_SETS } from "@/lib/game";
import {
  addPlayer,
  advancePhase,
  applyProgress,
  COUNTDOWN_MS,
  createRoom,
  emptyProgress,
  endRound,
  pauseRound,
  resumeRound,
  startRound,
  type PlayerProgress,
  type RoundConfig,
} from "@/lib/live";
import { csvCell, studentsCsv, toCsv, wordsCsv, csvFileName } from "./csv";
import {
  regenerateBoard,
  roundSummary,
  sectionHistory,
  studentRows,
  toRoundResult,
  wordRows,
} from "./report";
import { sampleHistory } from "./sample";

const T = 1_700_000_000_000;

function round(): RoundConfig {
  const draft = SAMPLE_WORD_SETS.science;
  const p = prepareRound(draft, 77);
  if (!p.ok) throw new Error();
  return {
    title: "Cell Biology",
    board: p.board,
    words: p.words,
    draft,
    wordSetId: "ws1",
    sectionId: "sec1",
    teacherId: "t1",
    settings: { display: DEFAULT_DISPLAY_SETTINGS, duration: 120, teamMode: false, teamCount: 2 },
  };
}

const prog = (
  found: [number, number, number, boolean?][],
  hints: [number, number][] = [],
): PlayerProgress => ({
  ...emptyProgress(),
  found: found.map(([wordId, elapsedMs, points, hintPenalty]) => ({
    wordId,
    elapsedMs,
    points,
    hintPenalty: !!hintPenalty,
  })),
  hints: hints.map(([wordId, elapsedMs]) => ({ wordId, elapsedMs })),
  score: found.reduce((s, f) => s + f[2], 0),
});

function finishedResult() {
  let room = createRoom("ABC234", round(), T);
  for (const [id, name] of [
    ["a", "Ana B."],
    ["b", "Ben C."],
    ["c", "Cy D."],
    ["d", "Di E."],
  ]) {
    room = addPlayer(room, { id, name }, T);
  }
  room = advancePhase(startRound(room, T), T + COUNTDOWN_MS);
  const start = T + COUNTDOWN_MS;
  room = pauseRound(room, start + 10_000);
  room = resumeRound(room, start + 25_000);
  const all = room.round.words.map(
    (w, i) => [w.id, 2000 * (i + 1), 80] as [number, number, number],
  );
  room = applyProgress(room, "a", { ...prog(all), status: "complete", finishedMs: 12_000 });
  room = applyProgress(
    room,
    "b",
    prog(
      [
        [0, 3000, 70],
        [1, 9000, 40, true],
      ],
      [[1, 5000]],
    ),
  );
  room = applyProgress(room, "c", prog([[0, 5000, 60]]));
  room = endRound(room, start + 60_000);
  return toRoundResult(room)!;
}

describe("toRoundResult", () => {
  it("returns null until the round has ended", () => {
    expect(toRoundResult(createRoom("ABC234", round(), T))).toBeNull();
  });

  it("captures players, timing (without pauses) and the seed", () => {
    const r = finishedResult();
    expect(r).toMatchObject({
      id: "ABC234-1",
      sectionId: "sec1",
      teacherId: "t1",
      playedMs: 45_000,
    });
    expect(r.players).toHaveLength(4);
  });

  it("regenerates the identical board from the stored seed", () => {
    const r = finishedResult();
    expect(regenerateBoard(r)).toEqual(round().board);
  });
});

describe("per-student rows", () => {
  it("ranks students and reports words, times, hints and completion", () => {
    const rows = studentRows(finishedResult());
    expect(rows.map((r) => r.name)).toEqual(["Ana B.", "Ben C.", "Cy D.", "Di E."]);
    expect(rows[0]).toMatchObject({ rank: 1, completed: true, finishedMs: 12_000, found: 6 });
    expect(rows[1]).toMatchObject({
      found: 2,
      completed: false,
      hintsUsed: 1,
      hintedWords: ["NUCLEUS"],
      halfPointWords: [1],
    });
    expect(rows[1].wordTimes.slice(0, 3)).toEqual([3000, 9000, null]);
    expect(rows[3]).toMatchObject({ rank: 4, found: 0, score: 0 });
  });
});

describe("per-word rows", () => {
  it("computes % found and average time and flags hard words", () => {
    const rows = wordRows(finishedResult());
    expect(rows[0]).toMatchObject({
      word: "CELL",
      foundBy: 3,
      share: 0.75,
      avgMs: Math.round((2000 + 3000 + 5000) / 3),
    });
    expect(rows[1]).toMatchObject({ foundBy: 2, share: 0.5, hints: 1 });
    // Found by only 1 of 4 (25%) → flagged for review.
    expect(rows.filter((r) => r.share < 0.5).every((r) => r.review)).toBe(true);
    expect(rows[0].review).toBe(false);
  });
});

describe("summary and history", () => {
  it("summarises a round", () => {
    expect(roundSummary(finishedResult())).toMatchObject({
      players: 4,
      completionShare: 0.25,
      hintsUsed: 1,
      wordsFoundShare: (6 + 2 + 1) / 24,
    });
  });

  it("lists a section's rounds oldest first", () => {
    const a = { ...finishedResult(), id: "x", startedAt: 5 };
    const b = { ...finishedResult(), id: "y", startedAt: 1 };
    const other = { ...finishedResult(), id: "z", sectionId: "other" };
    expect(sectionHistory([a, b, other], "sec1").map((r) => r.id)).toEqual(["y", "x"]);
  });

  it("builds deterministic sample history", () => {
    const opts = {
      sectionId: "s",
      teacherId: "t",
      students: Array.from({ length: 20 }, (_, i) => ({ id: `p${i}`, name: `S${i}` })),
      wordSets: [SAMPLE_WORD_SETS.science, SAMPLE_WORD_SETS.spanish],
      rounds: 5,
      now: T,
    };
    const h = sampleHistory(opts);
    expect(h).toHaveLength(5);
    expect(h.every((r) => r.sample && r.startedAt < T)).toBe(true);
    expect(sampleHistory(opts)).toEqual(h);
    expect(regenerateBoard(h[1])?.tiles).toHaveLength(54);
  });
});

describe("CSV", () => {
  it("escapes quotes, commas and newlines and guards against formulas", () => {
    expect(csvCell('He said "hi", then left')).toBe('"He said ""hi"", then left"');
    expect(csvCell("line1\nline2")).toBe('"line1\nline2"');
    expect(csvCell("=SUM(A1)")).toBe("'=SUM(A1)");
    expect(csvCell(-5)).toBe("-5");
    expect(csvCell(null)).toBe("");
    expect(
      toCsv([
        ["a", 1],
        ["b", 2],
      ]),
    ).toBe("a,1\r\nb,2\r\n");
  });

  it("exports students and words", () => {
    const r = finishedResult();
    const students = studentsCsv(r).trim().split("\r\n");
    expect(students).toHaveLength(5);
    expect(students[0]).toContain("CELL (s)");
    expect(students[2]).toContain("Ben C.");
    expect(students[2]).toContain("NUCLEUS");
    const words = wordsCsv(r).trim().split("\r\n");
    expect(words).toHaveLength(7);
    expect(words[1]).toMatch(/^CELL,The basic unit of life,3,4,75,3\.3,0,no$/);
    expect(csvFileName(r, "words")).toMatch(
      /^letterlinx-cell-biology-\d{4}-\d{2}-\d{2}-words\.csv$/,
    );
  });
});

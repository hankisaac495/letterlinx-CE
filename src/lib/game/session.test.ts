import type { Board } from "./board";
import { createRng } from "./rng";
import { POINTS_PER_LETTER, scoreWord } from "./scoring";
import {
  createGame,
  currentWord,
  endGame,
  hintAvailability,
  requestHint,
  submitPath,
  tick,
  timeRemainingMs,
  type GameConfig,
  type TargetWord,
} from "./session";
import { SAMPLE_WORD_SETS } from "./samples";
import { DEFAULT_DISPLAY_SETTINGS, DEFAULT_HINT_SETTINGS, type DisplaySettings } from "./types";
import { prepareRound } from "./words";

// Hand-built 6 × 9 board. Row-major indices: row r, col c => r*6+c.
//   0: C A T . . .      CAT planted 0,1,2 and also traceable 0,7,14 (diagonal down)
//   1: . A . D O G      DOG planted 9,10,11
//   2: . . T . . .
//   3: S U N . . .      SUN 18,19,20
const rows = [
  "CATXXX",
  "XAXDOG",
  "XXTXXX",
  "SUNXXX",
  "XXXXXX",
  "XXXXXX",
  "XXXXXX",
  "XXXXXX",
  "XXXXXX",
];
const board: Board = {
  cols: 6,
  rows: 9,
  tiles: rows.join("").split(""),
  seed: 1,
  language: "en",
  placements: [],
};
const words: TargetWord[] = [
  { id: 0, normalized: "CAT", display: "CAT", clue: "", path: [0, 1, 2] },
  { id: 1, normalized: "DOG", display: "DOG", clue: "", path: [9, 10, 11] },
  { id: 2, normalized: "SUN", display: "SUN", clue: "", path: [18, 19, 20] },
];

function config(
  display: Partial<DisplaySettings> = {},
  duration: GameConfig["duration"] = 60,
): GameConfig {
  return { board, words, duration, display: { ...DEFAULT_DISPLAY_SETTINGS, ...display } };
}

const T0 = 1_000_000;

describe("submitPath", () => {
  it("accepts a target word along its planted path", () => {
    const { state, outcome } = submitPath(createGame(config(), T0), [0, 1, 2], T0 + 1000);
    expect(outcome.type).toBe("found");
    expect(state.found).toHaveLength(1);
    expect(state.score).toBeGreaterThan(0);
  });

  it("accepts a word along any valid path, not only the planted one", () => {
    const { outcome } = submitPath(createGame(config(), T0), [0, 7, 14], T0 + 1000);
    expect(outcome).toMatchObject({ type: "found", word: { id: 0 }, found: { path: [0, 7, 14] } });
  });

  it("counts a miss for wrong letters without penalty", () => {
    const { state, outcome } = submitPath(createGame(config(), T0), [3, 4, 5], T0);
    expect(outcome.type).toBe("miss");
    expect(state.misses).toBe(1);
    expect(state.score).toBe(0);
  });

  it("ignores short or non-adjacent paths", () => {
    const g = createGame(config(), T0);
    expect(submitPath(g, [0, 1], T0).outcome.type).toBe("ignored");
    expect(submitPath(g, [0, 2, 4], T0).outcome.type).toBe("ignored");
    expect(submitPath(g, [0, 1, 0], T0).outcome.type).toBe("ignored");
  });

  it("doesn't count a word twice", () => {
    let { state } = submitPath(createGame(config(), T0), [0, 1, 2], T0);
    const again = submitPath(state, [0, 7, 14], T0);
    expect(again.outcome.type).toBe("alreadyFound");
    expect(again.state.found).toHaveLength(1);
    state = again.state;
    expect(state.misses).toBe(0);
  });

  it("completes when every word is found, recording the time", () => {
    let s = createGame(config(), T0);
    s = submitPath(s, [0, 1, 2], T0 + 1000).state;
    s = submitPath(s, [9, 10, 11], T0 + 2000).state;
    s = submitPath(s, [18, 19, 20], T0 + 3500).state;
    expect(s.status).toBe("complete");
    expect(s.finishedMs).toBe(3500);
    expect(submitPath(s, [0, 1, 2], T0 + 4000).outcome.type).toBe("ignored");
  });

  it("in one-at-a-time mode only accepts the current word", () => {
    let s = createGame(config({ mode: "oneAtATime" }), T0);
    expect(currentWord(s)?.normalized).toBe("CAT");
    expect(submitPath(s, [9, 10, 11], T0).outcome.type).toBe("miss"); // DOG, not yet
    s = submitPath(s, [0, 1, 2], T0).state;
    expect(currentWord(s)?.normalized).toBe("DOG");
    expect(submitPath(s, [9, 10, 11], T0).outcome.type).toBe("found");
  });

  it("works with a real generated board", () => {
    const prepared = prepareRound(SAMPLE_WORD_SETS.spanish, 42);
    if (!prepared.ok) throw new Error("prepare failed");
    let s = createGame(
      {
        board: prepared.board,
        words: prepared.words,
        duration: "untimed",
        display: DEFAULT_DISPLAY_SETTINGS,
      },
      T0,
    );
    for (const w of prepared.words) s = submitPath(s, w.path, T0 + 500).state;
    expect(s.status).toBe("complete");
    expect(prepared.words.find((w) => w.normalized === "NIÑO")?.display).toBe("NIÑO");
    expect(prepared.words.find((w) => w.normalized === "JARDIN")?.display).toBe("JARDÍN");
  });
});

describe("timer", () => {
  it("counts down and ends the round at zero", () => {
    let s = createGame(config({}, 60), T0);
    expect(timeRemainingMs(s, T0 + 15_000)).toBe(45_000);
    s = tick(s, T0 + 60_000);
    expect(s.status).toBe("timeUp");
    expect(submitPath(s, [0, 1, 2], T0 + 61_000).outcome.type).toBe("ignored");
  });

  it("rejects submissions after time runs out even without a tick", () => {
    const s = createGame(config({}, 60), T0);
    expect(submitPath(s, [0, 1, 2], T0 + 60_001).outcome.type).toBe("ignored");
  });

  it("untimed rounds never time out but can be ended", () => {
    let s = createGame(config({}, "untimed"), T0);
    expect(timeRemainingMs(s, T0 + 10 ** 9)).toBeNull();
    expect(tick(s, T0 + 10 ** 9).status).toBe("playing");
    s = endGame(s, T0 + 5000);
    expect(s).toMatchObject({ status: "ended", finishedMs: 5000 });
  });
});

describe("scoring", () => {
  it("gives points per letter plus a speed bonus that shrinks over time", () => {
    const early = scoreWord({ letters: 5, elapsedMs: 0, duration: 60, halved: false });
    const late = scoreWord({ letters: 5, elapsedMs: 59_000, duration: 60, halved: false });
    const after = scoreWord({ letters: 5, elapsedMs: 70_000, duration: 60, halved: false });
    expect(early.base).toBe(5 * POINTS_PER_LETTER);
    expect(early.total).toBeGreaterThan(late.total);
    expect(after.speedBonus).toBe(0);
    expect(
      scoreWord({ letters: 9, elapsedMs: 0, duration: 60, halved: false }).total,
    ).toBeGreaterThan(early.total);
  });

  it("halves points when penalised", () => {
    const full = scoreWord({ letters: 6, elapsedMs: 1000, duration: "untimed", halved: false });
    const half = scoreWord({ letters: 6, elapsedMs: 1000, duration: "untimed", halved: true });
    expect(half.total).toBe(Math.round(full.total / 2));
  });
});

describe("hints", () => {
  const hidden = (hints = DEFAULT_HINT_SETTINGS) =>
    config({ mode: "hidden", allowHints: true, hints });
  const rng = createRng(1);

  it("are only available in Hide the words mode with hints allowed", () => {
    expect(requestHint(createGame(config(), T0), T0, rng)).toMatchObject({
      ok: false,
      reason: "disabled",
    });
    expect(requestHint(createGame(config({ mode: "hidden" }), T0), T0, rng)).toMatchObject({
      ok: false,
      reason: "disabled",
    });
    expect(requestHint(createGame(hidden(), T0), T0, rng).ok).toBe(true);
  });

  it("returns an unfound word's planted path in order and logs the use", () => {
    let s = createGame(hidden(), T0);
    s = submitPath(s, [0, 1, 2], T0).state; // CAT found
    const r = requestHint(s, T0 + 2000, rng);
    if (!r.ok) throw new Error("expected hint");
    expect(["DOG", "SUN"]).toContain(r.word.normalized);
    expect(r.path).toEqual(r.word.path);
    expect(r.state.hints).toEqual([{ wordId: r.word.id, elapsedMs: 2000 }]);
  });

  it("respects the per-student count", () => {
    let s = createGame(hidden({ perStudent: 1, cooldownSeconds: 0, cost: "none" }), T0);
    const first = requestHint(s, T0, rng);
    if (!first.ok) throw new Error();
    s = first.state;
    expect(hintAvailability(s, T0).remaining).toBe(0);
    expect(requestHint(s, T0 + 30_000, rng)).toMatchObject({ ok: false, reason: "noneLeft" });
  });

  it("supports unlimited hints", () => {
    let s = createGame(hidden({ perStudent: "unlimited", cooldownSeconds: 0, cost: "none" }), T0);
    for (let i = 0; i < 10; i++) {
      const r = requestHint(s, T0 + i, rng);
      if (!r.ok) throw new Error(r.reason);
      s = r.state;
    }
    expect(hintAvailability(s, T0).remaining).toBe(Infinity);
  });

  it("enforces the cooldown", () => {
    let s = createGame(hidden({ perStudent: 3, cooldownSeconds: 10, cost: "none" }), T0);
    const r = requestHint(s, T0, rng);
    if (!r.ok) throw new Error();
    s = r.state;
    expect(hintAvailability(s, T0 + 4000)).toMatchObject({ ready: false, cooldownMs: 6000 });
    expect(requestHint(s, T0 + 4000, rng)).toMatchObject({ ok: false, reason: "cooldown" });
    expect(requestHint(s, T0 + 10_000, rng).ok).toBe(true);
  });

  it("halves points for a word found within 15 s of its hint", () => {
    const setup = (cost: "none" | "halfPoints", foundAfterMs: number) => {
      let s = createGame(hidden({ perStudent: 3, cooldownSeconds: 0, cost }), T0);
      const r = requestHint(s, T0, () => 0); // always the first unfound word: CAT
      if (!r.ok) throw new Error();
      s = submitPath(r.state, r.path, T0 + foundAfterMs).state;
      return s.found[0];
    };
    const penalised = setup("halfPoints", 5000);
    const free = setup("none", 5000);
    const late = setup("halfPoints", 16_000);
    expect(penalised.hintPenalty).toBe(true);
    expect(penalised.points).toBe(Math.round(free.points / 2));
    expect(late.hintPenalty).toBe(false);
  });
});

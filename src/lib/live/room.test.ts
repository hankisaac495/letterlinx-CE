import { DEFAULT_DISPLAY_SETTINGS, prepareRound, SAMPLE_WORD_SETS, createRng } from "@/lib/game";
import { botNames, botProgress, planBot } from "./bots";
import { formatStudentName, nicknameFor } from "./names";
import {
  addPlayer,
  advancePhase,
  applyProgress,
  COUNTDOWN_MS,
  createRoom,
  emptyProgress,
  endRound,
  extremes,
  gameElapsedMs,
  pauseRound,
  rematch,
  resumeRound,
  shouldEnd,
  standings,
  startRound,
  teamStandings,
  timeRemainingMs,
  toSnapshot,
  wordProgressDistribution,
  wordStats,
} from "./room";
import { generateRoomCode, isValidRoomCode, normalizeRoomCode } from "./roomCode";
import type { PlayerProgress, RoundConfig, RoundSettings } from "./types";

function round(settings: Partial<RoundSettings> = {}): RoundConfig {
  const draft = SAMPLE_WORD_SETS.science;
  const prepared = prepareRound(draft, 1);
  if (!prepared.ok) throw new Error("prepare failed");
  return {
    title: draft.title,
    board: prepared.board,
    words: prepared.words,
    draft,
    wordSetId: null,
    sectionId: null,
    settings: {
      display: DEFAULT_DISPLAY_SETTINGS,
      duration: 60,
      teamMode: false,
      teamCount: 2,
      ...settings,
    },
  };
}

const T = 1_000_000;

function progress(
  found: [number, number, number][],
  extra: Partial<PlayerProgress> = {},
): PlayerProgress {
  return {
    ...emptyProgress(),
    found: found.map(([wordId, elapsedMs, points]) => ({
      wordId,
      elapsedMs,
      points,
      hintPenalty: false,
    })),
    score: found.reduce((s, f) => s + f[2], 0),
    ...extra,
  };
}

function playingRoom(settings?: Partial<RoundSettings>, names = ["Ana B.", "Ben C.", "Cy D."]) {
  let room = createRoom("ABC234", round(settings), T);
  names.forEach((name, i) => (room = addPlayer(room, { id: `p${i}`, name }, T)));
  room = startRound(room, T);
  return advancePhase(room, T + COUNTDOWN_MS);
}

describe("room codes", () => {
  it("generates valid 6-character codes without look-alike characters", () => {
    const rng = createRng(5);
    for (let i = 0; i < 200; i++) {
      const code = generateRoomCode(rng);
      expect(isValidRoomCode(code)).toBe(true);
      expect(code).not.toMatch(/[01OILS5]/);
    }
  });

  it("normalizes typed codes", () => {
    expect(normalizeRoomCode(" abc-234 ")).toBe("ABC234");
    expect(isValidRoomCode("ABC23")).toBe(false);
    expect(isValidRoomCode("ABCO23")).toBe(false);
  });
});

describe("players and teams", () => {
  it("adds players once and keeps progress on rejoin", () => {
    let room = createRoom("ABC234", round(), T);
    room = addPlayer(room, { id: "p1", name: "Maya R." }, T);
    room = addPlayer(room, { id: "p1", name: "Maya R." }, T + 5);
    expect(room.players).toHaveLength(1);
  });

  it("splits teams evenly when the round starts and places late joiners on the smallest team", () => {
    let room = createRoom("ABC234", round({ teamMode: true, teamCount: 3 }), T);
    for (let i = 0; i < 7; i++) room = addPlayer(room, { id: `p${i}`, name: `S${i}` }, T);
    room = startRound(room, T);
    const sizes = [0, 1, 2].map((t) => room.players.filter((p) => p.team === t).length);
    expect(sizes).toEqual([3, 2, 2]);
    room = addPlayer(room, { id: "late", name: "Late" }, T);
    expect(room.players.find((p) => p.id === "late")!.team).toBe(1);
  });

  it("formats names and nicknames", () => {
    expect(formatStudentName("  maya ", "rodriguez")).toBe("maya R.");
    expect(nicknameFor("abc")).toBe(nicknameFor("abc"));
    expect(nicknameFor("abc")).toMatch(/^\w+ \w+$/);
  });
});

describe("clock", () => {
  it("counts down, then runs, and excludes pauses", () => {
    let room = createRoom("ABC234", round(), T);
    room = startRound(room, T);
    expect(room.phase).toBe("countdown");
    expect(gameElapsedMs(room.clock, T)).toBe(-COUNTDOWN_MS);
    room = advancePhase(room, T + COUNTDOWN_MS);
    expect(room.phase).toBe("playing");
    const t0 = T + COUNTDOWN_MS;
    room = pauseRound(room, t0 + 10_000);
    expect(gameElapsedMs(room.clock, t0 + 50_000)).toBe(10_000); // frozen while paused
    room = resumeRound(room, t0 + 40_000);
    expect(gameElapsedMs(room.clock, t0 + 45_000)).toBe(15_000);
    expect(timeRemainingMs(room, t0 + 45_000)).toBe(45_000);
  });

  it("ends when time runs out", () => {
    const room = playingRoom();
    const t0 = T + COUNTDOWN_MS;
    expect(shouldEnd(room, t0 + 59_000)).toBe(false);
    expect(shouldEnd(room, t0 + 60_000)).toBe(true);
    const ended = endRound(room, t0 + 61_500);
    expect(ended.phase).toBe("ended");
    expect(gameElapsedMs(ended.clock, t0 + 99_000)).toBe(60_000);
  });

  it("ends untimed rounds when everyone has found every word", () => {
    let room = playingRoom({ duration: "untimed" }, ["Ana B."]);
    expect(shouldEnd(room, T + 10 ** 7)).toBe(false);
    const all = room.round.words.map(
      (w, i) => [w.id, 1000 * (i + 1), 50] as [number, number, number],
    );
    room = applyProgress(room, "p0", progress(all, { status: "complete", finishedMs: 6000 }));
    expect(shouldEnd(room, T + 10 ** 7)).toBe(true);
  });
});

describe("progress, feed and standings", () => {
  it("adds feed items only for new finds and ignores the lobby", () => {
    let lobby = createRoom("ABC234", round(), T);
    lobby = addPlayer(lobby, { id: "p0", name: "Ana B." }, T);
    expect(applyProgress(lobby, "p0", progress([[0, 1, 10]]))).toBe(lobby);

    let room = playingRoom();
    room = applyProgress(room, "p0", progress([[0, 2000, 60]]));
    room = applyProgress(
      room,
      "p0",
      progress([
        [0, 2000, 60],
        [3, 4000, 50],
      ]),
    );
    expect(room.feed.map((f) => f.wordId)).toEqual([3, 0]);
    room = applyProgress(room, "nobody", progress([[1, 1, 1]]));
    expect(room.feed).toHaveLength(2);
  });

  it("ranks by score, then words found, then finish time; ties share a rank", () => {
    let room = playingRoom();
    room = applyProgress(room, "p0", progress([[0, 2000, 60]]));
    room = applyProgress(room, "p1", progress([[0, 1000, 90]]));
    room = applyProgress(room, "p2", progress([[1, 1000, 60]]));
    const s = standings(room);
    expect(s.map((x) => [x.playerId, x.rank])).toEqual([
      ["p1", 1],
      ["p0", 2],
      ["p2", 2],
    ]);
  });

  it("totals teams", () => {
    let room = playingRoom({ teamMode: true, teamCount: 2 }, ["A", "B", "C", "D"]);
    room = applyProgress(room, "p0", progress([[0, 1, 100]]));
    room = applyProgress(room, "p2", progress([[1, 1, 50]]));
    room = applyProgress(room, "p1", progress([[1, 1, 30]]));
    expect(teamStandings(room)).toEqual([
      { team: 0, score: 150, members: 2, found: 2 },
      { team: 1, score: 30, members: 2, found: 1 },
    ]);
  });

  it("computes per-word stats, extremes and one-at-a-time distribution", () => {
    let room = playingRoom({ display: { ...DEFAULT_DISPLAY_SETTINGS, mode: "oneAtATime" } });
    room = applyProgress(
      room,
      "p0",
      progress([
        [0, 2000, 60],
        [1, 6000, 60],
      ]),
    );
    room = applyProgress(room, "p1", progress([[0, 4000, 60]]));
    const stats = wordStats(room);
    expect(stats[0]).toMatchObject({ foundBy: 2, avgMs: 3000 });
    expect(stats[0].share).toBeCloseTo(2 / 3);
    expect(extremes(stats).most?.wordId).toBe(0);
    expect(extremes(stats).least?.foundBy).toBe(0);
    expect(wordProgressDistribution(room)).toEqual({ onWord: [1, 1, 1, 0, 0, 0], done: 0 });
  });

  it("snapshots omit the draft and include standings only at the end", () => {
    let room = playingRoom();
    expect(toSnapshot(room, T).standings).toBeNull();
    expect("draft" in toSnapshot(room, T).round).toBe(false);
    room = endRound(room, T + 10_000);
    expect(toSnapshot(room, T).standings).toHaveLength(3);
  });

  it("rematch returns to the lobby with players kept and scores cleared", () => {
    let room = playingRoom();
    room = applyProgress(room, "p0", progress([[0, 2000, 60]]));
    room = rematch(endRound(room, T + 5000), round());
    expect(room).toMatchObject({ phase: "lobby", roundNumber: 2, feed: [] });
    expect(room.players.every((p) => p.progress.score === 0)).toBe(true);
  });
});

describe("bots", () => {
  it("creates distinct fictional names", () => {
    const names = botNames(20, createRng(1));
    expect(new Set(names).size).toBe(20);
    expect(names.every((n) => /^[A-Z][a-z]+ [A-Z]\.$/.test(n))).toBe(true);
  });

  it("find words over time, faster bots finishing sooner", () => {
    const r = round({ duration: "untimed" });
    const rng = createRng(3);
    const plans = Array.from({ length: 30 }, () => planBot(r, rng));
    for (const plan of plans) {
      expect(botProgress(plan, r, 0).found).toHaveLength(0);
      const done = botProgress(plan, r, 10 ** 7);
      expect(done.status).toBe("complete");
      expect(done.score).toBeGreaterThan(0);
    }
    const finish = plans.map((p) => ({
      skill: p.skill,
      at: botProgress(p, r, 10 ** 7).finishedMs!,
    }));
    const fast = finish.filter((f) => f.skill < 1).map((f) => f.at);
    const slow = finish.filter((f) => f.skill > 1.6).map((f) => f.at);
    const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    expect(avg(fast)).toBeLessThan(avg(slow));
  });

  it("respect one-at-a-time order and the round timer", () => {
    const r = round({ duration: 60, display: { ...DEFAULT_DISPLAY_SETTINGS, mode: "oneAtATime" } });
    const plan = planBot(r, createRng(9));
    const found = botProgress(plan, r, 10 ** 7).found;
    expect(found.map((f) => f.wordId)).toEqual(found.map((_, i) => i));
    expect(found.every((f) => f.elapsedMs <= 60_000)).toBe(true);
  });

  it("use hints only when allowed, within limits", () => {
    const display = { ...DEFAULT_DISPLAY_SETTINGS, mode: "hidden" as const, allowHints: true };
    const r = round({
      duration: "untimed",
      display: { ...display, hints: { perStudent: 1, cooldownSeconds: 10, cost: "halfPoints" } },
    });
    const rng = createRng(4);
    let anyHints = false;
    for (let i = 0; i < 40; i++) {
      const p = botProgress(planBot(r, rng), r, 10 ** 7);
      expect(p.hints.length).toBeLessThanOrEqual(1);
      anyHints ||= p.hints.length > 0;
    }
    expect(anyHints).toBe(true);
    const noHints = round({ duration: "untimed" });
    expect(botProgress(planBot(noHints, createRng(4)), noHints, 10 ** 7).hints).toHaveLength(0);
  });
});

import {
  createGame,
  DEFAULT_DISPLAY_SETTINGS,
  prepareRound,
  SAMPLE_WORD_SETS,
  submitPath,
} from "@/lib/game";
import { makeGameClock, restoreGame, toProgress } from "./student";

describe("student helpers", () => {
  const prepared = prepareRound(SAMPLE_WORD_SETS.science, 3);
  if (!prepared.ok) throw new Error();
  const config = {
    board: prepared.board,
    words: prepared.words,
    display: DEFAULT_DISPLAY_SETTINGS,
    duration: 60 as const,
  };

  it("game clock freezes while paused and after the end", () => {
    const clock = makeGameClock({
      startAt: 1000,
      pausedAt: 6000,
      pausedTotalMs: 2000,
      endedAt: null,
    });
    expect(clock(9_999)).toBe(1000 + 3000);
    const ended = makeGameClock({ startAt: 1000, pausedAt: null, pausedTotalMs: 0, endedAt: 4000 });
    expect(ended(50_000)).toBe(4000);
  });

  it("round-trips progress through restoreGame", () => {
    let game = createGame(config, 0);
    game = submitPath(game, prepared.words[0].path, 2000).state;
    game = submitPath(game, prepared.words[2].path, 5000).state;
    const restored = restoreGame(config, 0, toProgress(game));
    expect(restored.score).toBe(game.score);
    expect(restored.found.map((f) => f.wordId)).toEqual([0, 2]);
    expect(restored.found[0].path).toEqual(prepared.words[0].path);
    expect(submitPath(restored, prepared.words[0].path, 6000).outcome.type).toBe("alreadyFound");
  });
});

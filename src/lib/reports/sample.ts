import { createRng, deriveSeed, prepareRound, randInt, type WordSetDraft } from "@/lib/game";
import { botProgress, planBot, type RoundSettings } from "@/lib/live";
import type { RoundResult } from "./types";

const DAY = 24 * 60 * 60 * 1000;

/**
 * Plausible past rounds for a class, so reports have history to show in a demo.
 * Deterministic for a given seed. Marked `sample: true`.
 */
export function sampleHistory(options: {
  sectionId: string;
  teacherId: string;
  students: { id: string; name: string }[];
  wordSets: WordSetDraft[];
  rounds: number;
  now: number;
  seed?: number;
}): RoundResult[] {
  const { sectionId, teacherId, students, wordSets, rounds, now } = options;
  const rng = createRng(options.seed ?? 99);
  const results: RoundResult[] = [];
  for (let i = 0; i < rounds && wordSets.length; i++) {
    const draft = wordSets[i % wordSets.length];
    const seed = deriveSeed(options.seed ?? 99, i);
    const prepared = prepareRound(draft, seed);
    if (!prepared.ok) continue;
    const settings: RoundSettings = {
      display: draft.display,
      duration: 120,
      teamMode: false,
      teamCount: 2,
    };
    const round = { words: prepared.words, settings };
    // Attendance varies a little; later rounds trend slightly better.
    const present = students.filter(() => rng() < 0.9);
    const startedAt = now - (rounds - i) * 2 * DAY - randInt(rng, 6) * 60 * 60 * 1000;
    const speedUp = 1 - i * 0.04;
    const players = present.map((s) => {
      const plan = planBot(round, rng);
      plan.events = plan.events.map((e) => ({ ...e, atMs: Math.round(e.atMs * speedUp) }));
      return {
        id: s.id,
        name: s.name,
        isBot: false,
        team: null,
        progress: botProgress(plan, round, 120_000),
      };
    });
    results.push({
      id: `sample-${sectionId}-${i}`,
      code: "SAMPLE",
      roundNumber: i + 1,
      title: draft.title,
      language: draft.language,
      seed,
      words: prepared.words,
      settings,
      sectionId,
      teacherId,
      wordSetId: null,
      startedAt,
      endedAt: startedAt + 120_000,
      playedMs: 120_000,
      players,
      sample: true,
    });
  }
  return results;
}

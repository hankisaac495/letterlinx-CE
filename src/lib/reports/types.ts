import type { Language, TargetWord } from "@/lib/game";
import type { PlayerProgress, RoundSettings } from "@/lib/live";

/** A finished round, saved for reports. The board is regenerated from `seed`. */
export interface RoundResult {
  /** `${code}-${roundNumber}` */
  id: string;
  code: string;
  roundNumber: number;
  title: string;
  language: Language;
  seed: number;
  words: TargetWord[];
  settings: RoundSettings;
  sectionId: string | null;
  /** Class name and period at the time of the round (rosters can change later). */
  className?: string;
  classPeriod?: string;
  teacherId: string | null;
  wordSetId: string | null;
  startedAt: number;
  endedAt: number;
  /** Round time actually played (excludes pauses). */
  playedMs: number;
  players: ResultPlayer[];
  /** When this copy was saved (newer copies win when syncing between devices). */
  savedAt?: number;
  /** Generated demo history rather than a round that was actually played. */
  sample?: boolean;
}

export interface ResultPlayer {
  id: string;
  name: string;
  isBot: boolean;
  team: number | null;
  progress: PlayerProgress;
}

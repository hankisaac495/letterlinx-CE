import type { Board, DisplaySettings, RoundDuration, TargetWord, WordSetDraft } from "@/lib/game";
import type { ClassInfo } from "@/lib/roster";

export type RoomPhase = "lobby" | "countdown" | "playing" | "paused" | "ended";

export interface RoundSettings {
  display: DisplaySettings;
  duration: RoundDuration;
  teamMode: boolean;
  /** 2–6 */
  teamCount: number;
}

/** Everything needed to play: sent to every student. */
export interface RoundConfig {
  title: string;
  board: Board;
  words: TargetWord[];
  settings: RoundSettings;
  /** Kept so the host can start a rematch on a fresh board. */
  draft: WordSetDraft;
  wordSetId: string | null;
  sectionId: string | null;
  /** The class playing (name and roster travel with the round, so student devices need no roster access). */
  classInfo?: ClassInfo | null;
  /** Teacher who launched the round (for reports). */
  teacherId?: string | null;
}

export interface FoundSummary {
  wordId: number;
  elapsedMs: number;
  points: number;
  hintPenalty: boolean;
}

export interface HintSummary {
  wordId: number;
  elapsedMs: number;
}

export type PlayerStatus = "playing" | "complete" | "timeUp" | "ended";

/** A student's progress, reported by their device (or generated for a bot). */
export interface PlayerProgress {
  score: number;
  found: FoundSummary[];
  hints: HintSummary[];
  misses: number;
  status: PlayerStatus;
  finishedMs: number | null;
}

export interface Player {
  id: string;
  name: string;
  team: number | null;
  isBot: boolean;
  joinedAt: number;
  progress: PlayerProgress;
}

export interface FeedItem {
  id: string;
  playerId: string;
  wordId: number;
  elapsedMs: number;
}

export interface RoomClock {
  /** Absolute ms when play begins (after the countdown). Null in the lobby. */
  startAt: number | null;
  pausedAt: number | null;
  pausedTotalMs: number;
  endedAt: number | null;
}

export interface ProjectorView {
  hideNames: boolean;
  hideLeaderboard: boolean;
}

export interface RoomState {
  code: string;
  round: RoundConfig;
  phase: RoomPhase;
  clock: RoomClock;
  players: Player[];
  feed: FeedItem[];
  view: ProjectorView;
  createdAt: number;
  /** Increments with each rematch so clients can reset. */
  roundNumber: number;
}

/** What students receive. Omits host-only details. */
export interface RoomSnapshot {
  code: string;
  roundNumber: number;
  phase: RoomPhase;
  clock: RoomClock;
  round: Omit<RoundConfig, "draft">;
  players: { id: string; name: string; team: number | null }[];
  /** Only when ended: final standings. */
  standings: Standing[] | null;
  hostNow: number;
}

export interface Standing {
  rank: number;
  playerId: string;
  name: string;
  team: number | null;
  score: number;
  found: number;
  finishedMs: number | null;
}

// --- Messages ---------------------------------------------------------------

export interface HelloPayload {
  playerId: string;
  name: string;
}

export interface WelcomePayload {
  playerId: string;
  progress: PlayerProgress | null;
}

export interface ProgressPayload {
  playerId: string;
  roundNumber: number;
  progress: PlayerProgress;
}

/** Announced on a section's channel so badge sign-ins can find the open room. */
export interface RoomOpenPayload {
  code: string;
  sectionId: string;
  title: string;
}

export const MSG = {
  /** Student → host: send me a snapshot (before choosing a name). */
  peek: "peek",
  /** Student → section channel: is there an open room for my class? */
  whereRoom: "whereRoom",
  roomOpen: "roomOpen",
  hello: "hello",
  welcome: "welcome",
  snapshot: "snapshot",
  progress: "progress",
  leave: "leave",
} as const;

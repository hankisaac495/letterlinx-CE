/**
 * Pure host-side room logic. The projector tab owns a RoomState and updates it
 * only through these functions; students receive snapshots.
 */
import type { RoundDuration } from "@/lib/game";
import type {
  FeedItem,
  Player,
  PlayerProgress,
  RoomSnapshot,
  RoomState,
  RoundConfig,
  Standing,
} from "./types";

export const COUNTDOWN_MS = 3000;
export const FEED_LIMIT = 30;
export const MIN_TEAMS = 2;
export const MAX_TEAMS = 6;

export const emptyProgress = (): PlayerProgress => ({
  score: 0,
  found: [],
  hints: [],
  misses: 0,
  status: "playing",
  finishedMs: null,
});

export function createRoom(code: string, round: RoundConfig, now: number): RoomState {
  return {
    code,
    round,
    phase: "lobby",
    clock: { startAt: null, pausedAt: null, pausedTotalMs: 0, endedAt: null },
    players: [],
    feed: [],
    view: { hideNames: false, hideLeaderboard: false },
    createdAt: now,
    roundNumber: 1,
  };
}

// --- Clock ------------------------------------------------------------------

/** Round time elapsed (excludes pauses). Negative during the countdown. */
export function gameElapsedMs(clock: RoomState["clock"], now: number): number {
  if (clock.startAt === null) return 0;
  const end = clock.endedAt ?? clock.pausedAt ?? now;
  return end - clock.startAt - clock.pausedTotalMs;
}

export function durationMs(duration: RoundDuration): number | null {
  return duration === "untimed" ? null : duration * 1000;
}

export function timeRemainingMs(room: RoomState, now: number): number | null {
  const total = durationMs(room.round.settings.duration);
  if (total === null) return null;
  return Math.max(0, total - Math.max(0, gameElapsedMs(room.clock, now)));
}

/** Moves countdown → playing once the start time has passed. */
export function advancePhase(room: RoomState, now: number): RoomState {
  if (room.phase === "countdown" && room.clock.startAt !== null && now >= room.clock.startAt) {
    return { ...room, phase: "playing" };
  }
  return room;
}

// --- Players ----------------------------------------------------------------

function teamSizes(room: RoomState): number[] {
  const sizes = new Array(room.round.settings.teamCount).fill(0);
  for (const p of room.players) if (p.team !== null) sizes[p.team]++;
  return sizes;
}

function smallestTeam(room: RoomState): number {
  const sizes = teamSizes(room);
  return sizes.indexOf(Math.min(...sizes));
}

export function addPlayer(
  room: RoomState,
  player: { id: string; name: string; isBot?: boolean },
  now: number,
): RoomState {
  const existing = room.players.find((p) => p.id === player.id);
  if (existing) {
    // Rejoin (e.g. a reloaded tab): keep progress, update the name.
    return {
      ...room,
      players: room.players.map((p) => (p.id === player.id ? { ...p, name: player.name } : p)),
    };
  }
  const team = room.round.settings.teamMode ? smallestTeam(room) : null;
  return {
    ...room,
    players: [
      ...room.players,
      {
        id: player.id,
        name: player.name,
        isBot: !!player.isBot,
        team,
        joinedAt: now,
        progress: emptyProgress(),
      },
    ],
  };
}

export function removePlayer(room: RoomState, playerId: string): RoomState {
  return { ...room, players: room.players.filter((p) => p.id !== playerId) };
}

/** Even round-robin split in join order. */
export function assignTeams(room: RoomState): RoomState {
  const { teamMode, teamCount } = room.round.settings;
  return {
    ...room,
    players: room.players.map((p, i) => ({ ...p, team: teamMode ? i % teamCount : null })),
  };
}

/**
 * Merges a player's reported progress. Returns new feed items for words they
 * hadn't reported before.
 */
export function applyProgress(
  room: RoomState,
  playerId: string,
  progress: PlayerProgress,
): RoomState {
  const player = room.players.find((p) => p.id === playerId);
  if (!player || room.phase === "lobby") return room;
  const known = new Set(player.progress.found.map((f) => f.wordId));
  const newFinds: FeedItem[] = progress.found
    .filter((f) => !known.has(f.wordId))
    .map((f) => ({
      id: `${playerId}:${f.wordId}`,
      playerId,
      wordId: f.wordId,
      elapsedMs: f.elapsedMs,
    }));
  return {
    ...room,
    players: room.players.map((p) => (p.id === playerId ? { ...p, progress } : p)),
    feed: [...newFinds, ...room.feed].slice(0, FEED_LIMIT),
  };
}

// --- Round control ----------------------------------------------------------

export function startRound(room: RoomState, now: number): RoomState {
  if (room.phase !== "lobby") return room;
  const assigned = assignTeams(room);
  return {
    ...assigned,
    phase: "countdown",
    clock: { startAt: now + COUNTDOWN_MS, pausedAt: null, pausedTotalMs: 0, endedAt: null },
    players: assigned.players.map((p) => ({ ...p, progress: emptyProgress() })),
    feed: [],
  };
}

export function pauseRound(room: RoomState, now: number): RoomState {
  if (room.phase !== "playing") return room;
  return { ...room, phase: "paused", clock: { ...room.clock, pausedAt: now } };
}

export function resumeRound(room: RoomState, now: number): RoomState {
  if (room.phase !== "paused" || room.clock.pausedAt === null) return room;
  return {
    ...room,
    phase: "playing",
    clock: {
      ...room.clock,
      pausedTotalMs: room.clock.pausedTotalMs + (now - room.clock.pausedAt),
      pausedAt: null,
    },
  };
}

export function endRound(room: RoomState, now: number): RoomState {
  if (room.phase === "ended" || room.phase === "lobby") return room;
  const { clock } = room;
  // Close any pause so elapsed time stays correct.
  const pausedTotalMs =
    clock.pausedAt !== null ? clock.pausedTotalMs + (now - clock.pausedAt) : clock.pausedTotalMs;
  let endedAt = now;
  const total = durationMs(room.round.settings.duration);
  if (total !== null && clock.startAt !== null) {
    endedAt = Math.min(now, clock.startAt + pausedTotalMs + total);
  }
  return { ...room, phase: "ended", clock: { ...clock, pausedAt: null, pausedTotalMs, endedAt } };
}

/** True when the timer ran out, or (any round) every player has found every word. */
export function shouldEnd(room: RoomState, now: number): boolean {
  if (room.phase !== "playing") return false;
  const remaining = timeRemainingMs(room, now);
  if (remaining !== null && remaining <= 0) return true;
  return room.players.length > 0 && room.players.every((p) => p.progress.status === "complete");
}

/** Back to the lobby with the same players, a fresh board and cleared scores. */
export function rematch(room: RoomState, round: RoundConfig): RoomState {
  return {
    ...room,
    round,
    phase: "lobby",
    clock: { startAt: null, pausedAt: null, pausedTotalMs: 0, endedAt: null },
    players: room.players.map((p) => ({ ...p, progress: emptyProgress() })),
    feed: [],
    roundNumber: room.roundNumber + 1,
  };
}

// --- Derived views ----------------------------------------------------------

export function standings(room: RoomState): Standing[] {
  const sorted = [...room.players].sort(
    (a, b) =>
      b.progress.score - a.progress.score ||
      b.progress.found.length - a.progress.found.length ||
      (a.progress.finishedMs ?? Infinity) - (b.progress.finishedMs ?? Infinity) ||
      a.joinedAt - b.joinedAt,
  );
  let rank = 0;
  let prevScore: number | null = null;
  return sorted.map((p, i) => {
    if (p.progress.score !== prevScore) rank = i + 1;
    prevScore = p.progress.score;
    return {
      rank,
      playerId: p.id,
      name: p.name,
      team: p.team,
      score: p.progress.score,
      found: p.progress.found.length,
      finishedMs: p.progress.finishedMs,
    };
  });
}

export interface TeamStanding {
  team: number;
  score: number;
  members: number;
  found: number;
}

export function teamStandings(room: RoomState): TeamStanding[] {
  const teams: TeamStanding[] = Array.from(
    { length: room.round.settings.teamCount },
    (_, team) => ({
      team,
      score: 0,
      members: 0,
      found: 0,
    }),
  );
  for (const p of room.players) {
    if (p.team === null) continue;
    teams[p.team].score += p.progress.score;
    teams[p.team].members += 1;
    teams[p.team].found += p.progress.found.length;
  }
  return teams.sort((a, b) => b.score - a.score || a.team - b.team);
}

export interface WordStat {
  wordId: number;
  foundBy: number;
  /** 0–1 share of players who found it. */
  share: number;
  avgMs: number | null;
  hints: number;
}

export function wordStats(room: RoomState): WordStat[] {
  const n = room.players.length;
  return room.round.words.map((w) => {
    const times = room.players.flatMap((p) =>
      p.progress.found.filter((f) => f.wordId === w.id).map((f) => f.elapsedMs),
    );
    const hints = room.players.reduce(
      (s, p) => s + p.progress.hints.filter((h) => h.wordId === w.id).length,
      0,
    );
    return {
      wordId: w.id,
      foundBy: times.length,
      share: n ? times.length / n : 0,
      avgMs: times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null,
      hints,
    };
  });
}

/** Most- and least-found words (ties broken by speed). */
export function extremes(stats: WordStat[]): { most: WordStat | null; least: WordStat | null } {
  if (stats.length === 0) return { most: null, least: null };
  const sorted = [...stats].sort(
    (a, b) => b.foundBy - a.foundBy || (a.avgMs ?? Infinity) - (b.avgMs ?? Infinity),
  );
  return { most: sorted[0], least: sorted[sorted.length - 1] };
}

export function totalHints(room: RoomState): number {
  return room.players.reduce((s, p) => s + p.progress.hints.length, 0);
}

/**
 * One-at-a-time mode: how many players are on each word (index = word position),
 * plus how many have finished.
 */
export function wordProgressDistribution(room: RoomState): { onWord: number[]; done: number } {
  const onWord = new Array(room.round.words.length).fill(0);
  let done = 0;
  for (const p of room.players) {
    const k = p.progress.found.length;
    if (k >= room.round.words.length) done++;
    else onWord[k]++;
  }
  return { onWord, done };
}

export function toSnapshot(room: RoomState, now: number): RoomSnapshot {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { draft, ...round } = room.round;
  return {
    code: room.code,
    roundNumber: room.roundNumber,
    phase: room.phase,
    clock: room.clock,
    round,
    players: room.players.map((p) => ({ id: p.id, name: p.name, team: p.team })),
    standings: room.phase === "ended" ? standings(room) : null,
    hostNow: now,
  };
}

export function findPlayer(room: RoomState, id: string): Player | undefined {
  return room.players.find((p) => p.id === id);
}

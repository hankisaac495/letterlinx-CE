"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createRng, randomSeed } from "@/lib/game";
import {
  addPlayer,
  advancePhase,
  applyProgress,
  botNames,
  botProgress,
  createRoom,
  endRound,
  gameElapsedMs,
  generateRoomCode,
  pauseRound,
  planBot,
  rematch,
  removePlayer,
  resumeRound,
  shouldEnd,
  startRound,
  type BotPlan,
  type PlayerProgress,
  type ProjectorView,
  type RoomState,
  type RoundConfig,
} from "@/lib/live";
import { toRoundResult } from "@/lib/reports";
import { newId } from "@/lib/util/id";
import { useReportStore } from "./reportStore";
import { createHydrationHook } from "./hydration";

interface HostState {
  room: RoomState | null;
  botPlans: Record<string, BotPlan>;
  open(round: RoundConfig): string;
  close(): void;
  join(id: string, name: string): void;
  leave(id: string): void;
  report(id: string, progress: PlayerProgress, roundNumber: number): void;
  /** Adds simulated students; uses `candidates` (e.g. the class roster) when given. */
  addBots(count: number, candidates?: { id: string; name: string }[]): void;
  start(): void;
  pause(): void;
  resume(): void;
  end(): void;
  setView(patch: Partial<ProjectorView>): void;
  rematch(round: RoundConfig): void;
  /** Called a few times a second: countdown → playing, bots, timer end. */
  tick(): void;
}

const rng = () => createRng(randomSeed());

/** The projector tab's authoritative room (persisted so a reload resumes it). */
export const useHostStore = create<HostState>()(
  persist(
    (set, get) => {
      const update = (fn: (room: RoomState) => RoomState) => {
        const { room } = get();
        if (!room) return;
        const next = fn(room);
        if (next === room) return;
        set({ room: next });
        // Save finished rounds for reports (and refresh if late progress arrives).
        if (next.phase === "ended" && next.players.length > 0) {
          const result = toRoundResult(next);
          if (result) {
            // Load saved reports first so recording never overwrites them.
            const reports = useReportStore.persist;
            if (reports.hasHydrated()) useReportStore.getState().record(result);
            else
              void Promise.resolve(reports.rehydrate()).then(() =>
                useReportStore.getState().record(result),
              );
          }
        }
      };
      const planFor = (room: RoomState, offsetMs: number) => planBot(room.round, rng(), offsetMs);

      return {
        room: null,
        botPlans: {},
        open: (round) => {
          const code = generateRoomCode();
          set({ room: createRoom(code, round, Date.now()), botPlans: {} });
          return code;
        },
        close: () => set({ room: null, botPlans: {} }),
        join: (id, name) => update((r) => addPlayer(r, { id, name }, Date.now())),
        leave: (id) => update((r) => removePlayer(r, id)),
        report: (id, progress, roundNumber) =>
          update((r) => (r.roundNumber === roundNumber ? applyProgress(r, id, progress) : r)),
        addBots: (count, candidates) => {
          const { room } = get();
          if (!room) return;
          const joined = new Set(room.players.map((p) => p.id));
          const people = candidates
            ? candidates.filter((c) => !joined.has(c.id)).slice(0, count)
            : botNames(count, rng(), new Set(room.players.map((p) => p.name))).map((name) => ({
                id: newId("bot"),
                name,
              }));
          const now = Date.now();
          let next = room;
          const plans = { ...get().botPlans };
          const offset = Math.max(0, gameElapsedMs(room.clock, now));
          for (const { id, name } of people) {
            next = addPlayer(next, { id, name, isBot: true }, now);
            if (room.phase !== "lobby") plans[id] = planFor(next, offset);
          }
          set({ room: next, botPlans: plans });
        },
        start: () => {
          const { room } = get();
          if (!room || room.phase !== "lobby") return;
          const next = startRound(room, Date.now());
          const plans: Record<string, BotPlan> = {};
          for (const p of next.players) if (p.isBot) plans[p.id] = planFor(next, 0);
          set({ room: next, botPlans: plans });
        },
        pause: () => update((r) => pauseRound(r, Date.now())),
        resume: () => update((r) => resumeRound(r, Date.now())),
        end: () => update((r) => endRound(r, Date.now())),
        setView: (patch) => update((r) => ({ ...r, view: { ...r.view, ...patch } })),
        rematch: (round) => {
          update((r) => rematch(r, round));
          set({ botPlans: {} });
        },
        tick: () => {
          const now = Date.now();
          const { botPlans } = get();
          update((room) => {
            let r = advancePhase(room, now);
            if (r.phase === "playing") {
              const elapsed = gameElapsedMs(r.clock, now);
              for (const p of r.players) {
                const plan = botPlans[p.id];
                if (!plan) continue;
                const progress = botProgress(plan, r.round, elapsed);
                if (
                  progress.found.length !== p.progress.found.length ||
                  progress.hints.length !== p.progress.hints.length
                ) {
                  r = applyProgress(r, p.id, progress);
                }
              }
              if (shouldEnd(r, now)) r = endRound(r, now);
            }
            return r;
          });
        },
      };
    },
    {
      name: "llce:host-room",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ room: s.room, botPlans: s.botPlans }),
      skipHydration: true,
    },
  ),
);

export const useHostReady = createHydrationHook(() => useHostStore.persist);

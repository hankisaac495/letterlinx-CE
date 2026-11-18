"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { RoomState } from "@/lib/live";
import { useOrigin } from "@/hooks/useOrigin";
import { useT, type MessageKey } from "@/lib/i18n";
import { getRosterProvider } from "@/lib/roster";
import { useHostStore } from "@/store/hostStore";
import { displayName } from "./format";

const MODE: Record<string, MessageKey> = {
  list: "proj.modeList",
  oneAtATime: "proj.modeOne",
  hidden: "proj.modeHidden",
};

export function Lobby({ room, onSimulate }: { room: RoomState; onSimulate(): void }) {
  const t = useT();
  const origin = useOrigin();
  const reduceMotion = useReducedMotion();
  const start = useHostStore((s) => s.start);
  const transport = useHostStore((s) => s.transport);
  const { settings } = room.round;
  const joinUrl = `${origin}/join`;
  const section = room.round.sectionId
    ? getRosterProvider().data.sections.find((s) => s.id === room.round.sectionId)
    : undefined;

  return (
    <div className="grid min-h-0 flex-1 gap-8 overflow-auto p-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <section className="flex flex-col justify-center gap-6">
        <p className="text-3xl font-bold text-white/70">
          {t("proj.goTo")}{" "}
          <span className="font-black text-white">{joinUrl.replace(/^https?:\/\//, "")}</span>
        </p>
        <div>
          <p className="text-2xl font-bold text-white/70">
            {section ? t("proj.enterCodeBadge") : t("proj.enterCode")}
          </p>
          <div
            className="mt-3 flex gap-3"
            aria-label={t("proj.roomCode", { code: room.code.split("").join(" ") })}
            data-testid="room-code"
          >
            {room.code.split("").map((ch, i) => (
              <span
                key={i}
                aria-hidden="true"
                className="flex aspect-square w-[min(12vh,7vw)] items-center justify-center rounded-2xl bg-amber-400 text-[min(8vh,4.6vw)] font-black text-amber-950 shadow-[inset_0_-0.6vh_0_rgba(0,0,0,0.25)]"
              >
                {ch}
              </span>
            ))}
          </div>
        </div>
        <div data-testid="sync-status" data-transport={transport ?? "connecting"}>
          {transport === "network" ? (
            <p className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-base font-bold text-emerald-300">
              <span className="size-2 rounded-full bg-emerald-400" aria-hidden="true" />
              {t("sync.network")}
            </p>
          ) : transport === "local" ? (
            <div className="flex flex-col gap-1">
              <p className="inline-flex w-fit items-center gap-2 rounded-full bg-amber-400/15 px-3 py-1 text-base font-bold text-amber-200">
                <span className="size-2 rounded-full bg-amber-300" aria-hidden="true" />
                {t("sync.local")}
              </p>
              <p className="text-sm text-white/50">{t("sync.localHelp")}</p>
            </div>
          ) : (
            <p className="text-base text-white/50">{t("sync.connecting")}</p>
          )}
        </div>
        <dl className="flex flex-wrap gap-x-8 gap-y-2 text-xl text-white/70">
          <div>
            <dt className="sr-only">{t("proj.wordSet")}</dt>
            <dd className="font-bold text-white">{room.round.title}</dd>
          </div>
          <div>
            <dt className="sr-only">{t("proj.display")}</dt>
            <dd>
              {t(MODE[settings.display.mode])}
              {settings.display.showClues ? t("proj.withClues") : ""}
              {settings.display.allowHints && settings.display.mode === "hidden"
                ? t("proj.withHints")
                : ""}
            </dd>
          </div>
          <div>
            <dt className="sr-only">{t("common.timer")}</dt>
            <dd>
              {settings.duration === "untimed"
                ? t("common.untimed")
                : t("common.seconds", { n: settings.duration })}
            </dd>
          </div>
          {settings.teamMode && (
            <div>
              <dt className="sr-only">{t("proj.teams")}</dt>
              <dd>{t("proj.teamsCount", { count: settings.teamCount })}</dd>
            </div>
          )}
        </dl>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={start}
            disabled={room.players.length === 0}
            className="rounded-2xl bg-emerald-500 px-8 py-4 text-2xl font-black text-emerald-950 shadow-lg transition hover:bg-emerald-400 focus-visible:ring-4 focus-visible:ring-emerald-300/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
          >
            {t("common.startRound")}
          </button>
          <button
            type="button"
            onClick={onSimulate}
            className="rounded-2xl bg-white/10 px-6 py-4 text-xl font-bold hover:bg-white/20 focus-visible:ring-4 focus-visible:ring-sky-400/50 focus-visible:outline-none"
          >
            {t("proj.simulate")}
          </button>
          <a
            href={`/join?code=${room.code}`}
            target="_blank"
            rel="noopener"
            className="rounded-2xl bg-white/10 px-6 py-4 text-xl font-bold hover:bg-white/20 focus-visible:ring-4 focus-visible:ring-sky-400/50 focus-visible:outline-none"
          >
            {t("proj.openStudentTab")}
          </a>
        </div>
      </section>

      <section
        className="flex min-h-0 flex-col rounded-3xl bg-white/5 p-6"
        aria-labelledby="joined-heading"
      >
        <h2 id="joined-heading" className="text-3xl font-black">
          <span data-testid="player-count">{room.players.length}</span>
          {section ? t("proj.ofTotal", { total: section.students.length }) : ""}
          {room.players.length === 1 && !section
            ? t("proj.studentJoinedSuffix")
            : t("proj.studentsJoinedSuffix")}
        </h2>
        {section && (
          <p className="mt-1 text-xl text-white/60">
            {t("proj.sectionPeriod", { name: section.name, period: section.period })}
          </p>
        )}
        {room.players.length === 0 ? (
          <p className="mt-4 text-xl text-white/50">{t("proj.namesPopIn")}</p>
        ) : (
          <ul
            className="mt-5 flex flex-wrap content-start gap-3 overflow-hidden"
            aria-live="polite"
          >
            <AnimatePresence>
              {room.players.map((p) => (
                <motion.li
                  key={p.id}
                  layout
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 500, damping: 28 }}
                  className="rounded-xl bg-white px-4 py-2 text-2xl font-extrabold text-slate-900"
                  data-testid="lobby-player"
                >
                  {displayName(room, p)}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </section>
    </div>
  );
}

"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { PlayGame, type LiveRoundInfo } from "@/components/game/PlayGame";
import { btn, card, input } from "@/components/ui/styles";
import { useNow } from "@/hooks/useNow";
import { useStudents } from "@/hooks/useRoster";
import { useStudentRoom } from "@/hooks/useStudentRoom";
import { studentDisplayName } from "@/lib/roster";
import {
  formatStudentName,
  isValidRoomCode,
  normalizeRoomCode,
  peekRoom,
  ROOM_CODE_LENGTH,
  TEAM_NAMES,
  type RoomSnapshot,
} from "@/lib/live";

function CodeStep({
  initialCode,
  onFound,
}: {
  initialCode: string;
  onFound(code: string, snapshot: RoomSnapshot): void;
}) {
  const [code, setCode] = useState(initialCode);
  const [submitted, setSubmitted] = useState(false);
  const [checking, setChecking] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const normalized = normalizeRoomCode(code);
  const codeError = !isValidRoomCode(normalized)
    ? `Enter the ${ROOM_CODE_LENGTH}-character code on the projector.`
    : null;

  return (
    <form
      className={`${card} mx-auto mt-8 flex w-full max-w-sm flex-col gap-5 p-6`}
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        setSubmitted(true);
        if (codeError) return;
        setChecking(true);
        setNotFound(false);
        const snapshot = await peekRoom(normalized);
        setChecking(false);
        if (snapshot) onFound(normalized, snapshot);
        else setNotFound(true);
      }}
    >
      <div>
        <h1 className="text-2xl font-black">Join a round</h1>
        <p className="mt-1 text-sm text-slate-500">Use the room code on your teacher’s screen.</p>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="join-code" className="text-sm font-bold">
          Room code
        </label>
        <input
          id="join-code"
          className={`${input} text-center text-2xl font-black tracking-[0.3em] uppercase`}
          value={code}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={ROOM_CODE_LENGTH + 2}
          aria-invalid={submitted && !!codeError}
          onChange={(e) => setCode(e.target.value)}
        />
        {submitted && codeError && (
          <p className="text-sm font-semibold text-rose-700">{codeError}</p>
        )}
      </div>
      {notFound && (
        <p
          className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800"
          role="status"
        >
          We couldn’t find that room. Check the code, and make sure the projector screen is open.
        </p>
      )}
      <button type="submit" className={btn.primary} disabled={checking}>
        {checking ? "Checking…" : "Next"}
      </button>
      <div className="flex items-center gap-3 text-xs font-semibold text-slate-400 uppercase">
        <span className="h-px flex-1 bg-slate-200" /> or{" "}
        <span className="h-px flex-1 bg-slate-200" />
      </div>
      <Link href="/join/badge" className={btn.secondary}>
        Log in with Clever badge
      </Link>
    </form>
  );
}

function NamePicker({
  snapshot,
  onPick,
  onBack,
}: {
  snapshot: RoomSnapshot;
  onPick(name: string, rosterId: string): void;
  onBack(): void;
}) {
  const { data: students } = useStudents(snapshot.round.sectionId);
  const joined = new Set(snapshot.players.map((p) => p.id));
  return (
    <div className={`${card} mx-auto mt-8 flex w-full max-w-lg flex-col gap-4 p-6`}>
      <div>
        <p className="text-sm font-semibold text-slate-500">{snapshot.round.title}</p>
        <h1 className="text-2xl font-black">Tap your name</h1>
      </div>
      {!students ? (
        <p className="text-slate-500">Loading your class…</p>
      ) : (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3" aria-label="Class list">
          {students.map((s) => {
            const name = studentDisplayName(s);
            const taken = joined.has(s.id);
            return (
              <li key={s.id}>
                <button
                  type="button"
                  disabled={taken}
                  onClick={() => onPick(name, s.id)}
                  className="w-full rounded-xl bg-white px-3 py-3 text-left font-extrabold ring-1 ring-slate-300 transition hover:bg-blue-50 hover:ring-blue-400 focus-visible:ring-4 focus-visible:ring-blue-200 focus-visible:outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:ring-slate-200"
                >
                  {name}
                  {taken && <span className="block text-xs font-semibold">already joined</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <button type="button" className={`${btn.ghost} self-start`} onClick={onBack}>
        ← Different code
      </button>
    </div>
  );
}

function NameStep({ onJoin, onBack }: { onJoin(name: string): void; onBack(): void }) {
  const [first, setFirst] = useState("");
  const [initial, setInitial] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const nameError = !first.trim()
    ? "Enter your first name."
    : !/^\p{L}$/u.test(initial.trim())
      ? "Enter the first letter of your last name."
      : null;
  return (
    <form
      className={`${card} mx-auto mt-8 flex w-full max-w-sm flex-col gap-5 p-6`}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
        if (!nameError) onJoin(formatStudentName(first, initial));
      }}
    >
      <h1 className="text-2xl font-black">What’s your name?</h1>
      <div className="grid grid-cols-[1fr_6rem] gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="join-first" className="text-sm font-bold">
            First name
          </label>
          <input
            id="join-first"
            className={input}
            value={first}
            maxLength={20}
            autoComplete="off"
            aria-invalid={submitted && !first.trim()}
            onChange={(e) => setFirst(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="join-initial" className="text-sm font-bold">
            Last initial
          </label>
          <input
            id="join-initial"
            className={`${input} text-center uppercase`}
            value={initial}
            maxLength={1}
            autoComplete="off"
            onChange={(e) => setInitial(e.target.value)}
          />
        </div>
      </div>
      {submitted && nameError && (
        <p className="-mt-3 text-sm font-semibold text-rose-700">{nameError}</p>
      )}
      <p className="-mt-2 text-xs text-slate-500">
        Only your first name and last initial are shown.
      </p>
      <button type="submit" className={btn.primary}>
        Join
      </button>
      <button type="button" className={`${btn.ghost} self-start`} onClick={onBack}>
        ← Different code
      </button>
    </form>
  );
}

function JoinFlow({
  initialCode,
  onJoin,
}: {
  initialCode: string;
  onJoin(code: string, name: string, id?: string): void;
}) {
  const [found, setFound] = useState<{ code: string; snapshot: RoomSnapshot } | null>(null);
  if (!found)
    return (
      <CodeStep
        initialCode={initialCode}
        onFound={(code, snapshot) => setFound({ code, snapshot })}
      />
    );
  if (found.snapshot.round.sectionId) {
    return (
      <NamePicker
        snapshot={found.snapshot}
        onPick={(name, id) => onJoin(found.code, name, id)}
        onBack={() => setFound(null)}
      />
    );
  }
  return <NameStep onJoin={(name) => onJoin(found.code, name)} onBack={() => setFound(null)} />;
}

function Lobby({
  snapshot,
  name,
  onLeave,
}: {
  snapshot: RoomSnapshot;
  name: string;
  onLeave(): void;
}) {
  return (
    <div
      className={`${card} mx-auto mt-8 flex w-full max-w-sm flex-col items-center gap-4 p-8 text-center`}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex size-16 items-center justify-center rounded-full bg-emerald-100 text-3xl"
        aria-hidden="true"
      >
        ✓
      </motion.div>
      <div>
        <p className="text-sm font-semibold tracking-widest text-slate-500 uppercase">You’re in</p>
        <h1 className="mt-1 text-3xl font-black" data-testid="lobby-name">
          {name}
        </h1>
      </div>
      <p className="text-slate-600">
        <strong>{snapshot.round.title}</strong> starts when your teacher is ready. Keep this screen
        open.
      </p>
      <p className="text-sm text-slate-500" aria-live="polite">
        {snapshot.players.length} {snapshot.players.length === 1 ? "student" : "students"} joined
      </p>
      <button type="button" className={btn.ghost} onClick={onLeave}>
        Not you? Leave
      </button>
    </div>
  );
}

export function StudentJoin() {
  const params = useSearchParams();
  const { status, identity, snapshot, skewMs, join, leave } = useStudentRoom();
  const live = status === "joined" && snapshot && identity;
  const realNow = useNow(!!live && snapshot.phase === "countdown", 200);

  let content: React.ReactNode;
  if (!live) {
    content =
      status === "connecting" ? (
        <p className="mt-10 text-center text-slate-500" role="status">
          Joining…
        </p>
      ) : (
        <>
          <JoinFlow
            initialCode={normalizeRoomCode(params.get("code") ?? identity?.code ?? "")}
            onJoin={join}
          />
          {status === "notFound" && (
            <p
              className="mx-auto mt-3 max-w-sm text-center text-sm font-semibold text-rose-700"
              role="status"
            >
              The round closed before you joined. Check the code and try again.
            </p>
          )}
        </>
      );
  } else if (snapshot.phase === "lobby") {
    content = <Lobby snapshot={snapshot} name={identity.name} onLeave={leave} />;
  } else {
    const me = snapshot.players.find((p) => p.id === identity.playerId);
    const info: LiveRoundInfo = {
      phase: snapshot.phase,
      countdownMs:
        snapshot.phase === "countdown" && snapshot.clock.startAt !== null
          ? snapshot.clock.startAt - (realNow + skewMs)
          : null,
      standing: snapshot.standings?.find((s) => s.playerId === identity.playerId) ?? null,
      totalPlayers: snapshot.players.length,
      teamName: me?.team != null ? TEAM_NAMES[me.team] : null,
    };
    content = (
      <PlayGame title={`${snapshot.round.title} · ${identity.name}`} onExit={leave} live={info} />
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={live ? `${snapshot.phase === "lobby" ? "lobby" : "game"}` : "form"}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="flex flex-1 flex-col px-4"
      >
        {content}
      </motion.div>
    </AnimatePresence>
  );
}

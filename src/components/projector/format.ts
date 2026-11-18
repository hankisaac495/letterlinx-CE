import { nicknameFor, type Player, type RoomState } from "@/lib/live";

export function displayName(room: RoomState, player: Pick<Player, "id" | "name">): string {
  return room.view.hideNames ? nicknameFor(player.id) : player.name;
}

/** Whether the projector may show target words right now (never before the end in hidden/clue modes). */
export function canRevealWords(room: RoomState): boolean {
  if (room.phase === "ended") return true;
  const { mode, showClues } = room.round.settings.display;
  return mode !== "hidden" && !showClues;
}

export function wordLabel(room: RoomState, wordId: number): string {
  const word = room.round.words.find((w) => w.id === wordId);
  if (!word) return "";
  return canRevealWords(room) ? word.display : `word ${wordId + 1}`;
}

export function formatMs(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export function formatSeconds(ms: number | null): string {
  return ms === null ? "—" : `${(ms / 1000).toFixed(1)} s`;
}

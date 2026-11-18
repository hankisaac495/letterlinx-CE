/**
 * Student-side helpers that talk to a room before joining it.
 */
import { createSyncProvider, SYNC_TIMING } from "@/lib/sync";
import { newId } from "@/lib/util/id";
import { MSG, type RoomOpenPayload, type RoomSnapshot } from "./types";

export const sectionChannel = (sectionId: string) => `section-${sectionId}`;

/** Fetches a room's snapshot without joining. Resolves null if no host answers. */
export async function peekRoom(code: string): Promise<RoomSnapshot | null> {
  const provider = createSyncProvider();
  await provider.joinRoom(code, newId("peek"));
  try {
    return await new Promise<RoomSnapshot | null>((resolve) => {
      const timer = setTimeout(() => resolve(null), SYNC_TIMING[provider.transport].joinTimeoutMs);
      provider.subscribe((m) => {
        if (m.type === MSG.snapshot) {
          clearTimeout(timer);
          resolve(m.payload as RoomSnapshot);
        }
      });
      provider.broadcast(MSG.peek, {});
    });
  } finally {
    await provider.leaveRoom();
  }
}

/**
 * Listens on a class's channel for an open room (asks once, then waits for the
 * host's periodic announcements). Returns a function that stops watching.
 */
export function watchSectionRoom(
  sectionId: string,
  onFound: (room: RoomOpenPayload) => void,
): () => void {
  const provider = createSyncProvider();
  let stopped = false;
  void provider.joinRoom(sectionChannel(sectionId), newId("badge")).then(() => {
    if (stopped) return;
    provider.subscribe((m) => {
      if (m.type === MSG.roomOpen && !stopped) onFound(m.payload as RoomOpenPayload);
    });
    provider.broadcast(MSG.whereRoom, { sectionId });
  });
  return () => {
    stopped = true;
    void provider.leaveRoom();
  };
}

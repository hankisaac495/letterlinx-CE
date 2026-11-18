"use client";

import { useEffect, useRef } from "react";
import { timeRemainingMs, type RoomState } from "@/lib/live";
import { useSfx } from "@/store/soundStore";
import { useNow } from "./useNow";

/** Minimum gap between find chimes so a busy class doesn't become a wall of sound. */
const FIND_CHIME_GAP_MS = 450;

/** Projector sounds: find chimes, last-10-seconds tick, round-end flourish. */
export function useProjectorSounds(room: RoomState | null) {
  const play = useSfx("projector");
  const now = useNow(room?.phase === "playing", 250);
  const remaining = room && room.phase === "playing" ? timeRemainingMs(room, now) : null;
  const secsLeft = remaining === null ? null : Math.ceil(remaining / 1000);

  useEffect(() => {
    if (secsLeft !== null && secsLeft > 0 && secsLeft <= 10) play("tick");
  }, [secsLeft, play]);

  const lastFeed = useRef<string | undefined>(room?.feed[0]?.id);
  const lastChime = useRef(0);
  const newest = room?.feed[0]?.id;
  useEffect(() => {
    if (newest && newest !== lastFeed.current) {
      const t = performance.now();
      if (t - lastChime.current > FIND_CHIME_GAP_MS) {
        play("found");
        lastChime.current = t;
      }
    }
    lastFeed.current = newest;
  }, [newest, play]);

  const lastPhase = useRef(room?.phase);
  const phase = room?.phase;
  useEffect(() => {
    if (phase === "ended" && lastPhase.current && lastPhase.current !== "ended") play("roundEnd");
    lastPhase.current = phase;
  }, [phase, play]);
}

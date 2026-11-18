"use client";

import { sfx } from "@/lib/audio/sfx";
import { useT } from "@/lib/i18n";
import { useSoundReady, useSoundStore, type SoundContext } from "@/store/soundStore";

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="size-5">
      <path d="M3 8h3l4-3.5v11L6 12H3z" fill="currentColor" />
      {muted ? (
        <path
          d="M13 7.5l5 5m0-5l-5 5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M13 7a4 4 0 010 6m2-8.5a7 7 0 010 11"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

/** Mute toggle (and, on the projector, a volume slider). */
export function SoundToggle({ context, dark }: { context: SoundContext; dark?: boolean }) {
  const t = useT();
  const ready = useSoundReady();
  const muted = useSoundStore((s) => (context === "student" ? s.studentMuted : s.projectorMuted));
  const volume = useSoundStore((s) => s.projectorVolume);
  const setMuted = useSoundStore((s) => s.setMuted);
  const setVolume = useSoundStore((s) => s.setProjectorVolume);
  const isMuted = !ready || muted;
  const base = dark
    ? "bg-white/10 text-white hover:bg-white/20 focus-visible:ring-sky-400/50"
    : "text-slate-600 hover:bg-slate-200 focus-visible:ring-slate-300";

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        aria-pressed={!isMuted}
        aria-label={isMuted ? t("sound.turnOn") : t("sound.mute")}
        title={isMuted ? t("sound.turnOn") : t("sound.mute")}
        data-testid={`sound-toggle-${context}`}
        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-bold focus-visible:ring-4 focus-visible:outline-none ${base}`}
        onClick={() => {
          sfx.unlock();
          setMuted(context, !isMuted);
        }}
      >
        <SpeakerIcon muted={isMuted} />
        <span className={dark ? "" : "sr-only sm:not-sr-only"}>
          {isMuted ? t("sound.off") : t("sound.on")}
        </span>
      </button>
      {context === "projector" && !isMuted && (
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          aria-label={t("sound.volume")}
          className="w-20 accent-sky-300"
        />
      )}
    </span>
  );
}

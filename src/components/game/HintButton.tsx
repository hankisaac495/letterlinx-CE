"use client";

import { hintAvailability, type GameState } from "@/lib/game";
import { useT } from "@/lib/i18n";

interface HintButtonProps {
  game: GameState;
  now: number;
  onHint(): void;
}

export function HintButton({ game, now, onHint }: HintButtonProps) {
  const t = useT();
  const a = hintAvailability(game, now);
  if (!a.enabled) return null;
  const left =
    a.remaining === Infinity ? t("game.hintsUnlimited") : t("game.hintsLeft", { n: a.remaining });
  const cooling = a.cooldownMs > 0 && a.remaining > 0;
  return (
    <button
      type="button"
      onClick={onHint}
      disabled={!a.ready}
      data-testid="hint-button"
      className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-4 py-2 text-sm font-extrabold text-amber-950 shadow-sm transition hover:bg-amber-300 focus-visible:ring-4 focus-visible:ring-amber-200 focus-visible:outline-none active:translate-y-px disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
    >
      <svg viewBox="0 0 20 20" aria-hidden="true" className="size-4">
        <path
          fill="currentColor"
          d="M10 2a6 6 0 00-3.5 10.9V15a1 1 0 001 1h5a1 1 0 001-1v-2.1A6 6 0 0010 2zm-2 16h4v.5a1.5 1.5 0 01-3 0V18z"
        />
      </svg>
      {t("game.hint", { left: cooling ? `${Math.ceil(a.cooldownMs / 1000)}s` : left })}
    </button>
  );
}

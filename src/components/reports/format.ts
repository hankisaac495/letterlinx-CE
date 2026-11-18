export const pct = (share: number) => `${Math.round(share * 100)}%`;

export const secs = (ms: number | null) => (ms === null ? "—" : `${(ms / 1000).toFixed(1)} s`);

export function formatDate(ms: number, withTime = false, locale?: string): string {
  return new Date(ms).toLocaleString(locale, {
    month: "short",
    day: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  });
}

export const MODE_LABEL = {
  list: "mode.list",
  oneAtATime: "mode.oneAtATime",
  hidden: "mode.hidden",
} as const;

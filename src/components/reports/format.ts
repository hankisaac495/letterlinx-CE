export const pct = (share: number) => `${Math.round(share * 100)}%`;

export const secs = (ms: number | null) => (ms === null ? "—" : `${(ms / 1000).toFixed(1)} s`);

export function formatDate(ms: number, withTime = false): string {
  return new Date(ms).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  });
}

export const MODE_LABEL = {
  list: "Full list",
  oneAtATime: "One at a time",
  hidden: "Hidden words",
} as const;

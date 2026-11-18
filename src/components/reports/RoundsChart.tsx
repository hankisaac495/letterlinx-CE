"use client";

import Link from "next/link";
import { useState } from "react";
import { roundSummary, type RoundResult } from "@/lib/reports";
import { useLocale, useT } from "@/lib/i18n";
import { formatDate, pct } from "./format";

const W = 640;
const H = 220;
const PAD = { top: 12, right: 8, bottom: 28, left: 36 };
const BAR = "#2563eb";

/**
 * One series: share of words the class found, per round, oldest → newest.
 * Bars link to the round report; hover or focus shows a tooltip.
 */
export function RoundsChart({ rounds }: { rounds: RoundResult[] }) {
  const t = useT();
  const locale = useLocale();
  const [active, setActive] = useState<number | null>(null);
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const slot = innerW / Math.max(rounds.length, 1);
  const barW = Math.min(36, slot * 0.6);
  const y = (share: number) => PAD.top + innerH * (1 - share);
  const labelEvery = Math.ceil(rounds.length / 10);
  const data = rounds.map((r) => ({ r, s: roundSummary(r) }));
  const hover = active !== null ? data[active] : null;

  return (
    <figure className="relative">
      <figcaption className="text-sm font-bold text-slate-700">{t("chart.title")}</figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-2 h-auto w-full"
        role="img"
        aria-label={t("chart.aria")}
      >
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(t)}
              y2={y(t)}
              stroke="#e2e8f0"
              strokeWidth={1}
            />
            <text
              x={PAD.left - 6}
              y={y(t)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={11}
              fill="#64748b"
            >
              {pct(t)}
            </text>
          </g>
        ))}
        {data.map(({ r, s }, i) => {
          const cx = PAD.left + slot * i + slot / 2;
          const top = y(s.wordsFoundShare);
          const h = Math.max(0, PAD.top + innerH - top);
          const rr = Math.min(4, h / 2, barW / 2);
          // Rounded top corners, square at the baseline.
          const x0 = cx - barW / 2;
          const x1 = cx + barW / 2;
          const base = PAD.top + innerH;
          const d =
            h <= 0
              ? ""
              : `M${x0},${base} V${top + rr} Q${x0},${top} ${x0 + rr},${top} H${x1 - rr} Q${x1},${top} ${x1},${top + rr} V${base} Z`;
          return (
            <g key={r.id}>
              <Link
                href={`/teacher/reports/${r.id}`}
                aria-label={t("chart.bar", {
                  date: formatDate(r.startedAt, false, locale),
                  title: r.title,
                  pct: pct(s.wordsFoundShare),
                })}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
              >
                {/* Hit target taller and wider than the bar. */}
                <rect
                  x={cx - slot / 2}
                  y={PAD.top}
                  width={slot}
                  height={innerH}
                  fill="transparent"
                />
                <path d={d} fill={BAR} opacity={active === null || active === i ? 1 : 0.55} />
              </Link>
              {i % labelEvery === 0 && (
                <text x={cx} y={H - 8} textAnchor="middle" fontSize={11} fill="#64748b">
                  {formatDate(r.startedAt, false, locale)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {hover && (
        <div
          role="tooltip"
          className="pointer-events-none absolute top-8 rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg"
          style={{
            left: `${Math.min(85, Math.max(15, ((PAD.left + slot * (active ?? 0) + slot / 2) / W) * 100))}%`,
            transform: "translateX(-50%)",
          }}
        >
          <p className="font-bold">{hover.r.title}</p>
          <p className="text-white/80">{formatDate(hover.r.startedAt, true, locale)}</p>
          <p>{t("chart.tip", { pct: pct(hover.s.wordsFoundShare), count: hover.s.players })}</p>
        </div>
      )}
    </figure>
  );
}

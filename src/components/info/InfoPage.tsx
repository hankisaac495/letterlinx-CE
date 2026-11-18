"use client";

import Link from "next/link";
import { useLocale, type Locale } from "@/lib/i18n";

/** Readable long-form layout for informational pages (content per language). */
export function InfoPage({
  content,
}: {
  content: Record<
    Locale,
    { title: string; lead?: string; updated?: string; body: React.ReactNode }
  >;
}) {
  const locale = useLocale();
  const c = content[locale];
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-10">
      <Link href="/" className="text-sm font-semibold text-blue-700 hover:underline">
        ← LetterLinx
      </Link>
      <h1 className="mt-2 text-4xl font-black tracking-tight">{c.title}</h1>
      {c.updated && <p className="mt-2 text-sm text-slate-500">{c.updated}</p>}
      {c.lead && <p className="mt-4 text-lg text-slate-600">{c.lead}</p>}
      <div className="prose-info mt-8 flex flex-col gap-6 text-slate-700">{c.body}</div>
    </article>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-2xl font-black text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

export function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="flex list-disc flex-col gap-1.5 pl-6 marker:text-slate-400">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export function Steps({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="flex list-decimal flex-col gap-1.5 pl-6 marker:font-bold marker:text-blue-700">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ol>
  );
}

export const A = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} className="font-semibold text-blue-700 underline-offset-2 hover:underline">
    {children}
  </Link>
);

import type { ManualClass } from "@/lib/roster";
import type { RoundResult } from "@/lib/reports";
import type { WordSet } from "@/store/wordSetStore";

/** Maps one app collection to a Supabase table (see supabase/schema.sql). */
export interface CloudTable<T> {
  table: "word_sets" | "classes" | "round_results";
  key(item: T): string;
  /** Monotonic version (ms) used to decide which copy is newer. */
  version(item: T): number;
  toRow(item: T, ownerId: string): Record<string, unknown>;
  fromRow(row: Record<string, unknown>): T;
}

const iso = (ms: number) => new Date(ms).toISOString();
const ms = (v: unknown) => (typeof v === "string" ? Date.parse(v) : Number(v)) || 0;

export const wordSetsTable: CloudTable<WordSet> = {
  table: "word_sets",
  key: (w) => w.id,
  version: (w) => w.updatedAt,
  toRow: (w, ownerId) => ({ owner_id: ownerId, id: w.id, data: w, updated_at: iso(w.updatedAt) }),
  fromRow: (r) => ({ ...(r.data as WordSet), id: String(r.id) }),
};

export const classesTable: CloudTable<ManualClass> = {
  table: "classes",
  key: (c) => c.id,
  version: (c) => c.updatedAt,
  toRow: (c, ownerId) => ({
    owner_id: ownerId,
    id: c.id,
    name: c.name,
    subject: c.subject,
    grade: c.grade,
    period: c.period,
    students: c.students,
    created_at: iso(c.createdAt),
    updated_at: iso(c.updatedAt),
  }),
  fromRow: (r) => ({
    id: String(r.id),
    ownerId: String(r.owner_id),
    name: String(r.name ?? ""),
    subject: String(r.subject ?? ""),
    grade: String(r.grade ?? ""),
    period: String(r.period ?? ""),
    students: Array.isArray(r.students) ? (r.students as ManualClass["students"]) : [],
    createdAt: ms(r.created_at),
    updatedAt: ms(r.updated_at),
  }),
};

export const reportsTable: CloudTable<RoundResult> = {
  table: "round_results",
  key: (r) => r.id,
  version: (r) => r.savedAt ?? r.endedAt,
  toRow: (r, ownerId) => ({
    owner_id: ownerId,
    id: r.id,
    section_id: r.sectionId,
    started_at: iso(r.startedAt),
    data: r,
    updated_at: iso(r.savedAt ?? r.endedAt),
  }),
  fromRow: (row) => ({ ...(row.data as RoundResult), id: String(row.id) }),
};

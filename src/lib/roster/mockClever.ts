import { buildDemoDistrict, type DemoDistrict } from "./seed";
import {
  RosterNotFoundError,
  type RosterProvider,
  type Section,
  type Student,
  type Teacher,
} from "./types";

export interface MockCleverOptions {
  /** Simulated network latency in ms (0 in tests). */
  latencyMs?: number;
  data?: DemoDistrict;
}

/**
 * Simulated Clever roster API backed by the seeded demo district.
 * Swap for a real Clever client by implementing RosterProvider.
 */
export class MockCleverProvider implements RosterProvider {
  readonly data: DemoDistrict;
  private latencyMs: number;

  constructor(options: MockCleverOptions = {}) {
    this.data = options.data ?? buildDemoDistrict();
    this.latencyMs = options.latencyMs ?? 250;
  }

  private respond<T>(value: T): Promise<T> {
    const copy = structuredClone(value);
    if (this.latencyMs <= 0) return Promise.resolve(copy);
    return new Promise((resolve) => setTimeout(() => resolve(copy), this.latencyMs));
  }

  async getTeacher(teacherId: string): Promise<Teacher> {
    const teacher = this.data.teachers.find((t) => t.id === teacherId);
    if (!teacher) throw new RosterNotFoundError("teacher", teacherId);
    return this.respond(teacher);
  }

  async getSections(teacherId: string): Promise<Section[]> {
    if (!this.data.teachers.some((t) => t.id === teacherId))
      throw new RosterNotFoundError("teacher", teacherId);
    return this.respond(
      this.data.sections
        .filter((s) => s.teacher === teacherId)
        .sort((a, b) => Number(a.period) - Number(b.period)),
    );
  }

  async getSection(sectionId: string): Promise<Section> {
    const section = this.data.sections.find((s) => s.id === sectionId);
    if (!section) throw new RosterNotFoundError("section", sectionId);
    return this.respond(section);
  }

  async getStudents(sectionId: string): Promise<Student[]> {
    const section = this.data.sections.find((s) => s.id === sectionId);
    if (!section) throw new RosterNotFoundError("section", sectionId);
    const byId = new Map(this.data.students.map((s) => [s.id, s]));
    return this.respond(section.students.map((id) => byId.get(id)!));
  }

  /** Demo-only: the accounts offered on the mock sign-in screen. */
  listDemoTeachers(): Teacher[] {
    return structuredClone(this.data.teachers);
  }

  /** Demo-only: every section with its students, for the mock badge scanner. */
  listDemoBadges(): { section: Section; teacher: Teacher; students: Student[] }[] {
    const byId = new Map(this.data.students.map((s) => [s.id, s]));
    return this.data.sections.map((section) => ({
      section: structuredClone(section),
      teacher: structuredClone(this.data.teachers.find((t) => t.id === section.teacher)!),
      students: section.students.map((id) => structuredClone(byId.get(id)!)),
    }));
  }

  /** Simulates a roster sync round-trip. */
  async sync(): Promise<{ syncedAt: number }> {
    await new Promise((r) => setTimeout(r, this.latencyMs * 4));
    return { syncedAt: Date.now() };
  }
}

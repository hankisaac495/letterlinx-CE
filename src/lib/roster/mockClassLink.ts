import { buildClassLinkDemo } from "./classlinkSeed";
import type { OneRosterClass, OneRosterDataset, OneRosterUser } from "./oneroster";
import {
  RosterNotFoundError,
  type DemoBadge,
  type DemoRoster,
  type RosterProvider,
  type Section,
  type Student,
  type Teacher,
} from "./types";

// --- OneRoster → LetterLinx adapters (reused by a real ClassLink client later) ---

const gradeLabel = (g: string | undefined) => (g ? String(Number(g) || g) : "");

export function teacherFromOneRoster(user: OneRosterUser, data: OneRosterDataset): Teacher {
  const school = user.orgs[0]?.sourcedId ?? "";
  const district = data.orgs.find((o) => o.sourcedId === school)?.parent?.sourcedId ?? "";
  return {
    id: user.sourcedId,
    district,
    school,
    name: { first: user.givenName, last: user.familyName },
    title: user.metadata?.prefix ?? "",
  };
}

export function studentFromOneRoster(user: OneRosterUser, data: OneRosterDataset): Student {
  const school = user.orgs[0]?.sourcedId ?? "";
  return {
    id: user.sourcedId,
    district: data.orgs.find((o) => o.sourcedId === school)?.parent?.sourcedId ?? "",
    school,
    // Only an initial is ever kept, even if the source has a full family name.
    name: { first: user.givenName, last_initial: user.familyName.charAt(0).toUpperCase() },
    grade: gradeLabel(user.grades[0]),
  };
}

export function sectionFromOneRoster(cls: OneRosterClass, data: OneRosterDataset): Section {
  const active = data.enrollments.filter(
    (e) => e.status === "active" && e.class.sourcedId === cls.sourcedId,
  );
  const teacher =
    active.find((e) => e.role === "teacher" && e.primary) ??
    active.find((e) => e.role === "teacher");
  const studentIds = active.filter((e) => e.role === "student").map((e) => e.user.sourcedId);
  const byId = new Map(data.users.map((u) => [u.sourcedId, u]));
  const students = studentIds
    .map((id) => byId.get(id))
    .filter((u): u is OneRosterUser => !!u && u.status === "active" && u.enabledUser)
    .sort((a, b) => a.givenName.localeCompare(b.givenName));
  const school = cls.school.sourcedId;
  return {
    id: cls.sourcedId,
    district: data.orgs.find((o) => o.sourcedId === school)?.parent?.sourcedId ?? "",
    school,
    teacher: teacher?.user.sourcedId ?? "",
    name: cls.title,
    subject: cls.subjects[0] ?? "",
    grade: gradeLabel(cls.grades[0]),
    period: cls.periods[0] ?? "",
    students: students.map((s) => s.sourcedId),
  };
}

/**
 * Simulated ClassLink Roster Server (OneRoster 1.1) behind the RosterProvider
 * interface. A real integration fetches the same objects from
 * /ims/oneroster/v1p1/... and reuses the adapters above.
 */
export class MockClassLinkProvider implements RosterProvider, DemoRoster {
  readonly data: OneRosterDataset;
  private latencyMs: number;

  constructor(options: { latencyMs?: number; data?: OneRosterDataset } = {}) {
    this.data = options.data ?? buildClassLinkDemo();
    this.latencyMs = options.latencyMs ?? 250;
  }

  private respond<T>(value: T): Promise<T> {
    const copy = structuredClone(value);
    if (this.latencyMs <= 0) return Promise.resolve(copy);
    return new Promise((resolve) => setTimeout(() => resolve(copy), this.latencyMs));
  }

  private activeClasses(): OneRosterClass[] {
    return this.data.classes.filter((c) => c.status === "active");
  }

  private teacherUser(id: string): OneRosterUser {
    const user = this.data.users.find((u) => u.sourcedId === id && u.role === "teacher");
    if (!user) throw new RosterNotFoundError("teacher", id);
    return user;
  }

  async getTeacher(teacherId: string): Promise<Teacher> {
    return this.respond(teacherFromOneRoster(this.teacherUser(teacherId), this.data));
  }

  async getSections(teacherId: string): Promise<Section[]> {
    this.teacherUser(teacherId);
    return this.respond(
      this.activeClasses()
        .map((c) => sectionFromOneRoster(c, this.data))
        .filter((s) => s.teacher === teacherId)
        .sort((a, b) => Number(a.period) - Number(b.period)),
    );
  }

  async getSection(sectionId: string): Promise<Section> {
    const cls = this.activeClasses().find((c) => c.sourcedId === sectionId);
    if (!cls) throw new RosterNotFoundError("section", sectionId);
    return this.respond(sectionFromOneRoster(cls, this.data));
  }

  async getStudents(sectionId: string): Promise<Student[]> {
    const section = await this.getSection(sectionId);
    const byId = new Map(this.data.users.map((u) => [u.sourcedId, u]));
    return this.respond(
      section.students.map((id) => studentFromOneRoster(byId.get(id)!, this.data)),
    );
  }

  async sync(): Promise<{ syncedAt: number }> {
    await new Promise((r) => setTimeout(r, this.latencyMs * 4));
    return { syncedAt: Date.now() };
  }

  get schoolName() {
    return this.data.orgs.find((o) => o.type === "school")?.name ?? "";
  }

  get districtName() {
    return this.data.orgs.find((o) => o.type === "district")?.name ?? "";
  }

  listDemoTeachers(): Teacher[] {
    return this.data.users
      .filter((u) => u.role === "teacher")
      .map((u) => teacherFromOneRoster(u, this.data));
  }

  listDemoBadges(): DemoBadge[] {
    const byId = new Map(this.data.users.map((u) => [u.sourcedId, u]));
    return this.activeClasses().map((cls) => {
      const section = sectionFromOneRoster(cls, this.data);
      return {
        section,
        teacher: teacherFromOneRoster(this.teacherUser(section.teacher), this.data),
        students: section.students.map((id) => studentFromOneRoster(byId.get(id)!, this.data)),
      };
    });
  }

  countSections(teacherId: string): number {
    return this.activeClasses().filter(
      (c) => sectionFromOneRoster(c, this.data).teacher === teacherId,
    ).length;
  }
}

/**
 * Roster data modelled on Clever's API objects (district, school, teacher,
 * section, student) so a real integration can be swapped in later.
 * Demo data only: students are identified by first name and last initial.
 */
export interface District {
  id: string;
  name: string;
}

export interface School {
  id: string;
  district: string;
  name: string;
  low_grade: string;
  high_grade: string;
}

export interface Teacher {
  id: string;
  district: string;
  school: string;
  name: { first: string; last: string };
  title: string;
}

export interface Section {
  id: string;
  district: string;
  school: string;
  teacher: string;
  name: string;
  subject: string;
  grade: string;
  period: string;
  students: string[];
}

export interface Student {
  id: string;
  district: string;
  school: string;
  name: { first: string; last_initial: string };
  grade: string;
}

export interface RosterProvider {
  getTeacher(teacherId: string): Promise<Teacher>;
  getSections(teacherId: string): Promise<Section[]>;
  getStudents(sectionId: string): Promise<Student[]>;
  /** Single section lookup. */
  getSection(sectionId: string): Promise<Section>;
  /** Re-pull rosters from the source system, where there is one. */
  sync?(): Promise<{ syncedAt: number }>;
}

export interface DemoBadge {
  section: Section;
  teacher: Teacher;
  students: Student[];
}

/** Extra helpers the simulated rostering systems expose for the demo sign-in screens. */
export interface DemoRoster {
  readonly schoolName: string;
  readonly districtName: string;
  listDemoTeachers(): Teacher[];
  listDemoBadges(): DemoBadge[];
  countSections(teacherId: string): number;
}

/**
 * A class as carried with a live round: enough for students to pick their name and for
 * reports, without any device needing roster access of its own.
 */
export interface ClassInfo {
  id: string;
  name: string;
  period: string;
  grade: string;
  students: { id: string; name: string }[];
}

export class RosterNotFoundError extends Error {
  constructor(kind: string, id: string) {
    super(`${kind} ${id} not found`);
    this.name = "RosterNotFoundError";
  }
}

/** "Maya" + "R" → "Maya R." */
export function studentDisplayName(s: Pick<Student, "name">): string {
  return `${s.name.first} ${s.name.last_initial}.`;
}

export function teacherDisplayName(t: Pick<Teacher, "name" | "title">): string {
  return t.title ? `${t.title} ${t.name.last}` : `${t.name.first} ${t.name.last}`.trim();
}

export function classInfoFrom(section: Section, students: Student[]): ClassInfo {
  return {
    id: section.id,
    name: section.name,
    period: section.period,
    grade: section.grade,
    students: students.map((s) => ({ id: s.id, name: studentDisplayName(s) })),
  };
}

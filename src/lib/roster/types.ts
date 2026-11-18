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
  /** Single section lookup (used by the join flow). */
  getSection(sectionId: string): Promise<Section>;
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
  return `${t.title} ${t.name.last}`;
}

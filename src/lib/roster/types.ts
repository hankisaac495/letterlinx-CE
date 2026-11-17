/**
 * Roster data modelled on Clever's API objects so a real integration can be
 * swapped in later. Phase 6 adds MockCleverProvider. Demo data only.
 */
export interface District {
  id: string;
  name: string;
}

export interface School {
  id: string;
  districtId: string;
  name: string;
  lowGrade: string;
  highGrade: string;
}

export interface Teacher {
  id: string;
  districtId: string;
  schoolId: string;
  name: { first: string; last: string };
  title?: string;
}

export interface Section {
  id: string;
  schoolId: string;
  teacherId: string;
  name: string;
  subject: string;
  grade: string;
  period: string;
  studentIds: string[];
}

/** Students are identified by first name and last initial only. */
export interface Student {
  id: string;
  schoolId: string;
  name: { first: string; lastInitial: string };
  grade: string;
}

export interface RosterProvider {
  getTeacher(teacherId: string): Promise<Teacher>;
  getSections(teacherId: string): Promise<Section[]>;
  getStudents(sectionId: string): Promise<Student[]>;
}

/**
 * OneRoster 1.1 shapes (the standard ClassLink Roster Server exposes), trimmed to
 * what LetterLinx needs. Demo data stores only a family-name initial.
 */
export type OneRosterStatus = "active" | "tobedeleted";

export interface OneRosterRef {
  sourcedId: string;
  type: "org" | "user" | "class" | "course" | "academicSession";
}

export interface OneRosterOrg {
  sourcedId: string;
  status: OneRosterStatus;
  name: string;
  type: "district" | "school";
  parent?: OneRosterRef;
}

export interface OneRosterUser {
  sourcedId: string;
  status: OneRosterStatus;
  enabledUser: boolean;
  role: "teacher" | "student" | "administrator";
  givenName: string;
  /** Demo data: initial only (no full family names stored). */
  familyName: string;
  grades: string[];
  orgs: OneRosterRef[];
  /** Honorific shown to students, e.g. "Dr." (LetterLinx extension; not in OneRoster). */
  metadata?: { prefix?: string };
}

export interface OneRosterClass {
  sourcedId: string;
  status: OneRosterStatus;
  title: string;
  classCode: string;
  classType: "homeroom" | "scheduled";
  grades: string[];
  subjects: string[];
  periods: string[];
  school: OneRosterRef;
}

export interface OneRosterEnrollment {
  sourcedId: string;
  status: OneRosterStatus;
  role: "teacher" | "student";
  primary: boolean;
  user: OneRosterRef;
  class: OneRosterRef;
}

export interface OneRosterDataset {
  orgs: OneRosterOrg[];
  users: OneRosterUser[];
  classes: OneRosterClass[];
  enrollments: OneRosterEnrollment[];
}

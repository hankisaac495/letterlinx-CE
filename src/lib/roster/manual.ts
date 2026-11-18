import {
  RosterNotFoundError,
  type RosterProvider,
  type Section,
  type Student,
  type Teacher,
} from "./types";

/** A class a teacher typed in themselves (no rostering system). */
export interface ManualClass {
  id: string;
  ownerId: string;
  name: string;
  subject: string;
  grade: string;
  period: string;
  students: ManualStudent[];
  createdAt: number;
  updatedAt: number;
}

export interface ManualStudent {
  id: string;
  first: string;
  lastInitial: string;
}

export const MAX_CLASS_SIZE = 60;
export const MAX_NAME_LENGTH = 30;

export interface ParsedNames {
  students: { first: string; lastInitial: string }[];
  /** Lines that couldn't be read as a name. */
  invalid: string[];
}

const LETTER = /\p{L}/u;

/**
 * Reads pasted names, one per line (or separated by semicolons):
 * "Maya R", "Maya R.", "Maya Rodriguez", "Rodriguez, Maya", "Mary Ann Lopez".
 * Only the first name and the last-name initial are kept.
 */
export function parseStudentNames(text: string): ParsedNames {
  const students: ParsedNames["students"] = [];
  const invalid: string[] = [];
  for (const raw of text.split(/[\n;]+/)) {
    const line = raw.trim().replace(/\s+/g, " ");
    if (!line) continue;
    let first = "";
    let last = "";
    if (line.includes(",")) {
      const [l, f] = line.split(",").map((s) => s.trim());
      first = f ?? "";
      last = l ?? "";
    } else {
      const parts = line.split(" ");
      if (parts.length === 1) {
        first = parts[0];
      } else {
        last = parts.pop()!;
        first = parts.join(" ");
      }
    }
    first = first.replace(/[^\p{L}\p{M}' -]/gu, "").trim();
    const initial = [...last].find((c) => LETTER.test(c))?.toLocaleUpperCase() ?? "";
    if (!first || first.length > MAX_NAME_LENGTH) {
      invalid.push(raw.trim());
      continue;
    }
    students.push({ first: capitalise(first), lastInitial: initial });
  }
  return { students, invalid };
}

function capitalise(name: string): string {
  return name
    .split(/([ '-])/)
    .map((p) => (p.length > 1 && p === p.toLowerCase() ? p[0].toLocaleUpperCase() + p.slice(1) : p))
    .join("");
}

export function manualStudentName(s: Pick<ManualStudent, "first" | "lastInitial">): string {
  return s.lastInitial ? `${s.first} ${s.lastInitial}.` : s.first;
}

/** Serves typed-in classes through the same RosterProvider interface as Clever/ClassLink. */
export class ManualRosterProvider implements RosterProvider {
  constructor(
    private owner: Teacher,
    private getClasses: () => ManualClass[],
  ) {}

  private mine() {
    return this.getClasses().filter((c) => c.ownerId === this.owner.id);
  }

  private toSection(c: ManualClass): Section {
    return {
      id: c.id,
      district: "",
      school: "",
      teacher: c.ownerId,
      name: c.name,
      subject: c.subject,
      grade: c.grade,
      period: c.period,
      students: c.students.map((s) => s.id),
    };
  }

  async getTeacher(teacherId: string): Promise<Teacher> {
    if (teacherId !== this.owner.id) throw new RosterNotFoundError("teacher", teacherId);
    return structuredClone(this.owner);
  }

  async getSections(teacherId: string): Promise<Section[]> {
    if (teacherId !== this.owner.id) throw new RosterNotFoundError("teacher", teacherId);
    return this.mine()
      .map((c) => this.toSection(c))
      .sort(
        (a, b) =>
          a.period.localeCompare(b.period, undefined, { numeric: true }) ||
          a.name.localeCompare(b.name),
      );
  }

  async getSection(sectionId: string): Promise<Section> {
    const c = this.mine().find((x) => x.id === sectionId);
    if (!c) throw new RosterNotFoundError("section", sectionId);
    return this.toSection(c);
  }

  async getStudents(sectionId: string): Promise<Student[]> {
    const c = this.mine().find((x) => x.id === sectionId);
    if (!c) throw new RosterNotFoundError("section", sectionId);
    return c.students.map((s) => ({
      id: s.id,
      district: "",
      school: "",
      name: { first: s.first, last_initial: s.lastInitial },
      grade: c.grade,
    }));
  }
}

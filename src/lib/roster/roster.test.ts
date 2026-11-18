import { MockCleverProvider } from "./mockClever";
import { buildDemoDistrict } from "./seed";
import { RosterNotFoundError, studentDisplayName, teacherDisplayName } from "./types";

describe("demo district seed", () => {
  const d = buildDemoDistrict();

  it("has 1 district, 1 school and 3 teachers", () => {
    expect(d.district.name).toMatch(/Demo/);
    expect(d.school.name).toMatch(/Demo/);
    expect(d.teachers).toHaveLength(3);
  });

  it("gives each teacher 2–4 sections of 15–28 students", () => {
    for (const t of d.teachers) {
      const sections = d.sections.filter((s) => s.teacher === t.id);
      expect(sections.length).toBeGreaterThanOrEqual(2);
      expect(sections.length).toBeLessThanOrEqual(4);
      for (const s of sections) {
        expect(s.students.length).toBeGreaterThanOrEqual(15);
        expect(s.students.length).toBeLessThanOrEqual(28);
        expect(s).toMatchObject({
          grade: expect.any(String),
          period: expect.any(String),
          subject: expect.any(String),
        });
      }
    }
  });

  it("uses unique Clever-style ids and links everything together", () => {
    const ids = [
      d.district.id,
      d.school.id,
      ...d.teachers.map((t) => t.id),
      ...d.sections.map((s) => s.id),
      ...d.students.map((s) => s.id),
    ];
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => /^[0-9a-f]{24}$/.test(id))).toBe(true);
    const studentIds = new Set(d.students.map((s) => s.id));
    expect(d.sections.every((s) => s.students.every((id) => studentIds.has(id)))).toBe(true);
  });

  it("stores no student emails or passwords, only first name and last initial", () => {
    for (const s of d.students) {
      expect(Object.keys(s.name).sort()).toEqual(["first", "last_initial"]);
      expect(s.name.last_initial).toMatch(/^[A-Z]$/);
      expect(JSON.stringify(s)).not.toMatch(/@|password|email/i);
    }
  });

  it("is deterministic", () => {
    expect(buildDemoDistrict()).toEqual(d);
    expect(buildDemoDistrict(7).teachers[0].id).not.toBe(d.teachers[0].id);
  });
});

describe("MockCleverProvider", () => {
  const roster = new MockCleverProvider({ latencyMs: 0 });
  const teacher = roster.listDemoTeachers()[0];

  it("implements getTeacher, getSections and getStudents", async () => {
    expect(teacherDisplayName(await roster.getTeacher(teacher.id))).toBe("Ms. Quill");
    const sections = await roster.getSections(teacher.id);
    expect(sections.map((s) => s.period)).toEqual(["1", "3", "5"]);
    const students = await roster.getStudents(sections[0].id);
    expect(students).toHaveLength(sections[0].students.length);
    expect(studentDisplayName(students[0])).toMatch(/^\w+ [A-Z]\.$/);
  });

  it("returns copies so callers can't mutate the source", async () => {
    const t = await roster.getTeacher(teacher.id);
    t.name.last = "Changed";
    expect((await roster.getTeacher(teacher.id)).name.last).toBe("Quill");
  });

  it("throws a not-found error for unknown ids", async () => {
    await expect(roster.getTeacher("nope")).rejects.toBeInstanceOf(RosterNotFoundError);
    await expect(roster.getStudents("nope")).rejects.toBeInstanceOf(RosterNotFoundError);
  });

  it("lists demo badges by section", () => {
    const badges = roster.listDemoBadges();
    expect(badges).toHaveLength(9);
    expect(badges[0].students.length).toBe(badges[0].section.students.length);
  });
});

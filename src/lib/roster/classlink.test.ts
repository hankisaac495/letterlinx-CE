import { buildClassLinkDemo } from "./classlinkSeed";
import { MockClassLinkProvider, sectionFromOneRoster, studentFromOneRoster } from "./mockClassLink";
import { classInfoFrom, RosterNotFoundError, teacherDisplayName } from "./types";

describe("ClassLink (OneRoster) demo data", () => {
  const data = buildClassLinkDemo();

  it("is OneRoster-shaped with a district, a school, teachers, classes and enrollments", () => {
    expect(data.orgs.map((o) => o.type)).toEqual(["district", "school"]);
    expect(data.users.filter((u) => u.role === "teacher")).toHaveLength(2);
    expect(data.classes.length).toBeGreaterThanOrEqual(5);
    expect(data.enrollments.every((e) => e.user.type === "user" && e.class.type === "class")).toBe(
      true,
    );
  });

  it("stores only an initial for student family names", () => {
    for (const u of data.users.filter((x) => x.role === "student"))
      expect(u.familyName).toMatch(/^[A-Z]$/);
  });

  it("is deterministic", () => {
    expect(buildClassLinkDemo()).toEqual(data);
  });
});

describe("OneRoster adapters", () => {
  const data = buildClassLinkDemo();

  it("maps a class to a section with its primary teacher and active students", () => {
    const cls = data.classes[0];
    const section = sectionFromOneRoster(cls, data);
    expect(section).toMatchObject({
      id: cls.sourcedId,
      name: cls.title,
      period: cls.periods[0],
      grade: "7",
    });
    const enrolled = data.enrollments.filter(
      (e) => e.class.sourcedId === cls.sourcedId && e.role === "student",
    );
    expect(section.students).toHaveLength(enrolled.length);
  });

  it("keeps only the family-name initial even when given a full name", () => {
    const user = { ...data.users.find((u) => u.role === "student")!, familyName: "rodriguez" };
    expect(studentFromOneRoster(user, data).name).toEqual({
      first: user.givenName,
      last_initial: "R",
    });
  });
});

describe("MockClassLinkProvider", () => {
  const roster = new MockClassLinkProvider({ latencyMs: 0 });
  const [sparkwell, fernwood] = roster.listDemoTeachers();

  it("implements RosterProvider", async () => {
    expect(teacherDisplayName(await roster.getTeacher(sparkwell.id))).toBe("Dr. Sparkwell");
    const sections = await roster.getSections(fernwood.id);
    expect(sections.map((s) => s.period)).toEqual(["1", "3", "6"]);
    const students = await roster.getStudents(sections[0].id);
    expect(students).toHaveLength(28);
    expect(classInfoFrom(sections[0], students).students[0].name).toMatch(/^\p{L}+ [A-Z]\.$/u);
  });

  it("filters out inactive classes", async () => {
    const titles = (await roster.getSections(sparkwell.id)).map((s) => s.name);
    expect(titles).not.toContain("Archived Section");
    expect(roster.countSections(sparkwell.id)).toBe(2);
  });

  it("throws not-found for unknown ids and lists demo QuickCards", async () => {
    await expect(roster.getSections("nope")).rejects.toBeInstanceOf(RosterNotFoundError);
    expect(roster.listDemoBadges()).toHaveLength(5);
    expect(roster.schoolName).toMatch(/Demo/);
  });
});

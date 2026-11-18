import {
  ManualRosterProvider,
  manualStudentName,
  parseStudentNames,
  type ManualClass,
} from "./manual";
import { RosterNotFoundError, type Teacher } from "./types";

describe("parseStudentNames", () => {
  it("reads common formats and keeps only the last initial", () => {
    const { students, invalid } = parseStudentNames(
      "Maya R\nKenji Hayashi\nRodriguez, Ana\n  dev   patel \nMary Ann Lopez\nZoë\nmaría josé o'neil",
    );
    expect(students).toEqual([
      { first: "Maya", lastInitial: "R" },
      { first: "Kenji", lastInitial: "H" },
      { first: "Ana", lastInitial: "R" },
      { first: "Dev", lastInitial: "P" },
      { first: "Mary Ann", lastInitial: "L" },
      { first: "Zoë", lastInitial: "" },
      { first: "María José", lastInitial: "O" },
    ]);
    expect(invalid).toEqual([]);
  });

  it("accepts semicolons, skips blanks and flags unreadable lines", () => {
    const r = parseStudentNames("Ana B; ;Ben C\n12345\n");
    expect(r.students.map(manualStudentName)).toEqual(["Ana B.", "Ben C."]);
    expect(r.invalid).toEqual(["12345"]);
  });
});

describe("ManualRosterProvider", () => {
  const owner: Teacher = {
    id: "acct_1",
    district: "",
    school: "",
    name: { first: "Pat", last: "Lee" },
    title: "",
  };
  const classes: ManualClass[] = [
    {
      id: "c2",
      ownerId: "acct_1",
      name: "Science",
      subject: "",
      grade: "6",
      period: "3",
      createdAt: 0,
      updatedAt: 0,
      students: [{ id: "s1", first: "Ana", lastInitial: "B" }],
    },
    {
      id: "c1",
      ownerId: "acct_1",
      name: "Math",
      subject: "",
      grade: "6",
      period: "1",
      createdAt: 0,
      updatedAt: 0,
      students: [],
    },
    {
      id: "x",
      ownerId: "someone_else",
      name: "Other",
      subject: "",
      grade: "",
      period: "1",
      createdAt: 0,
      updatedAt: 0,
      students: [],
    },
  ];
  const roster = new ManualRosterProvider(owner, () => classes);

  it("serves only the owner's classes, sorted by period", async () => {
    expect((await roster.getSections("acct_1")).map((s) => s.id)).toEqual(["c1", "c2"]);
    await expect(roster.getSection("x")).rejects.toBeInstanceOf(RosterNotFoundError);
  });

  it("returns students as roster students", async () => {
    expect(await roster.getStudents("c2")).toEqual([
      { id: "s1", district: "", school: "", name: { first: "Ana", last_initial: "B" }, grade: "6" },
    ]);
  });
});

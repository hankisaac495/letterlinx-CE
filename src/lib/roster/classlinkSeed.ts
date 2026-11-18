import { createRng, randInt, shuffle, type Rng } from "@/lib/game/rng";
import type {
  OneRosterClass,
  OneRosterDataset,
  OneRosterEnrollment,
  OneRosterUser,
} from "./oneroster";

/** Fictional names (separate from the Clever demo district). */
const FIRST_NAMES = [
  "Adaeze",
  "Bruno",
  "Carmen",
  "Dmitri",
  "Elena",
  "Femi",
  "Grace",
  "Hector",
  "Imani",
  "Joaquin",
  "Keiko",
  "Leon",
  "Malia",
  "Nils",
  "Olga",
  "Pablo",
  "Qiana",
  "Rohan",
  "Sofia",
  "Tariq",
  "Ula",
  "Victor",
  "Wanjiru",
  "Ximena",
  "Yosef",
  "Zainab",
  "Arjun",
  "Bianca",
  "Cyrus",
  "Dalia",
  "Emil",
  "Fatima",
  "Gael",
  "Hiro",
];
const INITIALS = "ABCDEFGHJKLMNOPRSTVWYZ";

const TEACHERS = [
  {
    given: "Morgan",
    family: "Sparkwell",
    prefix: "Dr.",
    classes: [
      { title: "World History 7", subject: "Social Studies", grade: "07", period: "2", size: 23 },
      { title: "World History 7", subject: "Social Studies", grade: "07", period: "4", size: 26 },
    ],
  },
  {
    given: "Riley",
    family: "Fernwood",
    prefix: "Ms.",
    classes: [
      { title: "Biology 9", subject: "Science", grade: "09", period: "1", size: 28 },
      {
        title: "Newcomer ELD",
        subject: "English Language Development",
        grade: "08",
        period: "3",
        size: 16,
      },
      {
        title: "Spanish for Heritage Speakers",
        subject: "World Languages",
        grade: "09",
        period: "6",
        size: 20,
      },
    ],
  },
];

const guid = (rng: Rng) => {
  const hex = () => "0123456789abcdef"[randInt(rng, 16)];
  const part = (n: number) => Array.from({ length: n }, hex).join("");
  return `${part(8)}-${part(4)}-4${part(3)}-a${part(3)}-${part(12)}`;
};

/** Seeded, fully fictional OneRoster dataset for the simulated ClassLink connection. */
export function buildClassLinkDemo(seed = 4141): OneRosterDataset {
  const rng = createRng(seed);
  const district = {
    sourcedId: guid(rng),
    status: "active" as const,
    name: "Riverbend Demo Unified",
    type: "district" as const,
  };
  const school = {
    sourcedId: guid(rng),
    status: "active" as const,
    name: "Cedar Hollow Demo Academy",
    type: "school" as const,
    parent: { sourcedId: district.sourcedId, type: "org" as const },
  };
  const orgRef = { sourcedId: school.sourcedId, type: "org" as const };
  const users: OneRosterUser[] = [];
  const classes: OneRosterClass[] = [];
  const enrollments: OneRosterEnrollment[] = [];

  for (const t of TEACHERS) {
    const teacher: OneRosterUser = {
      sourcedId: guid(rng),
      status: "active",
      enabledUser: true,
      role: "teacher",
      givenName: t.given,
      familyName: t.family,
      grades: [],
      orgs: [orgRef],
      metadata: { prefix: t.prefix },
    };
    users.push(teacher);
    for (const c of t.classes) {
      const cls: OneRosterClass = {
        sourcedId: guid(rng),
        status: "active",
        title: c.title,
        classCode: `${c.title.replace(/\W+/g, "").slice(0, 6).toUpperCase()}-P${c.period}`,
        classType: "scheduled",
        grades: [c.grade],
        subjects: [c.subject],
        periods: [c.period],
        school: orgRef,
      };
      classes.push(cls);
      enrollments.push({
        sourcedId: guid(rng),
        status: "active",
        role: "teacher",
        primary: true,
        user: { sourcedId: teacher.sourcedId, type: "user" },
        class: { sourcedId: cls.sourcedId, type: "class" },
      });
      for (const given of shuffle(rng, [...FIRST_NAMES]).slice(0, c.size)) {
        const student: OneRosterUser = {
          sourcedId: guid(rng),
          status: "active",
          enabledUser: true,
          role: "student",
          givenName: given,
          familyName: INITIALS[randInt(rng, INITIALS.length)],
          grades: [c.grade],
          orgs: [orgRef],
        };
        users.push(student);
        enrollments.push({
          sourcedId: guid(rng),
          status: "active",
          role: "student",
          primary: false,
          user: { sourcedId: student.sourcedId, type: "user" },
          class: { sourcedId: cls.sourcedId, type: "class" },
        });
      }
    }
  }
  // An inactive class and enrollment, to prove the adapter filters them out.
  const archived = {
    ...classes[0],
    sourcedId: guid(rng),
    title: "Archived Section",
    status: "tobedeleted" as const,
  };
  classes.push(archived);
  enrollments.push({
    sourcedId: guid(rng),
    status: "active",
    role: "teacher",
    primary: true,
    user: { sourcedId: users[0].sourcedId, type: "user" },
    class: { sourcedId: archived.sourcedId, type: "class" },
  });
  return { orgs: [district, school], users, classes, enrollments };
}

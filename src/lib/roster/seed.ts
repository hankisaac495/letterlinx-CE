import { createRng, randInt, shuffle, type Rng } from "@/lib/game/rng";
import type { District, School, Section, Student, Teacher } from "./types";

/**
 * Seeded, fully fictional demo district. Deterministic so ids stay stable
 * across reloads and devices.
 */
export interface DemoDistrict {
  district: District;
  school: School;
  teachers: Teacher[];
  sections: Section[];
  students: Student[];
}

const FIRST_NAMES = [
  "Aiden",
  "Amara",
  "Anika",
  "Ari",
  "Bao",
  "Bea",
  "Bodhi",
  "Camila",
  "Cato",
  "Chidi",
  "Cleo",
  "Dara",
  "Dev",
  "Diego",
  "Eli",
  "Elif",
  "Emeka",
  "Esme",
  "Ezra",
  "Farah",
  "Faye",
  "Finn",
  "Gia",
  "Gus",
  "Hana",
  "Hugo",
  "Ibrahim",
  "Ines",
  "Isla",
  "Jalen",
  "Jia",
  "Juno",
  "Kai",
  "Kalani",
  "Kenji",
  "Lena",
  "Leo",
  "Lior",
  "Luca",
  "Lupe",
  "Maya",
  "Mateo",
  "Mina",
  "Nadia",
  "Nico",
  "Noor",
  "Odette",
  "Omar",
  "Pax",
  "Priya",
  "Quinn",
  "Rafa",
  "Ravi",
  "Rosa",
  "Rumi",
  "Sana",
  "Santi",
  "Sol",
  "Suki",
  "Tavi",
  "Teo",
  "Uma",
  "Valentina",
  "Vero",
  "Wren",
  "Xiomara",
  "Yara",
  "Yusuf",
  "Zane",
  "Zara",
  "Zeke",
  "Zoe",
];
const INITIALS = "ABCDEFGHJKLMNOPRSTVWYZ";

interface SectionSpec {
  name: string;
  subject: string;
  grade: string;
  period: string;
  size: number;
}

interface TeacherSpec {
  first: string;
  last: string;
  title: string;
  sections: SectionSpec[];
}

/** Whimsical surnames make it obvious these aren't real people. */
const TEACHERS: TeacherSpec[] = [
  {
    first: "Avery",
    last: "Quill",
    title: "Ms.",
    sections: [
      { name: "Life Science 7", subject: "science", grade: "7", period: "1", size: 24 },
      { name: "Life Science 7", subject: "science", grade: "7", period: "3", size: 27 },
      { name: "Earth Science 8", subject: "science", grade: "8", period: "5", size: 19 },
    ],
  },
  {
    first: "Jordan",
    last: "Penbrook",
    title: "Mx.",
    sections: [
      { name: "ESL Level 2", subject: "english/language arts", grade: "6", period: "2", size: 15 },
      { name: "ESL Level 3", subject: "english/language arts", grade: "7", period: "4", size: 18 },
      { name: "Spanish 1", subject: "language", grade: "8", period: "6", size: 28 },
      { name: "Spanish 2", subject: "language", grade: "8", period: "7", size: 22 },
    ],
  },
  {
    first: "Sam",
    last: "Inkwell",
    title: "Mr.",
    sections: [
      { name: "English 8", subject: "english/language arts", grade: "8", period: "2", size: 26 },
      {
        name: "English 8 Honors",
        subject: "english/language arts",
        grade: "8",
        period: "4",
        size: 21,
      },
    ],
  },
];

function hexId(rng: Rng): string {
  let s = "";
  for (let i = 0; i < 24; i++) s += "0123456789abcdef"[randInt(rng, 16)];
  return s;
}

export function buildDemoDistrict(seed = 2024): DemoDistrict {
  const rng = createRng(seed);
  const district: District = { id: hexId(rng), name: "Lakeside Demo District" };
  const school: School = {
    id: hexId(rng),
    district: district.id,
    name: "Maplewood Demo Middle School",
    low_grade: "6",
    high_grade: "8",
  };
  const teachers: Teacher[] = [];
  const sections: Section[] = [];
  const students: Student[] = [];

  for (const spec of TEACHERS) {
    const teacher: Teacher = {
      id: hexId(rng),
      district: district.id,
      school: school.id,
      name: { first: spec.first, last: spec.last },
      title: spec.title,
    };
    teachers.push(teacher);
    for (const s of spec.sections) {
      const names = shuffle(rng, [...FIRST_NAMES]).slice(0, s.size);
      const roster: Student[] = names.map((first) => ({
        id: hexId(rng),
        district: district.id,
        school: school.id,
        name: { first, last_initial: INITIALS[randInt(rng, INITIALS.length)] },
        grade: s.grade,
      }));
      roster.sort((a, b) => a.name.first.localeCompare(b.name.first));
      students.push(...roster);
      sections.push({
        id: hexId(rng),
        district: district.id,
        school: school.id,
        teacher: teacher.id,
        name: s.name,
        subject: s.subject,
        grade: s.grade,
        period: s.period,
        students: roster.map((st) => st.id),
      });
    }
  }
  return { district, school, teachers, sections, students };
}

/**
 * Basic profanity check. Deliberately small: it catches the obvious cases on
 * teacher-entered words and stops random filler from spelling them on the board.
 * Lists are in normalized form (uppercase, accents stripped, Ñ kept).
 */

/** Words that are rejected if a teacher word *is* one of them. */
const EXACT_EN = [
  "ASS",
  "ARSE",
  "BITCH",
  "BOLLOCKS",
  "BONER",
  "BOOB",
  "BOOBS",
  "BUTTHOLE",
  "COCK",
  "CRAP",
  "CUM",
  "DAMN",
  "DICK",
  "DILDO",
  "DYKE",
  "FAG",
  "FAGGOT",
  "FUCK",
  "HOE",
  "HOMO",
  "JIZZ",
  "KIKE",
  "NAZI",
  "NIGGA",
  "NIGGER",
  "PENIS",
  "PISS",
  "PORN",
  "PRICK",
  "PUSSY",
  "RAPE",
  "RETARD",
  "SEX",
  "SEXY",
  "SHIT",
  "SLUT",
  "SPIC",
  "TIT",
  "TITS",
  "TWAT",
  "VAGINA",
  "WANK",
  "WHORE",
];

const EXACT_ES = [
  "CABRON",
  "CAGAR",
  "CHINGAR",
  "CHOCHO",
  "CULO",
  "COÑO",
  "GILIPOLLAS",
  "JODER",
  "MAMON",
  "MARICON",
  "MIERDA",
  "PENDEJO",
  "PEDO",
  "POLLA",
  "PUTA",
  "PUTO",
  "VERGA",
  "ZORRA",
];

/** Rejected if a teacher word *contains* one of them (they rarely appear innocently). */
const SUBSTRING = [
  "FUCK",
  "SHIT",
  "CUNT",
  "NIGGER",
  "NIGGA",
  "FAGGOT",
  "WHORE",
  "BITCH",
  "PUSSY",
  "DILDO",
  "MIERDA",
  "PUTA",
  "COÑO",
  "CHINGA",
  "PENDEJ",
];

/** What the board scanner looks for in filler (both languages: ESL classrooms mix them). */
export const BOARD_SCAN_WORDS: readonly string[] = [
  ...new Set([...EXACT_EN, ...EXACT_ES, ...SUBSTRING].filter((w) => w.length >= 3)),
].sort((a, b) => a.length - b.length);

const EXACT = new Set([...EXACT_EN, ...EXACT_ES]);

export function isProfane(normalizedWord: string): boolean {
  const w = normalizedWord.toUpperCase();
  if (EXACT.has(w)) return true;
  return SUBSTRING.some((bad) => w.includes(bad));
}

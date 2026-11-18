/** Obviously fictional first names for simulated students (no real student data). */
export const BOT_FIRST_NAMES = [
  "Ari",
  "Bea",
  "Cato",
  "Dara",
  "Eli",
  "Faye",
  "Gus",
  "Hana",
  "Iker",
  "Juno",
  "Kai",
  "Lior",
  "Mina",
  "Nico",
  "Odette",
  "Pax",
  "Quinn",
  "Rumi",
  "Sol",
  "Tavi",
  "Uma",
  "Vero",
  "Wren",
  "Xavi",
  "Yara",
  "Zeke",
  "Amara",
  "Bodhi",
  "Cleo",
  "Dex",
  "Esme",
  "Finn",
  "Gia",
  "Hugo",
  "Isla",
  "Jalen",
];

const ADJECTIVES = [
  "Swift",
  "Clever",
  "Bright",
  "Bold",
  "Calm",
  "Keen",
  "Lucky",
  "Quick",
  "Brave",
  "Sunny",
  "Witty",
  "Zesty",
];
const ANIMALS = [
  "Otter",
  "Falcon",
  "Panda",
  "Lynx",
  "Koala",
  "Heron",
  "Badger",
  "Gecko",
  "Bison",
  "Orca",
  "Robin",
  "Fox",
];

function hash(s: string): number {
  let h = 2166136261;
  for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

/** Stable anonymous nickname for "hide names" mode, e.g. "Swift Otter". */
export function nicknameFor(playerId: string): string {
  const h = hash(playerId);
  return `${ADJECTIVES[h % ADJECTIVES.length]} ${ANIMALS[Math.floor(h / ADJECTIVES.length) % ANIMALS.length]}`;
}

/** "Maya" + "r" → "Maya R." */
export function formatStudentName(first: string, lastInitial: string): string {
  const f = first.trim().replace(/\s+/g, " ");
  const l = lastInitial.trim().charAt(0).toUpperCase();
  return l ? `${f} ${l}.` : f;
}

export const TEAM_NAMES = ["Comets", "Rockets", "Planets", "Meteors", "Nebulas", "Galaxies"];

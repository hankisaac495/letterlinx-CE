/** No 0/O, 1/I/L or 5/S look-alikes, so codes read clearly from a projector. */
export const ROOM_CODE_ALPHABET = "ABCDEFGHJKMNPQRTUVWXYZ2346789";
export const ROOM_CODE_LENGTH = 6;

export function generateRoomCode(random: () => number = Math.random): string {
  let code = "";
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_ALPHABET[Math.floor(random() * ROOM_CODE_ALPHABET.length)];
  }
  return code;
}

/** Uppercases and strips spaces/dashes students may type. */
export function normalizeRoomCode(input: string): string {
  return input.toUpperCase().replace(/[\s-]/g, "");
}

export function isValidRoomCode(code: string): boolean {
  return code.length === ROOM_CODE_LENGTH && [...code].every((c) => ROOM_CODE_ALPHABET.includes(c));
}

/**
 * Email + password teacher accounts for schools without a rostering system.
 *
 * Prototype: LocalAccountService keeps accounts in this browser (passwords stored
 * only as salted PBKDF2 hashes). A hosted service (e.g. Supabase Auth) can replace it
 * by implementing AccountService.
 */
export interface Account {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  /** Optional honorific, e.g. "Ms." */
  title: string;
  createdAt: number;
}

export interface SignUpInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  title?: string;
}

export type AccountErrorCode =
  | "emailInvalid"
  | "emailTaken"
  | "passwordTooShort"
  | "nameRequired"
  | "wrongCredentials"
  | "emailNotConfirmed"
  /** Supabase's built-in mailer only sends to project team members. */
  | "emailNotAuthorized"
  | "rateLimited"
  | "resetUnavailable"
  | "linkExpired"
  | "unknown";

export interface SignUpResult {
  account: Account;
  /** True when the teacher must click a link in their email before signing in. */
  needsConfirmation: boolean;
}

export class AccountError extends Error {
  constructor(public code: AccountErrorCode) {
    super(code);
    this.name = "AccountError";
  }
}

export interface AccountService {
  /** "local" = this browser only; "cloud" = hosted accounts (Supabase Auth). */
  readonly kind: "local" | "cloud";
  signUp(input: SignUpInput, redirectTo?: string): Promise<SignUpResult>;
  signIn(email: string, password: string): Promise<Account>;
  signOut(): Promise<void>;
  /** Emails a password-reset link (cloud only). */
  requestPasswordReset(email: string, redirectTo: string): Promise<void>;
  /** Sets a new password for the account signed in from a reset link (cloud only). */
  updatePassword(password: string): Promise<void>;
  resendConfirmation(email: string, redirectTo: string): Promise<void>;
  /** The account currently signed in with the service, if any. */
  current(): Promise<Account | null>;
}

export const MIN_PASSWORD_LENGTH = 8;
const PBKDF2_ITERATIONS = 150_000;

interface StoredAccount extends Account {
  salt: string;
  hash: string;
}

interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase();
export const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizeEmail(email));

const toHex = (buf: ArrayBuffer | Uint8Array) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const fromHex = (hex: string) => new Uint8Array(hex.match(/../g)!.map((h) => parseInt(h, 16)));

async function hashPassword(password: string, salt: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS },
    key,
    256,
  );
  return toHex(bits);
}

/** Constant-time string comparison. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export class LocalAccountService implements AccountService {
  static readonly KEY = "llce:accounts";
  readonly kind = "local" as const;

  constructor(private store: KeyValueStore = globalThis.localStorage) {}

  private load(): StoredAccount[] {
    try {
      return JSON.parse(this.store.getItem(LocalAccountService.KEY) ?? "[]") as StoredAccount[];
    } catch {
      return [];
    }
  }

  private save(accounts: StoredAccount[]) {
    this.store.setItem(LocalAccountService.KEY, JSON.stringify(accounts));
  }

  async signUp(input: SignUpInput): Promise<SignUpResult> {
    validateSignUp(input);
    const email = normalizeEmail(input.email);
    const firstName = input.firstName.trim();
    const lastName = input.lastName.trim();
    const accounts = this.load();
    if (accounts.some((a) => a.email === email)) throw new AccountError("emailTaken");
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const account: StoredAccount = {
      id: `acct_${crypto.randomUUID()}`,
      email,
      firstName,
      lastName,
      title: (input.title ?? "").trim(),
      createdAt: Date.now(),
      salt: toHex(salt),
      hash: await hashPassword(input.password, salt),
    };
    this.save([...accounts, account]);
    return { account: strip(account), needsConfirmation: false };
  }

  async signOut(): Promise<void> {}

  async requestPasswordReset(): Promise<void> {
    throw new AccountError("resetUnavailable");
  }

  async updatePassword(): Promise<void> {
    throw new AccountError("resetUnavailable");
  }

  async resendConfirmation(): Promise<void> {}

  async current(): Promise<Account | null> {
    return null;
  }

  async signIn(email: string, password: string): Promise<Account> {
    const found = this.load().find((a) => a.email === normalizeEmail(email));
    // Hash even when the email is unknown so both failures take similar time.
    const hash = await hashPassword(password, found ? fromHex(found.salt) : new Uint8Array(16));
    if (!found || !safeEqual(hash, found.hash)) throw new AccountError("wrongCredentials");
    return strip(found);
  }

  get(id: string): Account | null {
    const found = this.load().find((a) => a.id === id);
    return found ? strip(found) : null;
  }
}

function strip(a: StoredAccount): Account {
  return {
    id: a.id,
    email: a.email,
    firstName: a.firstName,
    lastName: a.lastName,
    title: a.title,
    createdAt: a.createdAt,
  };
}

/** Shared sign-up checks so both services reject the same input. */
export function validateSignUp(input: SignUpInput): void {
  if (!isValidEmail(input.email)) throw new AccountError("emailInvalid");
  if (input.password.length < MIN_PASSWORD_LENGTH) throw new AccountError("passwordTooShort");
  if (!input.firstName.trim() || !input.lastName.trim()) throw new AccountError("nameRequired");
}

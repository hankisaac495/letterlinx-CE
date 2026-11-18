import type { AuthError, SupabaseClient, User } from "@supabase/supabase-js";
import {
  AccountError,
  normalizeEmail,
  validateSignUp,
  type Account,
  type AccountErrorCode,
  type AccountService,
  type SignUpInput,
  type SignUpResult,
} from "./index";

/** Supabase Auth error codes → our account errors. */
export function mapAuthError(error: Pick<AuthError, "code" | "status" | "message">): AccountError {
  const byCode: Record<string, AccountErrorCode> = {
    invalid_credentials: "wrongCredentials",
    email_not_confirmed: "emailNotConfirmed",
    user_already_exists: "emailTaken",
    email_exists: "emailTaken",
    weak_password: "passwordTooShort",
    email_address_invalid: "emailInvalid",
    email_address_not_authorized: "emailNotAuthorized",
    over_email_send_rate_limit: "rateLimited",
    over_request_rate_limit: "rateLimited",
    otp_expired: "linkExpired",
    flow_state_expired: "linkExpired",
  };
  if (error.code && byCode[error.code]) return new AccountError(byCode[error.code]);
  if (error.status === 429) return new AccountError("rateLimited");
  return new AccountError("unknown");
}

export function accountFromUser(
  user: Pick<User, "id" | "email" | "user_metadata" | "created_at">,
): Account {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  return {
    id: user.id,
    email: user.email ?? "",
    firstName: String(meta.first_name ?? ""),
    lastName: String(meta.last_name ?? ""),
    title: String(meta.title ?? ""),
    createdAt: Date.parse(user.created_at) || Date.now(),
  };
}

/** Teacher accounts on Supabase Auth (email confirmation, password reset, sessions). */
export class SupabaseAccountService implements AccountService {
  readonly kind = "cloud" as const;

  constructor(private client: () => Promise<SupabaseClient>) {}

  async signUp(input: SignUpInput, redirectTo?: string): Promise<SignUpResult> {
    validateSignUp(input);
    const supabase = await this.client();
    const { data, error } = await supabase.auth.signUp({
      email: normalizeEmail(input.email),
      password: input.password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          first_name: input.firstName.trim(),
          last_name: input.lastName.trim(),
          title: (input.title ?? "").trim(),
        },
      },
    });
    if (error) throw mapAuthError(error);
    if (!data.user) throw new AccountError("unknown");
    // With "Confirm email" on, Supabase returns a user but no session (and an obfuscated
    // user with no identities if the email is already registered).
    if (data.user.identities && data.user.identities.length === 0)
      throw new AccountError("emailTaken");
    return { account: accountFromUser(data.user), needsConfirmation: !data.session };
  }

  async signIn(email: string, password: string): Promise<Account> {
    const supabase = await this.client();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizeEmail(email),
      password,
    });
    if (error) throw mapAuthError(error);
    return accountFromUser(data.user);
  }

  async signOut(): Promise<void> {
    const supabase = await this.client();
    await supabase.auth.signOut();
  }

  async requestPasswordReset(email: string, redirectTo: string): Promise<void> {
    const supabase = await this.client();
    const { error } = await supabase.auth.resetPasswordForEmail(normalizeEmail(email), {
      redirectTo,
    });
    if (error) throw mapAuthError(error);
  }

  async updatePassword(password: string): Promise<void> {
    const supabase = await this.client();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw mapAuthError(error);
  }

  async resendConfirmation(email: string, redirectTo: string): Promise<void> {
    const supabase = await this.client();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: normalizeEmail(email),
      options: { emailRedirectTo: redirectTo },
    });
    if (error) throw mapAuthError(error);
  }

  async current(): Promise<Account | null> {
    const supabase = await this.client();
    const { data } = await supabase.auth.getSession();
    return data.session ? accountFromUser(data.session.user) : null;
  }
}

import type { BrowserContext, Route } from "@playwright/test";

/**
 * A tiny in-memory stand-in for Supabase Auth (GoTrue) and the REST API (PostgREST),
 * served through Playwright request interception. Enough for sign-up, email
 * confirmation, password sign-in, sign-out, password reset and owner-scoped tables.
 */
export class FakeSupabase {
  users = new Map<
    string,
    {
      id: string;
      email: string;
      password: string;
      meta: Record<string, string>;
      confirmed: boolean;
    }
  >();
  tables = new Map<string, Record<string, unknown>[]>();
  tokens = new Map<string, string>(); // access token → user id
  recoverRequests: string[] = [];
  private n = 0;

  constructor(private base: string) {}

  async attach(context: BrowserContext) {
    await context.route(`${this.base}/**`, (route) => this.handle(route));
  }

  private userJson(id: string) {
    const u = [...this.users.values()].find((x) => x.id === id)!;
    return {
      id: u.id,
      aud: "authenticated",
      role: "authenticated",
      email: u.email,
      email_confirmed_at: u.confirmed ? new Date().toISOString() : null,
      user_metadata: u.meta,
      app_metadata: { provider: "email" },
      identities: [
        { id: u.id, user_id: u.id, provider: "email", identity_data: { email: u.email } },
      ],
      created_at: new Date().toISOString(),
    };
  }

  /** A session for a user, as GoTrue returns it. */
  session(id: string) {
    const token = `h.${Buffer.from(JSON.stringify({ sub: id, n: ++this.n })).toString("base64url")}.s`;
    this.tokens.set(token, id);
    return {
      access_token: token,
      token_type: "bearer",
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: `r${this.n}`,
      user: this.userJson(id),
    };
  }

  /** What the confirmation link in the email would carry. */
  confirmLinkHash(email: string) {
    const u = this.users.get(email)!;
    u.confirmed = true;
    const s = this.session(u.id);
    return `#access_token=${s.access_token}&expires_at=${s.expires_at}&expires_in=3600&refresh_token=${s.refresh_token}&token_type=bearer&type=signup`;
  }

  private json(route: Route, status: number, body: unknown) {
    return route.fulfill({
      status,
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: body === undefined ? "" : JSON.stringify(body),
    });
  }

  private owner(route: Route): string | null {
    const auth = route.request().headers()["authorization"] ?? "";
    return this.tokens.get(auth.replace(/^Bearer /i, "")) ?? null;
  }

  private async handle(route: Route) {
    const req = route.request();
    if (req.method() === "OPTIONS") {
      return route.fulfill({
        status: 204,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-headers": "*",
          "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
        },
      });
    }
    const url = new URL(req.url());
    const path = url.pathname;
    const body = req.postData() ? JSON.parse(req.postData()!) : {};

    if (path === "/auth/v1/signup") {
      const email = String(body.email).toLowerCase();
      if (this.users.has(email))
        return this.json(route, 422, {
          code: 422,
          error_code: "user_already_exists",
          msg: "User already registered",
        });
      const id = `00000000-0000-4000-8000-${String(this.users.size + 1).padStart(12, "0")}`;
      this.users.set(email, {
        id,
        email,
        password: body.password,
        meta: body.data ?? {},
        confirmed: false,
      });
      return this.json(route, 200, this.userJson(id)); // no session: confirmation required
    }
    if (path === "/auth/v1/token" && url.searchParams.get("grant_type") === "password") {
      const u = this.users.get(String(body.email).toLowerCase());
      if (!u || u.password !== body.password)
        return this.json(route, 400, {
          code: 400,
          error_code: "invalid_credentials",
          msg: "Invalid login credentials",
        });
      if (!u.confirmed)
        return this.json(route, 400, {
          code: 400,
          error_code: "email_not_confirmed",
          msg: "Email not confirmed",
        });
      return this.json(route, 200, this.session(u.id));
    }
    if (path === "/auth/v1/user") {
      const id = this.owner(route);
      return id
        ? this.json(route, 200, this.userJson(id))
        : this.json(route, 401, { code: 401, error_code: "bad_jwt", msg: "invalid" });
    }
    if (path === "/auth/v1/logout")
      return route.fulfill({ status: 204, headers: { "access-control-allow-origin": "*" } });
    if (path === "/auth/v1/recover") {
      this.recoverRequests.push(String(body.email));
      return this.json(route, 200, {});
    }
    if (path === "/auth/v1/resend") return this.json(route, 200, {});

    const table = path.match(/^\/rest\/v1\/(\w+)$/)?.[1];
    if (table) {
      const owner = this.owner(route);
      if (!owner) return this.json(route, 401, { message: "JWT required" });
      const rows = this.tables.get(table) ?? [];
      this.tables.set(table, rows);
      const mine = rows.filter((r) => r.owner_id === owner);
      if (req.method() === "GET") return this.json(route, 200, mine);
      if (req.method() === "POST") {
        for (const item of Array.isArray(body) ? body : [body]) {
          if (item.owner_id !== owner)
            return this.json(route, 403, { message: "row-level security" });
          const idx = rows.findIndex((r) => r.owner_id === owner && r.id === item.id);
          if (idx >= 0) rows[idx] = item;
          else rows.push(item);
        }
        return this.json(route, 201, undefined);
      }
      if (req.method() === "DELETE") {
        const ids = (url.searchParams.get("id") ?? "")
          .replace(/^in\.\(|\)$/g, "")
          .split(",")
          .map((s) => s.replace(/"/g, ""));
        this.tables.set(
          table,
          rows.filter((r) => !(r.owner_id === owner && ids.includes(String(r.id)))),
        );
        return this.json(route, 204, undefined);
      }
    }
    return this.json(route, 404, { message: `fake: ${req.method()} ${path} not handled` });
  }
}

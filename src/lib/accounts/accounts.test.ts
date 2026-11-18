import { AccountError, LocalAccountService, MIN_PASSWORD_LENGTH } from "./index";

function memoryStore() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    m,
  };
}

const input = {
  email: " Pat.Lee@School.org ",
  password: "correct horse",
  firstName: "Pat",
  lastName: "Lee",
  title: "Mx.",
};

describe("LocalAccountService", () => {
  it("signs up and signs in with a normalised email", async () => {
    const svc = new LocalAccountService(memoryStore());
    const { account } = await svc.signUp(input);
    expect(account).toMatchObject({ email: "pat.lee@school.org", firstName: "Pat", title: "Mx." });
    expect(await svc.signIn("PAT.LEE@school.org", "correct horse")).toEqual(account);
    expect(svc.get(account.id)).toEqual(account);
  });

  it("never stores the password itself", async () => {
    const store = memoryStore();
    await new LocalAccountService(store).signUp(input);
    const raw = store.m.get(LocalAccountService.KEY)!;
    expect(raw).not.toContain("correct horse");
    expect(JSON.parse(raw)[0].hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("rejects wrong passwords and unknown emails the same way", async () => {
    const svc = new LocalAccountService(memoryStore());
    await svc.signUp(input);
    await expect(svc.signIn(input.email, "wrong password")).rejects.toMatchObject({
      code: "wrongCredentials",
    });
    await expect(svc.signIn("nobody@school.org", "correct horse")).rejects.toMatchObject({
      code: "wrongCredentials",
    });
  });

  it("validates sign-up input", async () => {
    const svc = new LocalAccountService(memoryStore());
    const code = (p: Promise<unknown>) => p.catch((e: AccountError) => e.code);
    expect(await code(svc.signUp({ ...input, email: "not-an-email" }))).toBe("emailInvalid");
    expect(
      await code(svc.signUp({ ...input, password: "x".repeat(MIN_PASSWORD_LENGTH - 1) })),
    ).toBe("passwordTooShort");
    expect(await code(svc.signUp({ ...input, lastName: " " }))).toBe("nameRequired");
    await svc.signUp(input);
    expect(await code(svc.signUp({ ...input, email: "PAT.LEE@school.org" }))).toBe("emailTaken");
  });
});

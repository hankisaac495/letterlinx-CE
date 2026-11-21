import { expect, test } from "@playwright/test";
import { FAKE_SUPABASE_URL } from "../playwright.cloud.config";
import { FakeSupabase } from "./fakeSupabase";

test("cloud account: sign up, confirm, save a class, see it from another browser", async ({
  browser,
}) => {
  const supabase = new FakeSupabase(FAKE_SUPABASE_URL);

  // --- Computer 1 ---
  const ctx1 = await browser.newContext({ storageState: "e2e/access.json" });
  await supabase.attach(ctx1);
  const page = await ctx1.newPage();
  await page.goto("/auth/email?mode=signup");
  await page.getByLabel("Title").fill("Ms.");
  await page.getByLabel("First name").fill("Avery");
  await page.getByLabel("Last name").fill("Quill");
  await page.getByLabel("Email").fill("avery@example.org");
  await page.getByLabel("Password").fill("correct horse");
  await page.getByRole("button", { name: "Create account" }).last().click();
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
  await expect(page.getByText("avery@example.org")).toBeVisible();

  // Signing in before confirming is refused with a helpful message.
  await page.getByRole("button", { name: "Back to sign in" }).click();
  await page.getByLabel("Email").fill("avery@example.org");
  await page.getByLabel("Password").fill("correct horse");
  await page.getByRole("button", { name: "Sign in" }).last().click();
  await expect(page.getByText(/Confirm your email first/)).toBeVisible();

  // Clicking the confirmation link signs the teacher in.
  await page.goto(`/auth/callback${supabase.confirmLinkHash("avery@example.org")}`);
  await page.waitForURL(/\/teacher$/);
  await expect(page.getByTestId("signed-in-as")).toContainText("Ms. Quill");
  await expect(page.getByTestId("cloud-status")).toContainText("Saved to your account");
  // A new account starts with the sample word sets, saved to the account.
  await expect(page.getByTestId("word-set-card")).toHaveCount(2);

  await page.getByRole("link", { name: "+ Add class" }).click();
  await page.getByLabel("Class name").fill("Science 6");
  await page.getByLabel("Paste names, one per line").fill("Maya Rodriguez\nKenji H");
  await page.getByRole("button", { name: "Add names" }).click();
  await page.getByRole("button", { name: "Save class" }).click();
  await page.waitForURL(/\/teacher$/);
  await expect(page.getByTestId("section-card")).toContainText("Science 6");
  await expect.poll(() => supabase.tables.get("classes")?.length ?? 0).toBe(1);
  expect(JSON.stringify(supabase.tables.get("classes"))).toContain(
    '"first":"Maya","lastInitial":"R"',
  );
  await expect.poll(() => supabase.tables.get("word_sets")?.length ?? 0).toBe(2);

  // Sign out: the teacher's data leaves this browser's dashboard.
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL(/\/$/);

  // --- Computer 2 (fresh browser) ---
  const ctx2 = await browser.newContext({ storageState: "e2e/access.json" });
  await supabase.attach(ctx2);
  const page2 = await ctx2.newPage();
  await page2.goto("/auth/email");
  await page2.getByLabel("Email").fill("AVERY@example.org");
  await page2.getByLabel("Password").fill("wrong password");
  await page2.getByRole("button", { name: "Sign in" }).last().click();
  await expect(page2.getByText(/don’t match/)).toBeVisible();
  await page2.getByLabel("Password").fill("correct horse");
  await page2.getByRole("button", { name: "Sign in" }).last().click();
  await page2.waitForURL(/\/teacher$/);
  await expect(page2.getByTestId("section-card")).toContainText("Science 6");
  await expect(page2.getByTestId("section-card")).toContainText("2 students");
  await expect(page2.getByTestId("word-set-card")).toHaveCount(2); // no duplicate samples

  // Deleting on computer 2 removes it from the account.
  await page2.getByTestId("section-card").getByRole("link", { name: "Edit class" }).click();
  await page2.locator("form").getByRole("button", { name: "Delete", exact: true }).click();
  await page2.getByRole("dialog").getByRole("button", { name: "Delete" }).click();
  await expect.poll(() => supabase.tables.get("classes")?.length ?? 0).toBe(0);

  await ctx1.close();
  await ctx2.close();
});

test("forgot password sends a reset request", async ({ browser }) => {
  const supabase = new FakeSupabase(FAKE_SUPABASE_URL);
  const ctx = await browser.newContext({ storageState: "e2e/access.json" });
  await supabase.attach(ctx);
  const page = await ctx.newPage();
  await page.goto("/auth/email");
  await page.getByRole("link", { name: "Forgot your password?" }).click();
  await page.locator("#forgot-email").fill("someone@example.org");
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByText(/a reset link is on its way/)).toBeVisible();
  expect(supabase.recoverRequests).toEqual(["someone@example.org"]);
  await ctx.close();
});

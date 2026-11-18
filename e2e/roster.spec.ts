import { expect, test } from "@playwright/test";
import { signIn } from "./helpers";

test("mock Clever sign-in shows the teacher's seeded classes", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Log in with Clever" }).click();
  await expect(
    page.getByRole("heading", { name: /would like to access your rosters/ }),
  ).toBeVisible();
  await expect(page.getByText("Simulated", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Allow" }).click();
  await expect(page.getByRole("button", { name: /Ms\. Quill/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Mx\. Penbrook/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Mr\. Inkwell/ })).toBeVisible();
  await page.getByRole("button", { name: /Ms\. Quill/ }).click();

  await expect(page.getByTestId("signed-in-as")).toContainText("Ms. Quill");
  const cards = page.getByTestId("section-card");
  await expect(cards).toHaveCount(3);
  await expect(cards.first()).toContainText("Life Science 7");
  await expect(cards.first()).toContainText("Period 1");
  await expect(cards.first()).toContainText("24 students");

  await cards.first().getByRole("button", { name: "View roster" }).click();
  await expect(cards.first().locator("li")).toHaveCount(24);
});

test("Google Classroom sign-in, sync roster and sign out", async ({ page }) => {
  await signIn(page, "Mx. Penbrook", "Google Classroom");
  await expect(page.getByTestId("signed-in-as")).toContainText("via Google Classroom");
  await expect(page.getByTestId("section-card")).toHaveCount(4);

  await page.getByRole("button", { name: "Sync roster" }).click();
  await expect(page.getByRole("button", { name: "Syncing…" })).toBeDisabled();
  await expect(page.getByTestId("last-synced")).toContainText("Last synced just now");

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/teacher");
  await expect(page.getByRole("heading", { name: "Sign in to continue" })).toBeVisible();
});

import { expect, test } from "@playwright/test";

test("home page renders the placeholder", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Classroom Edition" })).toBeVisible();
  await expect(page.getByRole("note")).toContainText("Prototype");
});

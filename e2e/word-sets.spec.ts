import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/teacher");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("dashboard starts with the sample word sets", async ({ page }) => {
  await expect(page.getByTestId("word-set-card")).toHaveCount(2);
  await expect(page.getByRole("heading", { name: "Cell Biology" })).toBeVisible();
});

test("create a word set with live validation, preview and shuffle", async ({ page }) => {
  await page.getByRole("link", { name: "+ New word set" }).click();
  await expect(page.getByRole("heading", { name: "New word set" })).toBeVisible();

  // Saving an empty form shows errors and focuses the first problem.
  await page.getByRole("button", { name: "Save word set" }).click();
  await expect(page.getByRole("alert").first()).toContainText("before saving");
  await expect(page.getByLabel("Title")).toBeFocused();
  await expect(page.getByText("Give the word set a title.")).toBeVisible();

  await page.getByLabel("Title").fill("Weather");
  await page.getByLabel("Word 1", { exact: true }).fill("cloud");
  await page.getByLabel("Word 2", { exact: true }).fill("ice storm");
  await page.getByLabel("Word 2", { exact: true }).blur();
  await expect(page.getByText(/Letters only/)).toBeVisible();
  await page.getByLabel("Word 2", { exact: true }).fill("thunderstorm");
  await expect(page.getByText(/at most 9 letters/)).toBeVisible();
  await page.getByLabel("Word 2", { exact: true }).fill("rain");
  await page.getByLabel("Word 3", { exact: true }).fill("rainbow");
  await expect(page.getByText(/RAIN is inside RAINBOW/)).toBeVisible();
  await page.getByLabel("Word 4", { exact: true }).fill("cloud");
  await page.getByLabel("Word 4", { exact: true }).blur();
  await expect(page.getByText("CLOUD is already in the list.")).toBeVisible();
  await page.getByLabel("Word 4", { exact: true }).fill("sleet");
  await expect(page.getByTestId("letter-counter")).toHaveText("21 / 45 letters");

  // Board preview appears and Shuffle changes it.
  const board = page.getByTestId("mini-board");
  await expect(board).toBeVisible();
  const before = await board.getAttribute("data-tiles");
  await page.getByRole("button", { name: "Shuffle board" }).click();
  await expect(board).not.toHaveAttribute("data-tiles", before!);

  // Display options: Allow hints only under Hide the words.
  await expect(page.getByLabel("Allow hints")).toHaveCount(0);
  await page.getByLabel("Hide the words").check();
  await expect(page.getByLabel("Show clues instead of words")).toBeDisabled();
  await page.getByLabel("Allow hints").check();
  await page.getByLabel("Hints per student").selectOption("5");

  await page.getByRole("button", { name: "Save word set" }).click();
  await expect(page).toHaveURL(/\/teacher$/);
  const card = page.getByTestId("word-set-card").filter({ hasText: "Weather" });
  await expect(card).toContainText("4 words · 21 letters · Hidden words · hints");

  // Persisted across reloads.
  await page.reload();
  await expect(page.getByTestId("word-set-card").filter({ hasText: "Weather" })).toBeVisible();
});

test("clue mode requires clues", async ({ page }) => {
  await page.getByRole("link", { name: "+ New word set" }).click();
  await page.getByLabel("Title").fill("Clues");
  for (const [i, w] of ["atom", "cell", "gene"].entries())
    await page.getByLabel(`Word ${i + 1}`, { exact: true }).fill(w);
  await page.getByLabel("Show clues instead of words").check();
  await page.getByRole("button", { name: "Save word set" }).click();
  await expect(page.getByText(/Add a clue for this word/).first()).toBeVisible();
  for (const i of [0, 1, 2])
    await page.getByLabel(`Clue for word ${i + 1} (optional)`).fill(`clue ${i}`);
  await page.getByRole("button", { name: "Save word set" }).click();
  await expect(page).toHaveURL(/\/teacher$/);
});

test("edit, duplicate and delete", async ({ page }) => {
  const card = page.getByTestId("word-set-card").filter({ hasText: "Cell Biology" });
  await card.getByRole("button", { name: "Duplicate" }).click();
  await expect(page.getByRole("heading", { name: "Edit word set" })).toBeVisible();
  await expect(page.getByLabel("Title")).toHaveValue("Cell Biology (copy)");
  await page.getByLabel("Title").fill("Cells v2");
  await page.getByRole("button", { name: "Save word set" }).click();
  await expect(page.getByTestId("word-set-card")).toHaveCount(3);

  const copy = page.getByTestId("word-set-card").filter({ hasText: "Cells v2" });
  await copy.getByRole("button", { name: "Delete Cells v2" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click();
  await expect(page.getByTestId("word-set-card")).toHaveCount(2);
});

test("practice a saved word set", async ({ page }) => {
  await page
    .getByTestId("word-set-card")
    .filter({ hasText: "La casa" })
    .getByRole("link", { name: "Practice" })
    .click();
  await expect(page.getByRole("link", { name: "Use a sample instead" })).toBeVisible();
  await page.getByRole("button", { name: "Start round" }).click();
  await expect(page.locator('[data-word="NIÑO"]')).toBeVisible();
  await expect(page.locator('[data-word="JARDIN"]')).toContainText("JARDÍN");
});

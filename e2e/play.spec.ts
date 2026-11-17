import { expect, test } from "@playwright/test";
import { dragPath, findPath, readTiles } from "./helpers";

test("find every word in Show the full list mode", async ({ page }) => {
  await page.goto("/play");
  await page
    .getByLabel("Untimed")
    .check()
    .catch(() => undefined);
  await page.getByRole("combobox").selectOption("untimed");
  await page.getByRole("button", { name: "Start round" }).click();

  const words = await page
    .locator("[data-word]")
    .evaluateAll((els) => els.map((e) => e.getAttribute("data-word")!));
  expect(words).toHaveLength(6);
  const tiles = await readTiles(page);

  // A wrong word is a gentle miss with no points.
  await dragPath(page, [0, 1, 2]);
  await expect(page.getByTestId("score")).toHaveText("0");

  for (const word of words) {
    const path = findPath(tiles, word);
    expect(path, word).not.toBeNull();
    await dragPath(page, path!);
    await expect(page.locator(`[data-word="${word}"]`)).toHaveAttribute("data-found", "true");
  }
  await expect(page.getByTestId("result")).toContainText("All words found!");
  expect(Number(await page.getByTestId("score").textContent())).toBeGreaterThan(0);
});

test("one at a time shows only the current word", async ({ page }) => {
  await page.goto("/play");
  await page.getByLabel("Show one at a time").check();
  await page.getByRole("button", { name: "Start round" }).click();
  const first = await page.locator("[data-current-word]").getAttribute("data-current-word");
  const tiles = await readTiles(page);
  await dragPath(page, findPath(tiles, first!)!);
  await expect(page.locator("[data-current-word]")).toHaveCount(1);
  await expect(page.locator("[data-current-word]")).not.toHaveAttribute(
    "data-current-word",
    first!,
  );
  await expect(page.getByText("Word 2 of 6")).toBeVisible();
});

test("hide the words with hints", async ({ page }) => {
  await page.goto("/play");
  await page.getByLabel("Hide the words").check();
  await page.getByLabel("Allow hints").check();
  await expect(page.getByLabel("Show clues instead of words")).toBeDisabled();
  await page.getByRole("button", { name: "Start round" }).click();

  await expect(page.locator("[data-found-counter]")).toHaveText("0 of 6 found");
  await expect(page.locator("[data-word]")).toHaveCount(0);
  const hint = page.getByTestId("hint-button");
  await expect(hint).toHaveText(/3 left/);
  await hint.click();
  await expect(page.locator("[data-hint-tile]").first()).toBeAttached();
  await expect(hint).toBeDisabled(); // 10 s cooldown
  await expect(hint).toHaveText(/\ds/);
});

test("clue mode shows clues until the word is found", async ({ page }) => {
  await page.goto("/play");
  await page.getByLabel("Show clues instead of words").check();
  await page.getByRole("button", { name: "Start round" }).click();
  await expect(page.getByText("The basic unit of life")).toBeVisible();
  await expect(page.locator('[data-word="CELL"]')).not.toContainText("CELL");
  const tiles = await readTiles(page);
  await dragPath(page, findPath(tiles, "CELL")!);
  await expect(page.locator('[data-word="CELL"]')).toContainText("CELL");
});

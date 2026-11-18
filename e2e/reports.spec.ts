import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { dragPath, findPath, readTiles, signIn } from "./helpers";

test("a played round is saved and the report shows students, words and CSV", async ({
  page: projector,
  context,
}) => {
  await signIn(projector);
  await projector
    .getByTestId("section-card")
    .first()
    .getByRole("link", { name: "Launch round" })
    .click();
  await projector.getByRole("button", { name: "Open projector" }).click();
  await projector.waitForURL(/projector/);
  const code = projector.url().split("/").pop()!;

  const student = await context.newPage();
  await student.goto(`/join?code=${code}`);
  await student.getByRole("button", { name: "Next" }).click();
  const pick = student.getByLabel("Class list").getByRole("button").first();
  const name = (await pick.textContent())!.trim();
  await pick.click();
  await expect(student.getByTestId("lobby-name")).toHaveText(name);

  await projector.getByRole("button", { name: "Start round" }).click();
  await expect(student.getByTestId("countdown")).toBeVisible();
  await expect(student.getByTestId("countdown")).toBeHidden({ timeout: 6000 });
  const words = await student
    .locator("[data-word]")
    .evaluateAll((els) => els.map((e) => e.getAttribute("data-word")!));
  const tiles = await readTiles(student);
  for (const w of words.slice(0, 2)) await dragPath(student, findPath(tiles, w)!);
  await expect(projector.getByTestId("leaderboard")).toContainText(`${name}2/6`);

  await projector.getByRole("button", { name: "End round" }).click();
  await projector.getByRole("button", { name: "Confirm end round" }).click();
  await projector.getByRole("link", { name: "View report" }).click();

  await expect(projector.getByRole("heading", { name: "Cell Biology" })).toBeVisible();
  await expect(projector.getByTestId("stat-students")).toHaveText("1");
  const row = projector.getByTestId("students-table").locator("tbody tr").first();
  await expect(row).toContainText(name);
  await expect(row).toContainText("2/6");
  await expect(projector.getByTestId("words-table").locator("tbody tr")).toHaveCount(6);
  await expect(projector.getByTestId("review-callout")).toBeVisible(); // 4 words found by 0%

  const [download] = await Promise.all([
    projector.waitForEvent("download"),
    projector.getByRole("button", { name: "Export students CSV" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^letterlinx-cell-biology-.*-students\.csv$/);
  const csv = await readFile((await download.path())!, "utf8");
  expect(csv).toContain("Rank,Student,Simulated,Score");
  expect(csv).toContain(name);

  const [wordsDownload] = await Promise.all([
    projector.waitForEvent("download"),
    projector.getByRole("button", { name: "Export words CSV" }).click(),
  ]);
  const wordsCsv = await readFile((await wordsDownload.path())!, "utf8");
  expect(wordsCsv.split("\r\n").filter(Boolean)).toHaveLength(7);

  // The section overview lists the round.
  await projector.getByRole("link", { name: "← Reports" }).click();
  await expect(projector.getByTestId("rounds-count")).toHaveText("1 round played");
  await expect(projector.getByTestId("rounds-table").locator("tbody tr")).toHaveCount(1);
});

test("sample history shows rounds over time for a class", async ({ page }) => {
  await signIn(page);
  await page.getByRole("link", { name: "Reports", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Reports" })).toBeVisible();
  await expect(page.getByText("No rounds yet for this class.")).toBeVisible();
  await page.getByRole("button", { name: "Add sample history" }).click();
  await expect(page.getByTestId("rounds-count")).toHaveText("6 rounds played");
  await expect(page.getByRole("img", { name: /Bar chart of words found per round/ })).toBeVisible();
  await page.getByTestId("rounds-table").getByRole("link", { name: "View" }).first().click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Sample");
  await expect(page.getByTestId("students-table").locator("tbody tr").first()).toBeVisible();
});

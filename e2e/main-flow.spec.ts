import { expect, test } from "@playwright/test";
import { dragPath, findPath, readTiles, signIn } from "./helpers";

/**
 * The main flow end to end: create a word set, launch a round, join as a
 * student, find all words, view the report.
 */
test("create a word set → launch → join → find all words → report", async ({
  page: teacher,
  context,
}) => {
  await signIn(teacher);

  // Create a word set.
  await teacher.getByRole("link", { name: "+ New word set" }).click();
  await teacher.getByLabel("Title").fill("Weather words");
  const words = ["cloud", "storm", "rain", "wind"];
  for (const [i, w] of words.entries())
    await teacher.getByLabel(`Word ${i + 1}`, { exact: true }).fill(w);
  await teacher.getByRole("button", { name: "Save word set" }).click();
  await expect(teacher).toHaveURL(/\/teacher$/);

  // Launch it for a class.
  await teacher
    .getByTestId("word-set-card")
    .filter({ hasText: "Weather words" })
    .getByRole("link", { name: "Launch" })
    .click();
  await teacher.getByRole("combobox", { name: "Timer" }).selectOption("untimed");
  await teacher.getByRole("button", { name: "Open projector" }).click();
  await teacher.waitForURL(/\/projector\/[A-Z0-9]{6}$/);
  const code = teacher.url().split("/").pop()!;

  // Join as a student.
  const student = await context.newPage();
  await student.goto(`/join?code=${code}`);
  await student.getByRole("button", { name: "Next" }).click();
  const pick = student.getByLabel("Class list").getByRole("button").first();
  const name = (await pick.textContent())!.trim();
  await pick.click();
  await expect(teacher.getByTestId("lobby-player")).toHaveText([name]);

  // Play: find every word.
  await teacher.getByRole("button", { name: "Start round" }).click();
  await expect(student.getByTestId("countdown")).toBeVisible();
  await expect(student.getByTestId("countdown")).toBeHidden({ timeout: 6000 });
  const tiles = await readTiles(student);
  for (const w of words) await dragPath(student, findPath(tiles, w.toUpperCase())!);
  await expect(student.getByTestId("result")).toContainText("All words found!");

  // Round ends (everyone finished); open the report.
  await expect(teacher.getByRole("heading", { name: "Round over" })).toBeVisible();
  await teacher.getByRole("link", { name: "View report" }).click();
  await expect(teacher.getByRole("heading", { name: "Weather words" })).toBeVisible();
  const row = teacher.getByTestId("students-table").locator("tbody tr").first();
  await expect(row).toContainText(name);
  await expect(row).toContainText("4/4");
  await expect(row).toContainText("Yes ·");
});

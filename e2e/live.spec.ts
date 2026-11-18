import { expect, test, type Page } from "@playwright/test";
import { dragPath, findPath, readTiles, signIn } from "./helpers";

async function launch(page: Page, setTitle: string, configure?: (p: Page) => Promise<void>) {
  await signIn(page);
  await page
    .getByTestId("word-set-card")
    .filter({ hasText: setTitle })
    .getByRole("link", { name: "Launch" })
    .click();
  await expect(page.getByRole("heading", { name: "Launch a live round" })).toBeVisible();
  await configure?.(page);
  await page.getByRole("button", { name: "Open projector" }).click();
  await expect(page).toHaveURL(/\/projector\/[A-Z0-9]{6}$/);
  return page.url().split("/").pop()!;
}

test("a student joins, plays and the projector stays in sync", async ({
  page: projector,
  context,
}) => {
  const code = await launch(projector, "Cell Biology");
  await expect(projector.getByTestId("room-code")).toHaveAttribute(
    "aria-label",
    `Room code ${code.split("").join(" ")}`,
  );

  await expect(projector.getByText("Life Science 7 · Period 1").first()).toBeVisible();

  const student = await context.newPage();
  await student.goto(`/join?code=${code}`);
  await student.getByRole("button", { name: "Next" }).click();
  // The room is for a class: students tap their name from the roster.
  const firstName = student.getByLabel("Class list").getByRole("button").first();
  const name = (await firstName.textContent())!.trim();
  await firstName.click();
  await expect(student.getByTestId("lobby-name")).toHaveText(name);
  await expect(projector.getByTestId("lobby-player")).toHaveText([name]);

  await projector.getByRole("button", { name: "Start round" }).click();
  await expect(student.getByTestId("countdown")).toBeVisible();
  await expect(student.getByTestId("countdown")).toBeHidden({ timeout: 6000 });

  const words = await student
    .locator("[data-word]")
    .evaluateAll((els) => els.map((e) => e.getAttribute("data-word")!));
  const tiles = await readTiles(student);
  for (const word of words.slice(0, 2)) await dragPath(student, findPath(tiles, word)!);
  await expect(projector.getByTestId("leaderboard")).toContainText(name);
  await expect(projector.getByTestId("feed")).toContainText(`${name} found ${words[1]}`);

  // Reloading the student tab rejoins with the same progress.
  const score = await student.getByTestId("score").textContent();
  await student.reload();
  await expect(student.getByTestId("score")).toHaveText(score!);
  await expect(student.locator(`[data-word="${words[0]}"]`)).toHaveAttribute("data-found", "true");

  for (const word of words.slice(2)) await dragPath(student, findPath(tiles, word)!);
  // Everyone finished → the round ends and the reveal plays.
  await expect(projector.getByRole("heading", { name: "Round over" })).toBeVisible();
  await expect(projector.getByTestId("reveal-board")).toBeVisible();
  await expect(projector.getByTestId("most-found")).toBeVisible();
  await expect(student.getByTestId("final-rank")).toHaveText("You placed #1 of 1");
});

test("simulate class, hidden words, pause, hide names and end round", async ({
  page: projector,
}) => {
  await launch(projector, "Cell Biology", async (p) => {
    await p.getByLabel("Hide the words").check();
    await p.getByLabel("Allow hints").check();
  });
  await projector.getByRole("button", { name: "Simulate class" }).first().click();
  // With a class, simulated students come from its roster (80% of 24).
  await expect(projector.getByTestId("player-count")).toHaveText("19", { timeout: 8000 });
  await projector.getByRole("button", { name: "Start round" }).click();

  await expect(projector.getByTestId("leaderboard").locator("li")).toHaveCount(6, {
    timeout: 8000,
  });
  await expect(projector.getByTestId("feed")).toContainText("found a word", { timeout: 20_000 });
  // Hidden mode never shows target words before the end.
  for (const w of ["NUCLEUS", "PROTEIN", "MEMBRANE", "OSMOSIS"]) {
    await expect(projector.getByTestId("projector-side")).not.toContainText(w);
  }
  await expect(projector.getByTestId("hints-used")).toBeVisible();

  await projector.getByRole("button", { name: "Pause" }).click();
  await expect(projector.getByTestId("projector-paused")).toBeVisible();
  const frozen = await projector.getByTestId("projector-timer").textContent();
  await projector.waitForTimeout(1500);
  await expect(projector.getByTestId("projector-timer")).toHaveText(frozen!);
  await projector.getByRole("button", { name: "Resume" }).click();

  const firstName = await projector.getByTestId("leaderboard").locator("li").first().textContent();
  await projector.getByRole("button", { name: "Hide names" }).click();
  await expect(projector.getByRole("button", { name: "Hide names" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(projector.getByTestId("leaderboard")).not.toContainText(
    firstName!.replace(/^\d+/, "").split(/\d/)[0],
  );

  await projector.getByRole("button", { name: "End round" }).click();
  await projector.getByRole("button", { name: "Confirm end round" }).click();
  await expect(projector.getByRole("heading", { name: "Round over" })).toBeVisible();
  await expect(projector.getByText("NUCLEUS").first()).toBeVisible(); // revealed now
});

test("team mode shows team totals", async ({ page: projector }) => {
  await launch(projector, "Cell Biology", async (p) => {
    await p
      .getByLabel("Class", { exact: true })
      .selectOption({ label: "No class · anyone with the code types a name" });
    await p.getByLabel("Team mode (auto-split students)").check();
    await p.getByLabel("Number of teams").selectOption("3");
  });
  await projector.getByRole("button", { name: "Simulate class" }).first().click();
  await expect(projector.getByTestId("player-count")).toHaveText("18", { timeout: 8000 });
  await projector.getByRole("button", { name: "Start round" }).click();
  const teams = projector.getByTestId("team-standings").locator("li");
  await expect(teams).toHaveCount(3);
  await expect(teams.first()).toContainText("6 players");
});

test("without a class, students type their name", async ({ page: projector, context }) => {
  const code = await launch(projector, "Cell Biology", async (p) => {
    await p
      .getByLabel("Class", { exact: true })
      .selectOption({ label: "No class · anyone with the code types a name" });
  });
  const student = await context.newPage();
  await student.goto(`/join?code=${code}`);
  await student.getByRole("button", { name: "Next" }).click();
  await student.getByLabel("First name").fill("Maya");
  await student.getByLabel("Last initial").fill("r");
  await student.getByRole("button", { name: "Join" }).click();
  await expect(student.getByTestId("lobby-name")).toHaveText("Maya R.");
  await expect(projector.getByTestId("lobby-player")).toHaveText(["Maya R."]);
});

test("Clever badge sign-in drops the student into their class's round", async ({
  page: projector,
  context,
}) => {
  await launch(projector, "Cell Biology");
  const student = await context.newPage();
  await student.goto("/join/badge");
  await student.getByLabel("Class", { exact: true }).selectOption({ index: 0 }); // Ms. Quill · Life Science 7 · Period 1
  const badge = student.getByLabel("Demo badges").getByRole("button").nth(2);
  const name = (await badge.textContent())!.trim();
  await badge.click();
  await expect(student.getByTestId("lobby-name")).toHaveText(name, { timeout: 8000 });
  await expect(projector.getByTestId("lobby-player")).toHaveText([name]);
});

test("joining a room that isn't open shows a helpful error", async ({ page }) => {
  await page.goto("/join");
  await page.getByLabel("Room code").fill("ZZZZZZ");
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByText(/couldn’t find that room/)).toBeVisible({ timeout: 6000 });
});

test("simulated students never duplicate a student who already joined", async ({
  page: projector,
  context,
}) => {
  const code = await launch(projector, "Cell Biology");
  const student = await context.newPage();
  await student.goto(`/join?code=${code}`);
  await student.getByRole("button", { name: "Next" }).click();
  await student.getByLabel("Class list").getByRole("button").first().click();
  await expect(projector.getByTestId("player-count")).toHaveText("1");
  await projector.getByRole("button", { name: "Simulate class" }).first().click();
  await expect(projector.getByTestId("player-count")).toHaveText("20", { timeout: 8000 });
  const names = await projector.getByTestId("lobby-player").allTextContents();
  expect(new Set(names).size).toBe(names.length);
});

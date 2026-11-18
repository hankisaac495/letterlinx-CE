import { expect, test } from "@playwright/test";

async function fresh(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
}

test("ClassLink sign-in shows OneRoster classes, and a QuickCard joins the class round", async ({
  page,
  context,
}) => {
  await fresh(page);
  await page.getByRole("link", { name: "Log in with ClassLink" }).click();
  await expect(page.getByText("ClassLink", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Allow" }).click();
  await expect(page.getByText("Cedar Hollow Demo Academy · Riverbend Demo Unified")).toBeVisible();
  await page.getByRole("button", { name: /Ms\. Fernwood/ }).click();
  await page.waitForURL(/\/teacher$/);

  await expect(page.getByTestId("signed-in-as")).toContainText("Ms. Fernwood");
  await expect(page.getByTestId("signed-in-as")).toContainText("via ClassLink");
  const cards = page.getByTestId("section-card");
  await expect(cards).toHaveCount(3);
  await expect(cards.first()).toContainText("Biology 9");
  await expect(cards.first()).toContainText("28 students");

  await cards.first().getByRole("link", { name: "Launch round" }).click();
  await page.getByRole("button", { name: "Open projector" }).click();
  await page.waitForURL(/\/projector\//);
  await expect(page.getByText("Biology 9 · Period 1").first()).toBeVisible();

  const student = await context.newPage();
  await student.goto("/join");
  await student.getByRole("link", { name: "Log in with ClassLink QuickCard" }).click();
  await student
    .getByRole("combobox", { name: "Class" })
    .selectOption({ label: "Ms. Fernwood · Biology 9 · Period 1" });
  const card = student.getByLabel("Demo QuickCards").getByRole("button").first();
  const name = (await card.textContent())!.trim();
  await card.click();
  await expect(student.getByTestId("lobby-name")).toHaveText(name, { timeout: 10_000 });
  await expect(page.getByTestId("lobby-player")).toHaveText([name]);
});

test("email account: create, add a class by pasting names, run a round, sign back in", async ({
  page,
  context,
}) => {
  await fresh(page);
  await page.getByRole("link", { name: "create an account" }).click();
  await expect(page.getByRole("heading", { name: "Create a teacher account" })).toBeVisible();
  await page.getByLabel("Title").fill("Mx.");
  await page.getByLabel("First name").fill("Pat");
  await page.getByLabel("Last name").fill("Lee");
  await page.getByLabel("Email").fill("pat.lee@example.org");
  await page.getByLabel("Password").fill("short");
  await page.getByRole("button", { name: "Create account" }).last().click();
  await expect(page.getByText("Use a password with at least 8 characters.")).toBeVisible();
  await page.getByLabel("Password").fill("correct horse");
  await page.getByRole("button", { name: "Create account" }).last().click();
  await page.waitForURL(/\/teacher$/);
  await expect(page.getByTestId("signed-in-as")).toContainText("Mx. Lee");
  await expect(page.getByText("No classes yet.")).toBeVisible();

  // Add a class by pasting names.
  await page.getByRole("link", { name: "+ Add class" }).click();
  await page.getByRole("button", { name: "Save class" }).click();
  await expect(page.getByText("Give the class a name.")).toBeVisible();
  await page.getByLabel("Class name").fill("Homeroom 5");
  await page.getByLabel("Period").fill("2");
  await page
    .getByLabel("Paste names, one per line")
    .fill("Maya Rodriguez\nKenji H\nLopez, Ana\n12345");
  await page.getByRole("button", { name: "Add names" }).click();
  await expect(page.getByTestId("student-row")).toHaveCount(3);
  await expect(page.getByText("Skipped: 12345")).toBeVisible();
  await expect(page.getByTestId("student-count")).toHaveText("3 / 60 students");
  await page.getByRole("button", { name: "Save class" }).click();
  await page.waitForURL(/\/teacher$/);
  const card = page.getByTestId("section-card");
  await expect(card).toHaveCount(1);
  await expect(card).toContainText("Homeroom 5");
  await expect(card).toContainText("3 students");

  // Run a round: the student picks a typed-in name.
  await card.getByRole("link", { name: "Launch round" }).click();
  await page.getByRole("button", { name: "Open projector" }).click();
  await page.waitForURL(/\/projector\/[A-Z0-9]{6}$/);
  const code = page.url().split("/").pop()!;
  const student = await context.newPage();
  await student.goto(`/join?code=${code}`);
  await student.getByRole("button", { name: "Next" }).click();
  await expect(student.getByLabel("Class list").getByRole("button")).toHaveText([
    "Maya R.",
    "Kenji H.",
    "Ana L.",
  ]);
  await student.getByRole("button", { name: "Kenji H." }).click();
  await expect(page.getByTestId("lobby-player")).toHaveText(["Kenji H."]);

  // Sign out, then back in with the password.
  await page.goto("/teacher");
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.getByRole("link", { name: "Sign in with email" }).click();
  await page.getByLabel("Email").fill("PAT.LEE@example.org");
  await page.getByLabel("Password").fill("wrong password");
  await page.getByRole("button", { name: "Sign in" }).last().click();
  await expect(page.getByText(/don’t match/)).toBeVisible();
  await page.getByLabel("Password").fill("correct horse");
  await page.getByRole("button", { name: "Sign in" }).last().click();
  await page.waitForURL(/\/teacher$/);
  await expect(page.getByTestId("section-card")).toContainText("Homeroom 5");

  // Edit the class: remove a student.
  await page.getByTestId("section-card").getByRole("link", { name: "Edit class" }).click();
  await page.getByRole("button", { name: "Remove student 3" }).click();
  await page.getByRole("button", { name: "Save class" }).click();
  await expect(page.getByTestId("section-card")).toContainText("2 students");
});

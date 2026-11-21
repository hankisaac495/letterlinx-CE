import { expect, test } from "@playwright/test";
import { signIn } from "./helpers";

test.describe("projector readability", () => {
  for (const viewport of [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1280, height: 720 },
  ]) {
    test(`board letters are at least 6% of screen height at ${viewport.width}×${viewport.height}`, async ({
      browser,
    }) => {
      const context = await browser.newContext({ viewport, storageState: "e2e/access.json" });
      const page = await context.newPage();
      await signIn(page);
      await page
        .getByTestId("section-card")
        .first()
        .getByRole("link", { name: "Launch round" })
        .click();
      await page.getByRole("button", { name: "Open projector" }).click();
      await page.getByRole("button", { name: "Simulate class" }).first().click();
      await page.getByRole("button", { name: "Start round" }).click();
      const tile = page.getByTestId("mini-board").first().locator("div").first();
      await expect(tile).toBeVisible();
      const fontPx = await tile.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
      expect(fontPx / viewport.height).toBeGreaterThanOrEqual(0.06);
      await context.close();
    });
  }
});

test("interface switches to Spanish and remembers it", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Español" }).click();
  await expect(page.getByRole("heading", { name: "Edición para el aula" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await page.goto("/join");
  await expect(page.getByRole("heading", { name: "Unirse a una ronda" })).toBeVisible();
  await page.getByLabel("Código de sala").fill("bad");
  await page.getByRole("button", { name: "Siguiente" }).click();
  await expect(page.getByText("Escribe el código de 6 caracteres del proyector.")).toBeVisible();
  await page.getByRole("button", { name: "English" }).click();
  await expect(page.getByRole("heading", { name: "Join a round" })).toBeVisible();
});

test("Spanish word-set validation messages", async ({ page }) => {
  await signIn(page);
  await page.getByRole("button", { name: "Español" }).click();
  await page.getByRole("link", { name: "+ Nuevo conjunto" }).click();
  await page.getByRole("button", { name: "Guardar conjunto" }).click();
  await expect(page.getByText("Ponle un título al conjunto de palabras.")).toBeVisible();
  await page.getByLabel("Palabra 1", { exact: true }).fill("x-ray");
  await page.getByLabel("Palabra 1", { exact: true }).blur();
  await expect(page.getByText("Solo letras: quita “-”.")).toBeVisible();
});

test("sound is off by default for students and on for the projector", async ({ page }) => {
  await page.goto("/play");
  await page.getByRole("button", { name: "Start round" }).click();
  await expect(page.getByTestId("sound-toggle-student")).toHaveAttribute("aria-pressed", "false");
  await page.getByTestId("sound-toggle-student").click();
  await expect(page.getByTestId("sound-toggle-student")).toHaveAttribute("aria-pressed", "true");

  await signIn(page);
  await page
    .getByTestId("section-card")
    .first()
    .getByRole("link", { name: "Launch round" })
    .click();
  await page.getByRole("button", { name: "Open projector" }).click();
  await expect(page.getByTestId("sound-toggle-projector")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("Projector volume")).toBeVisible();
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("hints outline tiles steadily instead of flashing", async ({ page }) => {
    await page.goto("/play");
    await page.getByLabel("Hide the words").check();
    await page.getByLabel("Allow hints").check();
    await page.getByRole("button", { name: "Start round" }).click();
    await page.getByTestId("hint-button").click();
    const hinted = page.locator("[data-hint-tile]").first();
    await expect(hinted).toBeVisible();
    const opacity = await hinted.evaluate((el) => getComputedStyle(el).opacity);
    expect(Number(opacity)).toBe(1);
  });
});

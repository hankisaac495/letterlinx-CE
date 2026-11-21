import { expect, test } from "@playwright/test";

// No access cookie: see the gate as a first-time visitor would.
test.use({ storageState: { cookies: [], origins: [] } });

test("the site is behind the demo password, and remembers it", async ({ page, context }) => {
  await page.goto("/");
  const gate = page.getByTestId("site-gate");
  await expect(gate).toBeVisible();
  await expect(
    gate.getByRole("heading", { name: "This prototype is password protected" }),
  ).toBeVisible();
  await expect(gate).toContainText(
    "Need a password? Contact us to request a password, or a guided demo.",
  );
  // The page underneath can't be used (it's inert behind the overlay).
  const underneath = page.getByRole("link", { name: "Log in with Clever", includeHidden: true });
  expect(await underneath.evaluate((el) => el.closest("[inert]") !== null)).toBe(true);

  await page.getByLabel("Password", { exact: true }).fill("wrong");
  await page.getByRole("button", { name: "Enter" }).click();
  await expect(gate.getByRole("alert")).toHaveText("That password isn’t right. Try again.");

  await page.getByLabel("Password", { exact: true }).fill("LLCEdemo");
  await page.getByRole("button", { name: "Enter" }).click();
  await expect(gate).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Log in with Clever" })).toBeVisible();

  // Remembered on reload and on other pages; the password itself isn't stored.
  await page.goto("/join");
  await expect(page.getByTestId("site-gate")).toHaveCount(0);
  const cookies = await context.cookies();
  expect(cookies.find((c) => c.name === "llce_access")?.value).not.toContain("LLCEdemo");
});

test("Contact and Privacy stay open, and the gate links to Contact", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("site-gate").getByRole("link", { name: "Contact us" }).click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(page.getByTestId("site-gate")).toHaveCount(0);
  await expect(page.getByTestId("contact-email")).toBeVisible();
  await page.goto("/privacy");
  await expect(page.getByTestId("site-gate")).toHaveCount(0);
  await page.goto("/teacher");
  await expect(page.getByTestId("site-gate")).toBeVisible();
});

test("the gate is translated", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("site-gate").getByRole("button", { name: "Español" }).click();
  await expect(
    page.getByRole("heading", { name: "Este prototipo está protegido con contraseña" }),
  ).toBeVisible();
  await expect(page.getByTestId("site-gate")).toContainText(
    "¿Necesitas una contraseña? Contáctanos",
  );
  await page.getByTestId("site-gate").getByRole("button", { name: "English" }).click();
});

import { expect, test } from "@playwright/test";
import { signIn } from "./helpers";

const PAGES = [
  { link: "About", heading: "About LetterLinx Classroom Edition", url: /\/about$/ },
  { link: "How to play", heading: "How to play", url: /\/how-to-play$/ },
  { link: "FAQ", heading: "Frequently asked questions", url: /\/faq$/ },
  { link: "Privacy", heading: "Privacy policy", url: /\/privacy$/ },
  { link: "Contact", heading: "Contact us", url: /\/contact$/ },
];

test("footer links open each information page", async ({ page }) => {
  await page.goto("/");
  for (const p of PAGES) {
    await page.getByRole("contentinfo").getByRole("link", { name: p.link, exact: true }).click();
    await expect(page).toHaveURL(p.url);
    await expect(page.getByRole("heading", { level: 1, name: p.heading })).toBeVisible();
    await expect(
      page.getByRole("contentinfo").getByRole("link", { name: p.link, exact: true }),
    ).toHaveAttribute("aria-current", "page");
  }
});

test("contact and privacy show the contact email; pages switch to Spanish", async ({ page }) => {
  await page.goto("/contact");
  await expect(page.getByTestId("contact-email")).toHaveAttribute(
    "href",
    "mailto:info@letterlinx.com",
  );
  await page.goto("/privacy");
  await expect(page.getByRole("link", { name: "info@letterlinx.com" }).first()).toBeVisible();
  await page.getByRole("button", { name: "Español" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Política de privacidad" }),
  ).toBeVisible();
  await expect(
    page.getByRole("contentinfo").getByRole("link", { name: "Privacidad" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "English" }).click();
});

test("FAQ answers expand", async ({ page }) => {
  await page.goto("/faq");
  const q = page.getByText("Do students need accounts or email addresses?");
  await q.click();
  await expect(page.getByText(/Students join with the room code/)).toBeVisible();
});

test("the projector view has no footer", async ({ page }) => {
  await signIn(page);
  await expect(page.getByRole("contentinfo")).toBeVisible();
  await page
    .getByTestId("section-card")
    .first()
    .getByRole("link", { name: "Launch round" })
    .click();
  await page.getByRole("button", { name: "Open projector" }).click();
  await page.waitForURL(/\/projector\//);
  await expect(page.getByRole("contentinfo")).toHaveCount(0);
});

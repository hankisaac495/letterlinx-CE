import { defineConfig, devices } from "@playwright/test";

/**
 * Cloud-account flows against a build that has (placeholder) Supabase settings.
 * The browser answers Supabase requests with an in-test fake (e2e-cloud/fakeSupabase.ts),
 * so no real project or network access is needed.
 */
const PORT = 3300;
export const FAKE_SUPABASE_URL = "https://fake-project.supabase.co";

export default defineConfig({
  testDir: "./e2e-cloud",
  reporter: "list",
  use: { baseURL: `http://localhost:${PORT}`, trace: "off", storageState: "e2e/access.json" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `NEXT_DIST_DIR=.next-cloud npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});

import type { Page } from "@playwright/test";

const COLS = 6;
const ROWS = 9;

/** Reads the board letters from the DOM. */
export async function readTiles(page: Page): Promise<string[]> {
  return page
    .locator("[data-tile]")
    .evaluateAll((els) => els.map((el) => el.getAttribute("data-letter") ?? ""));
}

/** Finds any path spelling `word` (8-direction adjacency, no reuse). */
export function findPath(tiles: string[], word: string): number[] | null {
  const letters = [...word];
  const walk = (path: number[]): number[] | null => {
    if (path.length === letters.length) return path;
    const last = path[path.length - 1];
    const c = last % COLS;
    const r = Math.floor(last / COLS);
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        const nc = c + dc;
        const nr = r + dr;
        if ((dr || dc) && nc >= 0 && nc < COLS && nr >= 0 && nr < ROWS) {
          const i = nr * COLS + nc;
          if (!path.includes(i) && tiles[i] === letters[path.length]) {
            const found = walk([...path, i]);
            if (found) return found;
          }
        }
      }
    return null;
  };
  for (let i = 0; i < tiles.length; i++) {
    if (tiles[i] === letters[0]) {
      const p = walk([i]);
      if (p) return p;
    }
  }
  return null;
}

/** Drags the mouse through the centres of the given tiles. */
export async function dragPath(page: Page, path: number[]) {
  const centre = async (i: number) => {
    const box = await page.locator(`[data-tile="${i}"]`).boundingBox();
    if (!box) throw new Error(`tile ${i} not visible`);
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  };
  const start = await centre(path[0]);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  for (const i of path.slice(1)) {
    const p = await centre(i);
    await page.mouse.move(p.x, p.y, { steps: 4 });
  }
  await page.mouse.up();
}

/** Signs in through the simulated Clever (or Google) flow as a demo teacher. */
export async function signIn(
  page: Page,
  teacher = "Ms. Quill",
  provider: "Clever" | "Google Classroom" = "Clever",
) {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
  await page.getByRole("link", { name: `Log in with ${provider}` }).click();
  await page.getByRole("button", { name: "Allow" }).click();
  await page.getByRole("button", { name: new RegExp(teacher) }).click();
  await page.waitForURL(/\/teacher$/);
}

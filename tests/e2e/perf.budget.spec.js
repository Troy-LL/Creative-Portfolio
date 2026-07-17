import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import {
  bootDesktop,
  openDockApp,
  withScenario,
  assertWindowInDesktop,
} from "./helpers/desktop.js";

const LOG = path.join("docs", "testing", "greybox-log.jsonl");
const BUDGET_MS = 8000;

test("representative open+drag+resize stays under 8000ms each", async ({
  page,
}) => {
  await withScenario(page, { scenario: "perf.open", app: "finder" }, async () => {
    await bootDesktop(page);
    await openDockApp(page, "finder");
    await assertWindowInDesktop(page, ".finder-window");
  });

  await withScenario(page, { scenario: "perf.drag", app: "settings" }, async () => {
    await openDockApp(page, "settings");
    const win = page.locator(".settings-window");
    await expect(win).toHaveClass(/has-explicit-layout/, { timeout: 10_000 });
    const handle = page.locator(".settings-dots");
    const box = await handle.boundingBox();
    await page.mouse.move(box.x + 30, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 100, box.y + 60, { steps: 12 });
    await page.mouse.up();
  });

  await withScenario(page, { scenario: "perf.resize", app: "finder" }, async () => {
    const win = page.locator(".finder-window");
    await expect(win).toBeVisible();
    const handle = win.locator(".mac-window-resize-handle--se");
    const box = await handle.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 50, box.y + 40, { steps: 10 });
    await page.mouse.up();
  });
});

test("greybox log has no scenario over performance budget", async () => {
  test.skip(!fs.existsSync(LOG), "no greybox log yet");
  const lines = fs
    .readFileSync(LOG, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((l) => JSON.parse(l));
  // Failures already assert in their own tests; budget applies to successful scenarios.
  const over = lines.filter(
    (e) =>
      e.signal === "pass" &&
      typeof e.durationMs === "number" &&
      e.durationMs > BUDGET_MS,
  );
  expect(over, JSON.stringify(over, null, 2)).toEqual([]);
});

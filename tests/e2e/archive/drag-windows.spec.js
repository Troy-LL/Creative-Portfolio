import { test, expect } from "@playwright/test";
import {
  bootDesktop,
  openDockApp,
  withScenario,
  assertWindowInDesktop,
} from "./helpers/desktop.js";

test("settings window drags from chrome and stays in workarea", async ({
  page,
}) => {
  await withScenario(
    page,
    { scenario: "window.drag", app: "settings" },
    async () => {
      await bootDesktop(page);
      await openDockApp(page, "settings");
      const win = page.locator(".settings-window");
      await expect(win).toBeVisible();
      await expect(win).toHaveClass(/has-explicit-layout/, { timeout: 10_000 });

      const before = await win.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y };
      });

      // Drag handle is `.settings-dots` (traffic lights strip) — proven Draggable target.
      const handle = page.locator(".settings-dots");
      const box = await handle.boundingBox();
      expect(box).toBeTruthy();
      const startX = box.x + Math.min(40, box.width * 0.5);
      const startY = box.y + box.height / 2;

      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(startX + 120, startY + 80, { steps: 20 });
      await page.mouse.up();

      const after = await win.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y };
      });

      expect(after.x - before.x).toBeGreaterThanOrEqual(40);
      expect(after.y - before.y).toBeGreaterThanOrEqual(40);
      await assertWindowInDesktop(page, ".settings-window");
    },
  );
});

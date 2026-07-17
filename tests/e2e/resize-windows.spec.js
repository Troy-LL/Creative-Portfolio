import { test, expect } from "@playwright/test";
import {
  bootDesktop,
  openDockApp,
  withScenario,
  assertWindowInDesktop,
} from "./helpers/desktop.js";

test("finder window resizes via SE handle and stays in workarea", async ({
  page,
}) => {
  await withScenario(
    page,
    { scenario: "window.resize", app: "finder" },
    async () => {
      await bootDesktop(page);
      await openDockApp(page, "finder");
      const win = page.locator(".finder-window");
      await expect(win).toBeVisible();
      await expect(win).toHaveClass(/has-explicit-layout/, { timeout: 10_000 });

      const handle = win.locator(".mac-window-resize-handle--se");
      await expect(handle).toBeVisible({ timeout: 10_000 });

      const before = await win.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return { width: r.width, height: r.height };
      });

      const box = await handle.boundingBox();
      expect(box).toBeTruthy();
      const x = box.x + box.width / 2;
      const y = box.y + box.height / 2;

      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x + 80, y + 60, { steps: 12 });
      await page.mouse.up();

      const after = await win.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return { width: r.width, height: r.height };
      });

      expect(after.width - before.width).toBeGreaterThanOrEqual(40);
      expect(after.height - before.height).toBeGreaterThanOrEqual(40);
      expect(after.width).toBeGreaterThanOrEqual(400);
      expect(after.height).toBeGreaterThanOrEqual(300);
      await assertWindowInDesktop(page, ".finder-window");
    },
  );
});

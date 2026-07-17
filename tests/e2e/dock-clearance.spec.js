import { test, expect } from "@playwright/test";
import {
  bootDesktop,
  openDockApp,
  withScenario,
} from "./helpers/desktop.js";

test.describe("workarea excludes dock", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test("settings window does not overlap the dock", async ({ page }) => {
    await withScenario(
      page,
      { scenario: "frame.dock-clearance", app: "settings" },
      async () => {
        await bootDesktop(page);
        await openDockApp(page, "settings");
        const win = page.locator(".settings-window");
        await expect(win).toBeVisible();
        await expect(win).toHaveClass(/has-explicit-layout/, { timeout: 10_000 });

        const overlap = await page.evaluate(() => {
          const w = document.querySelector(".settings-window")?.getBoundingClientRect();
          const d = document.querySelector(".desktop-dock")?.getBoundingClientRect();
          const work = document.getElementById("desktop-workarea")?.getBoundingClientRect();
          if (!w || !d || !work) return { error: true };
          return {
            underDock: w.bottom > d.top + 1,
            workOverlapsDock: work.bottom > d.top + 1,
            wBottom: w.bottom,
            dockTop: d.top,
            workBottom: work.bottom,
          };
        });
        expect(overlap.error).toBeFalsy();
        expect(overlap.workOverlapsDock, JSON.stringify(overlap)).toBe(false);
        expect(overlap.underDock, JSON.stringify(overlap)).toBe(false);
      },
    );
  });
});

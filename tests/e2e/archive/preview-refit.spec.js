import { test, expect } from "@playwright/test";
import {
  bootDesktop,
  openDockApp,
  assertWindowInDesktop,
  withScenario,
} from "./helpers/desktop.js";

async function openResumePreview(page) {
  await openDockApp(page, "finder");
  const finder = page.locator(".finder-window");
  await expect(finder).toBeVisible();
  await expect(finder).toHaveClass(/has-explicit-layout/, { timeout: 10_000 });

  const resumeNav = page.locator('.finder-sidebar-item[data-target="Resume"]');
  if (await resumeNav.count()) {
    await resumeNav.click();
  }

  const resumeIcon = page.locator('.finder-icon[data-pdf*="Resume"]').first();
  await expect(resumeIcon).toBeVisible({ timeout: 10_000 });
  await resumeIcon.dblclick();
  await expect(page.locator(".preview-overlay.is-visible")).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.locator(".preview-overlay .preview-window")).toBeVisible();
}

test("resume PDF preview stays in workarea after viewport shrink", async ({
  page,
}) => {
  await withScenario(
    page,
    { scenario: "frame.preview-refit", app: "preview" },
    async () => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await bootDesktop(page);
      await openResumePreview(page);

      // Let open animation settle; managed windows get has-explicit-layout.
      await expect(page.locator(".preview-overlay .preview-window")).toHaveClass(
        /has-explicit-layout/,
        { timeout: 10_000 },
      );

      await page.setViewportSize({ width: 1280, height: 720 });
      await page.waitForTimeout(200);

      await assertWindowInDesktop(page, ".preview-overlay .preview-window");

      const clearance = await page.evaluate(() => {
        const w = document
          .querySelector(".preview-overlay .preview-window")
          ?.getBoundingClientRect();
        const d = document.querySelector(".desktop-dock")?.getBoundingClientRect();
        if (!w || !d) return { error: true };
        return { underDock: w.bottom > d.top + 1, wBottom: w.bottom, dockTop: d.top };
      });
      expect(clearance.error).toBeFalsy();
      expect(clearance.underDock, JSON.stringify(clearance)).toBe(false);
    },
  );
});

test("resume preview body remains text-selectable", async ({ page }) => {
  await withScenario(
    page,
    { scenario: "os.selection.resume", app: "preview" },
    async () => {
      await bootDesktop(page);
      await openResumePreview(page);

      const us = await page
        .locator(".preview-overlay .preview-body")
        .evaluate((el) => getComputedStyle(el).userSelect);
      expect(["text", "auto", "contain"]).toContain(us);
    },
  );
});

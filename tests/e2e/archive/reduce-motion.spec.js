import { test, expect } from "@playwright/test";
import {
  bootDesktop,
  openDockApp,
  withScenario,
} from "./helpers/desktop.js";

async function disableAnimations(page) {
  await bootDesktop(page);
  await page.evaluate(() => {
    localStorage.setItem(
      "portfolio-appearance",
      JSON.stringify({
        themeMode: "dark",
        wallpaper: "default",
        uiFont: "system",
        accent: "#007aff",
        animations: false,
        textScale: 1,
      }),
    );
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await bootDesktop(page);
}

test("settings close is instant when animations are disabled", async ({
  page,
}) => {
  await withScenario(
    page,
    { scenario: "motion.close-instant", app: "settings" },
    async () => {
      await disableAnimations(page);

      await openDockApp(page, "settings");
      const win = page.locator(".settings-window");
      await expect(win).toBeVisible();
      await expect(page.locator("#settingsOverlay")).toHaveClass(/is-visible/);

      const t0 = Date.now();
      await page.locator(".settings-window .mac-close").click();

      // Instant close: no GSAP tween should be running shortly after click.
      await expect
        .poll(
          async () =>
            page.evaluate(() => {
              const w = document.querySelector(".settings-window");
              return typeof gsap !== "undefined" && gsap.isTweening(w);
            }),
          { timeout: 50 },
        )
        .toBe(false);

      await expect(page.locator("#settingsOverlay")).not.toHaveClass(
        /is-visible/,
        { timeout: 1500 },
      );
      const elapsed = Date.now() - t0;
      // Animated close is ~250ms + settle; instant should be well under 200ms wall
      // after click→hidden. Allow CI slack but fail obvious fades.
      expect(elapsed, `close took ${elapsed}ms`).toBeLessThan(400);
    },
  );
});

test("settings open settles without tween when animations disabled", async ({
  page,
}) => {
  await withScenario(
    page,
    { scenario: "motion.open-instant", app: "settings" },
    async () => {
      await disableAnimations(page);

      await openDockApp(page, "settings");
      await page.waitForTimeout(16);
      const tweening = await page.evaluate(() => {
        const w = document.querySelector(".settings-window");
        return typeof gsap !== "undefined" && gsap.isTweening(w);
      });
      expect(tweening).toBe(false);
      await expect(page.locator(".settings-window")).toHaveClass(
        /has-explicit-layout/,
      );
    },
  );
});

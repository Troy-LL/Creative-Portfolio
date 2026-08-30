import { test, expect } from "@playwright/test";
import {
  bootDesktop,
  openDockApp,
  withScenario,
} from "./helpers/desktop.js";

const CASES = [
  {
    app: "settings",
    overlay: "#settingsOverlay",
    win: ".settings-window",
    close: ".settings-dots .mac-close",
    min: ".settings-dots .mac-min",
  },
  {
    app: "finder",
    overlay: "#finderOverlay",
    win: ".finder-window",
    close: ".finder-window-controls .mac-close",
    min: ".finder-window-controls .mac-min",
  },
];

async function assertHitTestable(page, selector) {
  const ok = await page.locator(selector).evaluate((el) => {
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const top = document.elementFromPoint(x, y);
    return Boolean(top && (top === el || el.contains(top)));
  });
  expect(ok, `${selector} center not hit-testable`).toBe(true);
}

for (const c of CASES) {
  test(`${c.app} close control is clickable and closes overlay`, async ({
    page,
  }) => {
    await withScenario(page, { scenario: "chrome.click", app: c.app }, async () => {
      await bootDesktop(page);
      await openDockApp(page, c.app);
      await expect(page.locator(c.overlay)).toHaveClass(/is-visible/);
      await expect(page.locator(c.win)).toBeVisible();

      const closeBtn = page.locator(c.close).first();
      await expect(closeBtn).toBeVisible();
      await assertHitTestable(page, c.close);

      await closeBtn.click();
      await expect(page.locator(c.overlay)).not.toHaveClass(/is-visible/, {
        timeout: 10_000,
      });
    });
  });

  test(`${c.app} min control is clickable and changes window state`, async ({
    page,
  }) => {
    await withScenario(
      page,
      { scenario: "chrome.click-min", app: c.app },
      async () => {
        await bootDesktop(page);
        await openDockApp(page, c.app);
        await expect(page.locator(c.overlay)).toHaveClass(/is-visible/);

        const minBtn = page.locator(c.min).first();
        await expect(minBtn).toBeVisible();
        await assertHitTestable(page, c.min);

        await minBtn.click();
        // Minimize hides overlay visibility or removes focus interactivity.
        await expect
          .poll(async () => {
            const overlay = page.locator(c.overlay);
            const visible = await overlay.evaluate((el) =>
              el.classList.contains("is-visible"),
            );
            const win = page.locator(c.win);
            const display = await win.evaluate((el) =>
              getComputedStyle(el).display,
            );
            const opacity = await win.evaluate((el) =>
              Number(getComputedStyle(el).opacity),
            );
            return !visible || display === "none" || opacity < 0.05;
          }, { timeout: 10_000 })
          .toBe(true);
      },
    );
  });
}

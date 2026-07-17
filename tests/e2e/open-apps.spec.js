import { test, expect } from "@playwright/test";
import {
  bootDesktop,
  openDockApp,
  withScenario,
  assertWindowInDesktop,
} from "./helpers/desktop.js";

const APPS = [
  { app: "settings", overlay: "#settingsOverlay", win: ".settings-window" },
  { app: "contacts", overlay: "#contactsOverlay", win: ".contacts-window" },
  { app: "mail", overlay: "#mailOverlay", win: ".mail-window" },
  { app: "finder", overlay: "#finderOverlay", win: ".finder-window" },
  { app: "safari", overlay: "#safariOverlay", win: ".safari-window" },
  { app: "spotify", overlay: "#spotifyOverlay", win: ".spotify-window" },
];

for (const { app, overlay, win } of APPS) {
  test(`opens ${app} in-frame within desktop workarea`, async ({ page }) => {
    await withScenario(page, { scenario: "open.in-frame", app }, async () => {
      await bootDesktop(page);
      await openDockApp(page, app);

      await expect(page.locator(overlay)).toHaveClass(/is-visible/);
      await expect(page.locator(win)).toBeVisible();
      await assertWindowInDesktop(page, win);
    });
  });
}

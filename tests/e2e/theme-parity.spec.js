import { test, expect } from "@playwright/test";
import { bootDesktop, openDockApp, withScenario } from "./helpers/desktop.js";

async function setThemeMode(page, themeMode) {
  await bootDesktop(page);
  await page.evaluate((mode) => {
    const raw = localStorage.getItem("portfolio-appearance");
    const cur = raw ? JSON.parse(raw) : {};
    localStorage.setItem(
      "portfolio-appearance",
      JSON.stringify({
        themeMode: mode,
        wallpaper: "default",
        uiFont: "system",
        accent: "#007aff",
        animations: false,
        textScale: 1,
        ...cur,
        themeMode: mode,
      }),
    );
  }, themeMode);
  await page.reload({ waitUntil: "domcontentloaded" });
  await bootDesktop(page);
}

test("mail and settings window backgrounds share dark token family", async ({
  page,
}) => {
  await withScenario(page, { scenario: "theme.shell-dark", app: "mail" }, async () => {
    await setThemeMode(page, "dark");
    await openDockApp(page, "mail");
    await openDockApp(page, "settings");
    const colors = await page.evaluate(() => {
      const mail = getComputedStyle(document.querySelector(".mail-window")).backgroundColor;
      const settings = getComputedStyle(document.querySelector(".settings-window")).backgroundColor;
      const token = getComputedStyle(document.body).getPropertyValue("--win-bg").trim();
      return { mail, settings, token };
    });
    // Both should resolve close to --win-bg (same rgb family); exact match preferred
    expect(colors.mail).toBeTruthy();
    expect(colors.settings).toBeTruthy();
    // After migration, backgrounds should match each other
    expect(colors.mail).toBe(colors.settings);
  });
});

test("mail window background changes between light and dark", async ({ page }) => {
  await withScenario(page, { scenario: "theme.shell-toggle", app: "mail" }, async () => {
    await setThemeMode(page, "light");
    await openDockApp(page, "mail");
    const lightBg = await page.locator(".mail-window").evaluate((el) => getComputedStyle(el).backgroundColor);
    await setThemeMode(page, "dark");
    await openDockApp(page, "mail");
    const darkBg = await page.locator(".mail-window").evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(lightBg).not.toBe(darkBg);
  });
});

test("founders cafe data-theme follows desktop dark", async ({ page }) => {
  await withScenario(page, { scenario: "theme.cafe-sync", app: "safari" }, async () => {
    await setThemeMode(page, "dark");
    await openDockApp(page, "safari");
    // Favorites tile: data-safari-href="assets/founders-cafe/index.html"
    const tile = page.locator('[data-safari-href*="founders"]').first();
    await expect(tile).toBeVisible();
    await tile.click();
    const frame = page.frameLocator("#safariFrame");
    await expect
      .poll(async () => {
        return frame.locator("html").evaluate((el) => el.getAttribute("data-theme"));
      }, { timeout: 15000 })
      .toBe("dark");
  });
});

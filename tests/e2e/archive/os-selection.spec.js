import { test, expect } from "@playwright/test";
import { bootDesktop, withScenario } from "./helpers/desktop.js";

test("desktop shell text is not user-selectable", async ({ page }) => {
  await withScenario(page, { scenario: "os.selection", app: "shell" }, async () => {
    await bootDesktop(page);

    const wallpaper = await page
      .locator(".desktop-wallpaper")
      .evaluate((el) => getComputedStyle(el).userSelect);
    const menubar = await page
      .locator(".desktop-menubar")
      .evaluate((el) => getComputedStyle(el).userSelect);

    expect(wallpaper === "none" || wallpaper === "-webkit-none").toBeTruthy();
    expect(menubar === "none" || menubar === "-webkit-none").toBeTruthy();

    // Terminal command field must remain selectable/editable (OS text field).
    const cmd = page.locator("#cmd");
    if (await cmd.count()) {
      const us = await cmd.evaluate((el) => getComputedStyle(el).userSelect);
      expect(["text", "auto", "contain"]).toContain(us);
    }
  });
});

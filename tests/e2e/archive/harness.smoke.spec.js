import { test, expect } from "@playwright/test";
import { bootDesktop, withScenario } from "./helpers/desktop.js";

test("boots desktop shell without gate", async ({ page }) => {
  await withScenario(page, { scenario: "harness.boot", app: "shell" }, async () => {
    await bootDesktop(page);
    await expect(page.locator("#desktop")).toBeVisible();
    await expect(page.locator("#desktopGate")).not.toHaveClass(/desktop-gate--active/);
    await expect(page.locator("body")).not.toHaveClass(/desktop-gate--active/);
  });
});

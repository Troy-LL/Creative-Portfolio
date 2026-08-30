// @ts-check
import { test, expect } from "@playwright/test";

test.describe("redesign stub at root", () => {
  test("root is the redesign stub, not the Mac desktop OS", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("[data-surface='redesign-stub']")).toHaveCount(1);
    await expect(page.locator("#replay")).toBeVisible();
    await expect(page.locator("[data-engine='css']")).toHaveCount(1);
    await expect(page.locator("[data-engine='three']")).toHaveCount(0);
    await expect(page.locator("#desktop")).toHaveCount(0);
  });

  test("archived desktop OS remains reachable", async ({ page }) => {
    await page.goto("/archive/desktop-os/");
    await expect(page).toHaveTitle(/Desktop TL/i);
    await expect(page.locator("#desktop")).toHaveCount(1);
  });
});

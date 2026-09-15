// @ts-check
import { test, expect } from "@playwright/test";

test.describe("card phone copy", () => {
  test("phone copies to clipboard and shows toast", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/?debug=1");

    const phone = page.locator("[data-copy-phone]").first();
    await expect(phone).toBeVisible();
    await expect(phone).toHaveAttribute("data-copy-phone", "0975 644 6519");

    await phone.click();

    await expect(page.locator("[data-card-toast].is-on")).toContainText(/copied/i);
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    expect(clip).toBe("0975 644 6519");
  });
});

// @ts-check
import { test, expect } from "@playwright/test";

test.describe("book route + card URL", () => {
  test("/book serves a booking page", async ({ page }) => {
    await page.goto("/book");
    await expect(page.locator("[data-surface='book']")).toHaveCount(1);
    await expect(page.getByRole("heading", { name: /book a call/i })).toBeVisible();
    await expect(page.locator("[data-book-slot]").first()).toBeVisible();
  });

  test("card URL links to /book", async ({ page }) => {
    await page.goto("/?debug=1");
    const link = page.locator("a.physical-card__ink--url").first();
    await expect(link).toHaveText("troylazaro.dev/book");
    await expect(link).toHaveAttribute("href", "/book");
  });
});

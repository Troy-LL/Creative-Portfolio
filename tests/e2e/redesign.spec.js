// @ts-check
import { test, expect } from "@playwright/test";

test.describe("redesign at root", () => {
  test("root is the redesign, not the Mac desktop OS", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("[data-surface='redesign']")).toHaveCount(1);
    await expect(page.locator("#replay")).toBeVisible();
    await expect(page.locator("[data-engine='css']")).toHaveCount(1);
    await expect(page.locator("[data-engine='three']")).toHaveCount(0);
    await expect(page.locator("#desktop")).toHaveCount(0);
  });

  test("horizontal table sits after the card", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".horizon-welcome")).toHaveText("Welcome.");
    await expect(page.locator(".horizon-station--card .horizon-mark")).toHaveText(
      "01",
    );
    await expect(page.locator(".horizon-station--intro .horizon-mark")).toHaveText(
      "02",
    );
  });

  test("after fold lock, further wheel pans the table left", async ({
    page,
  }) => {
    await page.goto("/?debug=1");
    const track = page.locator(".horizon-track");
    await expect(track).toBeVisible();

    await page.evaluate(async () => {
      const fire = (deltaY) =>
        window.dispatchEvent(
          new WheelEvent("wheel", {
            deltaY,
            deltaMode: 0,
            bubbles: true,
            cancelable: true,
          }),
        );
      const frames = (n) =>
        new Promise((resolve) => {
          let left = n;
          const tick = () => {
            left -= 1;
            if (left <= 0) resolve();
            else requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
      for (let i = 0; i < 16; i += 1) fire(120);
      await frames(12);
      for (let i = 0; i < 50; i += 1) fire(120);
      await frames(10);
    });

    await expect
      .poll(async () =>
        track.evaluate((el) => {
          const x = new DOMMatrix(getComputedStyle(el).transform).m41;
          const scaleX = new DOMMatrix(getComputedStyle(el).transform).a;
          return { x, scaleX };
        }),
      )
      .toMatchObject({ scaleX: 1 });

    const pose = await track.evaluate((el) => {
      const m = new DOMMatrix(getComputedStyle(el).transform);
      return { x: m.m41, y: m.m42, z: m.m43, scaleX: m.a, scaleY: m.d };
    });
    expect(pose.x).toBeLessThan(-80);
    expect(pose.y).toBe(0);
    expect(pose.z).toBe(0);
    expect(pose.scaleX).toBe(1);
    expect(pose.scaleY).toBe(1);
  });

  test("archived desktop OS remains reachable", async ({ page }) => {
    await page.goto("/archive/desktop-os/");
    await expect(page).toHaveTitle(/Desktop TL/i);
    await expect(page.locator("#desktop")).toHaveCount(1);
  });
});

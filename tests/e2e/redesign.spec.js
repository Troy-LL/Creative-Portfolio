// @ts-check
import { test, expect } from "@playwright/test";

test.describe("redesign at root", () => {
  test("root is the redesign, not the Mac desktop OS", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("[data-surface='redesign']")).toHaveCount(1);
    await expect(page.locator(".css-card")).toBeVisible();
    await expect(page.locator("#replay")).toBeAttached();
    await expect(page.locator("[data-engine='css']")).toHaveCount(1);
    await expect(page.locator("[data-engine='three']")).toHaveCount(0);
    await expect(page.locator("#desktop")).toHaveCount(0);
  });

  test("staircase stations sit after the card", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".horizon-welcome")).toHaveCount(0);
    await expect(page.locator('[data-station="01"] .horizon-mark')).toHaveText(
      "01",
    );
    await expect(page.locator('[data-station="02"] .horizon-leg__title')).toHaveText(
      "The thing behind the hatch.",
    );
    await expect(page.locator('[data-station="03"] .horizon-leg__title')).toHaveText(
      "Kept work.",
    );
    await expect(page.locator('[data-station="04"] .horizon-leg__title')).toHaveText(
      "The site this one replaced.",
    );
    await expect(page.locator('[data-station="05"] .horizon-leg__title')).toHaveText(
      "The hand that made the card.",
    );
    await expect(page.locator('[data-station="06"] .horizon-leg__title')).toHaveText(
      "The card has a back. So does this.",
    );
    await expect(page.locator('[data-station="06"] [data-exit-cta]')).toHaveAttribute(
      "href",
      "/book",
    );
    await expect(page.locator('[data-station="04"] .archive-link')).toHaveAttribute(
      "href",
      "/archive/desktop-os/",
    );
  });

  test("site nav jumps between stations", async ({ page }) => {
    await page.goto("/?debug=1");
    const nav = page.locator("[data-site-nav]");
    await expect(nav).toBeVisible();
    await expect(nav).toHaveAttribute("data-revealed", "true");
    await expect(nav.locator(".site-nav__item")).toHaveCount(6);
    await expect(nav.locator('[data-station="02"]')).toHaveText("Flagship");
    await expect(nav.locator('[data-station="06"]')).toHaveText("Exit");
    await expect(nav.locator(".site-nav__tick")).toHaveCount(96);

    await nav.locator('[data-station="04"]').click();
    await expect
      .poll(async () =>
        page.locator(".site-nav__item.is-active").getAttribute("data-station"),
      )
      .toBe("04");

    await nav.locator('[data-station="01"]').click();
    await expect
      .poll(async () =>
        page.locator(".site-nav__item.is-active").getAttribute("data-station"),
      )
      .toBe("01");
  });

  test("after fold lock, further wheel walks the staircase", async ({
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
      for (let i = 0; i < 80; i += 1) fire(120);
      await frames(16);
    });

    await expect
      .poll(async () =>
        track.evaluate((el) => {
          const m = new DOMMatrix(getComputedStyle(el).transform);
          return { x: m.m41, y: m.m42, scaleX: m.a, scaleY: m.d };
        }),
      )
      .toMatchObject({ scaleX: 1, scaleY: 1 });

    const pose = await track.evaluate((el) => {
      const m = new DOMMatrix(getComputedStyle(el).transform);
      return { x: m.m41, y: m.m42, z: m.m43, scaleX: m.a, scaleY: m.d };
    });
    expect(pose.x).toBeLessThan(-80);
    expect(pose.y).toBeLessThanOrEqual(0);
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

import path from "node:path";
import { expect } from "@playwright/test";
import { appendGreyboxLog } from "./greybox-log.js";

/**
 * Load the portfolio and wait until the macOS desktop shell is visible
 * without an active mobile/desktop gate.
 * @param {import("@playwright/test").Page} page
 */
export async function bootDesktop(page) {
  await page.goto("/", { waitUntil: "domcontentloaded" });

  // Boot splash adds desktop--visible after GSAP timeline (~2s); allow CDN settle.
  await page.locator("#desktop.desktop--visible").waitFor({
    state: "visible",
    timeout: 30_000,
  });

  // Prefer class/event waits over sleeps: splash removal + busy clear.
  await page
    .locator("body.boot-splash--active")
    .waitFor({ state: "detached", timeout: 30_000 })
    .catch(() => {});
  await page.locator("#bootSplash").waitFor({ state: "detached", timeout: 30_000 }).catch(() => {});

  await expect(page.locator("html")).not.toHaveAttribute("data-gate", "active");
  await expect(page.locator("body")).not.toHaveClass(/desktop-gate--active/);
}

/**
 * @param {import("@playwright/test").Page} page
 * @param {string} app dock data-app value
 */
export async function openDockApp(page, app) {
  await page.locator(`.dock-icon[data-app="${app}"]`).click();
}

/**
 * Assert a bounding box lies fully inside a frame box (2px tolerance default).
 * @param {{ x: number, y: number, width: number, height: number }} box
 * @param {{ x: number, y: number, width: number, height: number }} frameBox
 * @param {number} [tolerance=2]
 */
export function assertInFrame(box, frameBox, tolerance = 2) {
  const left = box.x;
  const top = box.y;
  const right = box.x + box.width;
  const bottom = box.y + box.height;
  const frameLeft = frameBox.x - tolerance;
  const frameTop = frameBox.y - tolerance;
  const frameRight = frameBox.x + frameBox.width + tolerance;
  const frameBottom = frameBox.y + frameBox.height + tolerance;

  if (left < frameLeft || top < frameTop || right > frameRight || bottom > frameBottom) {
    throw new Error(
      `box [${left},${top},${right},${bottom}] outside frame ` +
        `[${frameLeft},${frameTop},${frameRight},${frameBottom}] (tol=${tolerance})`,
    );
  }
}

/**
 * Time a scenario, append greybox JSONL, screenshot on fail.
 * @param {import("@playwright/test").Page} page
 * @param {{ scenario: string, app: string }} meta
 * @param {() => Promise<void>} fn
 */
export async function withScenario(page, meta, fn) {
  const started = Date.now();
  let screenshot;

  try {
    await fn();
    const durationMs = Date.now() - started;
    appendGreyboxLog({
      scenario: meta.scenario,
      app: meta.app,
      signal: "pass",
      durationMs,
      detail: "ok",
    });
  } catch (err) {
    const durationMs = Date.now() - started;
    const safeName = `${meta.scenario}-${meta.app}`.replace(/[^\w.-]+/g, "_");
    screenshot = path.join("docs", "testing", "proof", `${safeName}-fail.png`);
    try {
      await page.screenshot({ path: screenshot, fullPage: true });
    } catch {
      screenshot = undefined;
    }
    appendGreyboxLog({
      scenario: meta.scenario,
      app: meta.app,
      signal: "fail",
      durationMs,
      detail: err instanceof Error ? err.message : String(err),
      ...(screenshot ? { screenshot } : {}),
    });
    throw err;
  }
}

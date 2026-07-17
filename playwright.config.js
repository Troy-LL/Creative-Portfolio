// @ts-check
import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PORTFOLIO_BASE_URL || "http://127.0.0.1:4173";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  use: {
    baseURL,
    ...devices["Desktop Chrome"],
    viewport: { width: 1440, height: 900 },
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
});

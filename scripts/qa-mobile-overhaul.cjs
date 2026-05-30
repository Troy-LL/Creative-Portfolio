#!/usr/bin/env node
/**
 * Structural QA for iOS mobile overhaul — run against a local static server.
 * Usage: node scripts/qa-mobile-overhaul.cjs [baseUrl]
 */
const { execSync } = require("child_process");
const http = require("http");
const https = require("https");

const BASE = process.argv[2] || "http://localhost:8099";
const REQUIRED_IDS = [
  "lockScreen",
  "lockClock",
  "lockUnlockBtn",
  "homeScreenChrome",
  "homeWidgets",
  "terminalAppOverlay",
  "terminalAppOutput",
  "terminalAppCmd",
  "desktop",
];

const REQUIRED_ASSETS = [
  "/assets/css/desktop.css",
  "/assets/css/responsive/responsive-shared.css",
  "/assets/css/responsive/ios-phone.css",
  "/assets/css/responsive/ipados-tablet.css",
  "/assets/css/responsive/ios-lock-screen.css",
  "/assets/css/responsive/ios-home.css",
  "/assets/css/responsive/ios-terminal-app.css",
  "/assets/css/responsive/ios-apps-touch.css",
  "/assets/js/mobile/device-tier.js",
  "/assets/js/mobile/lock-screen.js",
  "/assets/js/mobile/home-screen.js",
  "/assets/js/mobile/terminal-app.js",
  "/assets/js/bootstrap/boot-splash.js",
  "/assets/js/terminal/commands.js",
];

function fetch(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    lib
      .get(url, (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () =>
          resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString("utf8") }),
        );
      })
      .on("error", reject);
  });
}

async function main() {
  const failures = [];

  console.log(`QA base: ${BASE}\n`);

  for (const asset of REQUIRED_ASSETS) {
    const { status } = await fetch(`${BASE}${asset}`);
    if (status !== 200) failures.push(`Asset ${asset} returned ${status}`);
    else console.log(`OK  ${status} ${asset}`);
  }

  const index = await fetch(`${BASE}/`);
  if (index.status !== 200) {
    failures.push(`index.html returned ${index.status}`);
  } else {
    for (const id of REQUIRED_IDS) {
      if (!index.body.includes(`id="${id}"`)) {
        failures.push(`index.html missing #${id}`);
      }
    }
    if (index.body.includes("desktop-mobile.css")) {
      failures.push("index.html still references desktop-mobile.css");
    }
    console.log(`OK  ${index.status} / (DOM ids checked)`);
  }

  const css = await fetch(`${BASE}/assets/css/desktop.css`);
  if (css.body.includes("desktop-mobile.css")) {
    failures.push("desktop.css still imports desktop-mobile.css");
  }
  for (const partial of ["responsive-shared.css", "ios-lock-screen.css", "ios-terminal-app.css"]) {
    if (!css.body.includes(partial)) {
      failures.push(`desktop.css missing import for ${partial}`);
    }
  }
  console.log("OK  desktop.css import chain");

  const jsFiles = [
    "assets/js/app.js",
    "assets/js/mobile/device-tier.js",
    "assets/js/mobile/lock-screen.js",
    "assets/js/mobile/terminal-app.js",
    "assets/js/bootstrap/boot-splash.js",
    "assets/js/terminal/commands.js",
    "assets/js/desktop/interactions.js",
  ];
  for (const f of jsFiles) {
    try {
      execSync(`node --check ${f}`, { cwd: process.cwd(), stdio: "pipe" });
      console.log(`OK  syntax ${f}`);
    } catch {
      failures.push(`Syntax error in ${f}`);
    }
  }

  const grep768 = execSync('rg "matchMedia\\([\\"\\\'].*768" assets/js || true', {
    encoding: "utf8",
  }).trim();
  if (grep768) failures.push(`Hardcoded 768px matchMedia remains:\n${grep768}`);

  console.log("");
  if (failures.length) {
    console.error("FAILURES:");
    failures.forEach((f) => console.error(" -", f));
    process.exit(1);
  }
  console.log("All structural QA checks passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

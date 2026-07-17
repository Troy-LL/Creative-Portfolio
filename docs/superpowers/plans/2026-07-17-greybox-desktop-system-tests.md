# Greybox Desktop System Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove desktop window UX (open in-frame, clickable chrome, drag, resize) with Playwright greybox tests, fix UI bugs via TDD, and document performance + proof artifacts.

**Architecture:** Static portfolio served locally (`http://127.0.0.1:4173`). Playwright `@playwright/test` drives a fixed desktop viewport (desktop gate bypass). Shared helpers assert geometry against `#desktop` bounds. Significant events append JSONL to `docs/testing/greybox-log.jsonl`. Each behavior gets a failing test first; production fixes only when RED proves a bug.

**Tech Stack:** Playwright Test, Node static server (`serve`), vanilla portfolio JS/CSS under `assets/` + `index.html`.

## Global Constraints

- Viewport for all desktop UX tests: `{ width: 1440, height: 900 }` (must not trigger mobile gate: max-width 1024 / touch-primary).
- Base URL default: `http://127.0.0.1:4173` (override with `PORTFOLIO_BASE_URL`).
- Apps under test (dock): `settings`, `contacts`, `mail`, `finder`, `safari`, `spotify`.
- Geometry rule: visible `.mac-window` inside overlay with `.is-visible` must satisfy `getBoundingClientRect()` fully inside `#desktop` (or `document.documentElement` if desktop missing) with 2px tolerance.
- Performance forefront: each scenario records `durationMs`; suite fails if any single scenario > **8000ms**; log p95 of scenario durations in proof doc.
- TDD: no production code change without a failing Playwright test first (except Task 1 harness scaffolding).
- Granular commits: one commit per RED test file addition OR GREEN fix OR docs update — never squash a whole task into one mega-commit if multiple behaviors landed.
- Auto-routed models: Task dispatches omit explicit `model` so Cursor auto-routes.
- Significant log fields (JSONL): `ts`, `scenario`, `app`, `signal` (`pass|fail|perf|note`), `durationMs`, `detail`, `screenshot` (optional path).
- Do not commit secrets; commit test artifacts under `docs/testing/proof/` only when intentionally documenting.
- Skip mobile-gate / iOS shell paths — desktop only.
- Prefer minimal UI patches in `assets/js/desktop/*` and related CSS; no redesigns.

## File Map

| Path | Responsibility |
|------|----------------|
| `playwright.config.js` | Projects, baseURL, timeouts, desktop viewport |
| `package.json` | `test:e2e`, `test:e2e:headed`, `serve` scripts; `@playwright/test` dep |
| `tests/e2e/helpers/desktop.js` | boot, openApp, bounds asserts, greyboxLog, perf wrap |
| `tests/e2e/helpers/greybox-log.js` | JSONL writer |
| `tests/e2e/open-apps.spec.js` | Open apps in-frame |
| `tests/e2e/clickable-chrome.spec.js` | Buttons/controls clickable |
| `tests/e2e/drag-windows.spec.js` | Drag via titlebar/chrome |
| `tests/e2e/resize-windows.spec.js` | Resize via `.mac-window-resize-handle` |
| `tests/e2e/perf.budget.spec.js` | Aggregate duration budget |
| `docs/testing/SIGNIFICANT.md` | Evolving list of what to log |
| `docs/testing/greybox-log.jsonl` | Runtime log (gitignored if noisy; sample committed) |
| `docs/testing/PROOF.md` | Confidence report + links to screenshots |
| `docs/testing/proof/*.png` | Failure/success screenshots |

---

### Task 1: Playwright harness + greybox log schema

**Files:**
- Create: `playwright.config.js`
- Create: `tests/e2e/helpers/desktop.js`
- Create: `tests/e2e/helpers/greybox-log.js`
- Create: `docs/testing/SIGNIFICANT.md`
- Create: `tests/e2e/harness.smoke.spec.js`
- Modify: `package.json`
- Modify: `.gitignore` (add `test-results/`, `playwright-report/`, `docs/testing/greybox-log.jsonl` optional keep sample)

**Interfaces:**
- Consumes: local server at baseURL
- Produces:
  - `async function bootDesktop(page)` → waits for `#desktop.desktop--visible` or boot complete; dismisses gate if present on desktop viewport
  - `async function openDockApp(page, app)` → clicks `.dock-icon[data-app="${app}"]`
  - `function assertInFrame(box, frameBox, tolerance=2)`
  - `async function withScenario(page, meta, fn)` → times fn, appends greybox log, attaches screenshot on fail
  - `appendGreyboxLog(entry)`

- [ ] **Step 1: Install `@playwright/test` and browsers if needed**

Run: `npm install -D @playwright/test@1.49.0 && npx playwright install chromium`

- [ ] **Step 2: Write failing harness smoke test**

```js
// tests/e2e/harness.smoke.spec.js
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
```

- [ ] **Step 3: Run test — expect FAIL (helpers/config missing)**

Run: `npx playwright test tests/e2e/harness.smoke.spec.js`
Expected: FAIL module not found or config missing

- [ ] **Step 4: Minimal implementation** — config, helpers, SIGNIFICANT.md, package scripts

- [ ] **Step 5: Run test — expect PASS**

- [ ] **Step 6: Commit** `test: add Playwright harness smoke for desktop boot`

---

### Task 2: Open apps in-frame (TDD)

**Files:**
- Create: `tests/e2e/open-apps.spec.js`
- Modify (only if RED proves bug): `assets/js/desktop/interactions.js`, `assets/js/desktop/window-resize.js`, related CSS, `index.html` layout

**Interfaces:**
- Consumes: `bootDesktop`, `openDockApp`, `withScenario`, `assertWindowInDesktop(page, windowSelector)`
- Produces: coverage for apps list in Global Constraints

- [ ] **Step 1: Write failing tests** — for each app, open via dock, expect overlay `.is-visible`, window visible, bounding box inside `#desktop`

```js
const APPS = [
  { app: "settings", overlay: "#settingsOverlay", win: ".settings-window" },
  { app: "contacts", overlay: "#contactsOverlay", win: ".contacts-window" },
  { app: "mail", overlay: "#mailOverlay", win: ".mail-window" },
  { app: "finder", overlay: "#finderOverlay", win: ".finder-window" },
  { app: "safari", overlay: "#safariOverlay", win: ".safari-window" },
  { app: "spotify", overlay: "#spotifyOverlay", win: ".spotify-window" },
];
```

- [ ] **Step 2: Run — RED** (document first failure signals in greybox log)

- [ ] **Step 3: GREEN** — minimal UI fix per failing assertion OR fix selector/wait if false positive

- [ ] **Step 4: Commit separately** — `test: open-apps in-frame assertions` then `fix: ...` commits per app/area if production changes

---

### Task 3: Clickable chrome buttons (TDD)

**Files:**
- Create: `tests/e2e/clickable-chrome.spec.js`
- Modify (if needed): window chrome JS/CSS

**Interfaces:**
- For opened `settings` and `finder`: assert `.mac-close`, `.mac-min` (or app-specific close/min) are visible, enabled, and receive click (close hides overlay or minimizes; min adds minimized state / hides without error)

- [ ] **Step 1: RED tests** for click targets hit-testable (`elementFromPoint` center equals control or descendant)

- [ ] **Step 2: GREEN fixes** for pointer-events / z-index / overlap

- [ ] **Step 3: Granular commits**

---

### Task 4: Drag windows (TDD)

**Files:**
- Create: `tests/e2e/drag-windows.spec.js`
- Modify (if needed): `assets/js/desktop/window-focus.js` (Draggable)

**Interfaces:**
- Open `mail` (or `settings`), drag titlebar/chrome by +120x,+80 via Playwright mouse API, assert window `x/y` increased and still in-frame

- [ ] **Step 1: RED**
- [ ] **Step 2: GREEN**
- [ ] **Step 3: Commit**

---

### Task 5: Resize windows (TDD)

**Files:**
- Create: `tests/e2e/resize-windows.spec.js`
- Modify (if needed): `assets/js/desktop/window-resize.js`, `assets/css/desktop/desktop-window-resize.css`

**Interfaces:**
- Open resizable app (`finder` or `settings`), drag `.mac-window-resize-handle--se` (or `e`) outward, assert width/height increased ≥ 40px and still in-frame; drag inward still above min size

- [ ] **Step 1: RED**
- [ ] **Step 2: GREEN**
- [ ] **Step 3: Commit**

---

### Task 6: Performance budget + proof documentation

**Files:**
- Create: `tests/e2e/perf.budget.spec.js`
- Create: `docs/testing/PROOF.md`
- Update: `docs/testing/SIGNIFICANT.md` from trial-and-error signals observed

**Interfaces:**
- Read/aggregate `docs/testing/greybox-log.jsonl` or in-test metrics; fail if any scenario > 8000ms
- PROOF.md: commands run, pass counts, p95 duration, screenshot gallery links, confidence statement

- [ ] **Step 1: RED budget test if slow paths exist / always assert log exists after suite**
- [ ] **Step 2: Optimize only if budget fails (wait strategies, not sleep hacks)**
- [ ] **Step 3: Write PROOF.md + commit docs separately from any perf fix commits

---

## Progress Ledger

Track completion in `.superpowers/sdd/progress.md` (gitignored scratch OK; also mirror status in commits).

## Execution Notes for Controller

- Serve: `npx serve -l 4173 .` (keep alive)
- One implementer at a time (SDD); parallelize only independent investigations
- After each task: `scripts/review-package` + task reviewer
- Omit Task `model` for auto-routing

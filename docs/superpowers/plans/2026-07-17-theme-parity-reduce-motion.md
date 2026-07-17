# Theme Parity + Instant Reduce Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify Light/Dark across shell apps via shared `--win-*` tokens, sync Founders Cafe to desktop theme, and make open/close instant when Interface animations are off.

**Architecture:** Extend `desktop-variables.css` with semantic window tokens flipped by `body.dark-theme`. Centralize `animationsEnabled()` in `appearance-state.js` and short-circuit GSAP in `closeMacWindow` / `animateWindowOpen` / preview open. Push theme into `#safariFrame` via `postMessage` + same-origin `localStorage` (`founders-theme`); Cafe listens and sets `data-theme`.

**Tech Stack:** Vanilla ES modules, GSAP (CDN), Playwright, React/Vite Founders Cafe, CSS custom properties.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-17-theme-parity-reduce-motion-design.md`
- Reduce motion = **instant** (no fade) when `getAppearance().animations === false`
- Theme scope = shell token parity **and** Founders Cafe sync; **SQL terminal CRT out of scope**
- TDD for behavior; granular commits; PR→merge to `master` via `gh` after each major section
- Do not kill local serve on `http://127.0.0.1:4173` if running
- Desktop e2e viewport ≥1025px (default 1440×900)
- After Cafe source changes: `npm run build` so `assets/founders-cafe/` updates

## File map

| File | Responsibility |
|------|----------------|
| `assets/js/desktop/appearance-state.js` | `animationsEnabled()`, `getEffectiveTheme()`, `pushThemeToSafariFrame()` |
| `assets/js/desktop/window-chrome.js` | Instant `closeMacWindow` when animations off |
| `assets/js/desktop/window-resize.js` | Instant `animateWindowOpen` when animations off |
| `assets/js/desktop/viewers.js` | Instant preview open tweens when animations off |
| `assets/js/desktop/safari-app.js` | Re-push theme on iframe `load` |
| `assets/css/desktop/desktop-variables.css` | Define `--win-*` light/dark |
| `assets/css/mail.css`, `desktop-finder.css`, `desktop-contacts.css`, `desktop-settings.css`, `desktop-safari.css`, `desktop-spotify.css`, `desktop-preview.css` | Consume tokens |
| `founders-cafe/src/App.jsx` | Listen for `portfolio-theme` messages |
| `tests/e2e/reduce-motion.spec.js` | Instant close assertion |
| `tests/e2e/theme-parity.spec.js` | Shell token + Cafe sync (best-effort) |

---

### Task 1: Instant close when animations off (TDD)

**Files:**
- Create: `tests/e2e/reduce-motion.spec.js`
- Modify: `assets/js/desktop/appearance-state.js`
- Modify: `assets/js/desktop/window-chrome.js`
- Test: `tests/e2e/reduce-motion.spec.js`

**Interfaces:**
- Produces: `export function animationsEnabled(): boolean` — returns `getAppearance().animations === true`
- Consumes: existing `saveAppearance` / `getAppearance` / `bootDesktop` / `openDockApp` / `withScenario`

- [ ] **Step 1: Write the failing test**

Create `tests/e2e/reduce-motion.spec.js`:

```js
import { test, expect } from "@playwright/test";
import {
  bootDesktop,
  openDockApp,
  withScenario,
} from "./helpers/desktop.js";

test("settings close is instant when animations are disabled", async ({
  page,
}) => {
  await withScenario(
    page,
    { scenario: "motion.close-instant", app: "settings" },
    async () => {
      await bootDesktop(page);
      await page.evaluate(() => {
        localStorage.setItem(
          "portfolio-appearance",
          JSON.stringify({
            themeMode: "dark",
            wallpaper: "default",
            uiFont: "system",
            accent: "#007aff",
            animations: false,
            textScale: 1,
          }),
        );
      });
      await page.reload({ waitUntil: "domcontentloaded" });
      await bootDesktop(page);

      await openDockApp(page, "settings");
      const win = page.locator(".settings-window");
      await expect(win).toBeVisible();
      await expect(page.locator("#settingsOverlay")).toHaveClass(/is-visible/);

      const t0 = Date.now();
      await page.locator(".settings-window .mac-close").click();
      await expect(page.locator("#settingsOverlay")).not.toHaveClass(
        /is-visible/,
        { timeout: 1500 },
      );
      const elapsed = Date.now() - t0;
      // Animated close is ~250ms + settle; instant should be well under 200ms wall
      // after click→hidden. Allow CI slack but fail obvious fades.
      expect(elapsed, `close took ${elapsed}ms`).toBeLessThan(400);
    },
  );
});
```

- [ ] **Step 2: Run test to verify it fails (or is flaky-slow)**

Run: `npx playwright test tests/e2e/reduce-motion.spec.js --reporter=list`  
Expected: FAIL — elapsed ≥400ms because `closeMacWindow` always runs 0.25s GSAP fade — **or** pass unreliably if machine is fast; if it passes by luck, assert via page timing hook instead:

```js
const duration = await page.evaluate(async () => {
  const win = document.querySelector(".settings-window");
  const start = performance.now();
  window.__closeProbe = null;
  const orig = gsap.to.bind(gsap);
  // Prefer checking body.disable-animations + that finishClose path ran without waiting;
});
```

Prefer simpler wall-clock first; if flaky, change assertion to:

```js
const usedTween = await page.evaluate(() => {
  return document.body.classList.contains("disable-animations");
});
expect(usedTween).toBe(true);
// And spy: after click, opacity should not animate — check gsap.isTweening immediately false
await page.locator(".settings-window .mac-close").click();
await page.waitForTimeout(16);
const tweening = await page.evaluate(() => {
  const w = document.querySelector(".settings-window");
  return typeof gsap !== "undefined" && gsap.isTweening(w);
});
expect(tweening).toBe(false);
await expect(page.locator("#settingsOverlay")).not.toHaveClass(/is-visible/);
```

Use the **spy / isTweening** variant if wall-clock is flaky.

- [ ] **Step 3: Add `animationsEnabled` and gate `closeMacWindow`**

In `assets/js/desktop/appearance-state.js`, add:

```js
export function animationsEnabled() {
  return getAppearance().animations === true;
}

/** @returns {"light" | "dark"} */
export function getEffectiveTheme(state = getAppearance()) {
  if (state.themeMode === "auto") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return state.themeMode === "light" ? "light" : "dark";
}
```

In `assets/js/desktop/window-chrome.js`:

```js
import { animationsEnabled } from "./appearance-state.js";

export function closeMacWindow(windowEl, { removeDockIndicator = true } = {}) {
  const ctx = resolveContext(windowEl);
  if (!ctx || ctx.windowEl.dataset.windowClosing === "true") return;

  ctx.windowEl.dataset.windowClosing = "true";

  const finish = () => {
    delete ctx.windowEl.dataset.windowClosing;
    finishClose(ctx, removeDockIndicator);
  };

  if (!animationsEnabled() || typeof gsap === "undefined") {
    finish();
    return;
  }

  gsap.to(ctx.windowEl, {
    opacity: 0,
    scale: 0.9,
    y: 18,
    duration: 0.25,
    ease: "power2.in",
    onComplete: finish,
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx playwright test tests/e2e/reduce-motion.spec.js --reporter=list`  
Expected: PASS

- [ ] **Step 5: Commit + PR merge**

```bash
git checkout -B feat/instant-reduce-motion-close
git add tests/e2e/reduce-motion.spec.js assets/js/desktop/appearance-state.js assets/js/desktop/window-chrome.js
git commit -m "fix: instant window close when animations disabled"
# push, gh pr create, merge to master
```

---

### Task 2: Instant open (animateWindowOpen + preview)

**Files:**
- Modify: `assets/js/desktop/window-resize.js` (`animateWindowOpen`)
- Modify: `assets/js/desktop/viewers.js`
- Test: extend `tests/e2e/reduce-motion.spec.js` OR rely on close test + manual; prefer one open assertion

**Interfaces:**
- Consumes: `animationsEnabled()` from Task 1

- [ ] **Step 1: Gate `animateWindowOpen`**

In `animateWindowOpen`, after resolving `win`:

```js
import { animationsEnabled } from "./appearance-state.js";

// inside animateWindowOpen, before gsap.to:
if (!animationsEnabled() || typeof gsap === "undefined") {
  win.style.opacity = "1";
  if (typeof gsap !== "undefined") {
    gsap.set(win, { opacity: 1, scale: 1, y: 0, x: 0 });
  }
  finish();
  return;
}
```

(`finish` already calls `refreshWindowLayout` + `onComplete`.)

- [ ] **Step 2: Gate preview tweens in `viewers.js`**

Import `animationsEnabled`. For each `gsap.to` / `gsap.fromTo` open path: if `!animationsEnabled()`, call `registerManagedWindow(win)` (desktop) immediately and skip tween (or `duration: 0` + immediate `onComplete`).

- [ ] **Step 3: Add open assertion to reduce-motion spec**

```js
test("settings open settles without tween when animations disabled", async ({
  page,
}) => {
  // same localStorage animations:false + reload + bootDesktop as close test
  await openDockApp(page, "settings");
  await page.waitForTimeout(16);
  const tweening = await page.evaluate(() => {
    const w = document.querySelector(".settings-window");
    return typeof gsap !== "undefined" && gsap.isTweening(w);
  });
  expect(tweening).toBe(false);
  await expect(page.locator(".settings-window")).toHaveClass(/has-explicit-layout/);
});
```

- [ ] **Step 4: Run tests**

Run: `npx playwright test tests/e2e/reduce-motion.spec.js --reporter=list`  
Expected: PASS

- [ ] **Step 5: Commit + PR merge**

```bash
git commit -m "fix: instant window open when animations disabled"
```

---

### Task 3: Define shared `--win-*` tokens

**Files:**
- Modify: `assets/css/desktop/desktop-variables.css`

**Interfaces:**
- Produces CSS custom properties on `body` / `body.dark-theme` listed below

- [ ] **Step 1: Append token definitions**

After existing `:root` / `body.dark-theme` control-center vars in `desktop-variables.css`, add:

```css
/* Shared window surfaces (shell apps) */
:root {
  --win-bg: #ececec;
  --win-bg-secondary: #f5f5f7;
  --win-chrome: #e8e8ed;
  --win-sidebar: #e5e5ea;
  --win-text: #1d1d1f;
  --win-text-muted: rgba(0, 0, 0, 0.55);
  --win-border: rgba(0, 0, 0, 0.12);
  --win-hover: rgba(0, 0, 0, 0.06);
  --win-field-bg: #ffffff;
  --win-field-border: rgba(0, 0, 0, 0.18);
}

body.dark-theme {
  --win-bg: #1e1e1e;
  --win-bg-secondary: #2a2a2c;
  --win-chrome: #2c2c2e;
  --win-sidebar: #232326;
  --win-text: #f5f5f7;
  --win-text-muted: rgba(255, 255, 255, 0.55);
  --win-border: rgba(255, 255, 255, 0.12);
  --win-hover: rgba(255, 255, 255, 0.08);
  --win-field-bg: #1c1c1e;
  --win-field-border: rgba(255, 255, 255, 0.18);
}
```

Tune values to match current Mail light (`#ececec`) / dark (`#1e1e1e`) as the reference family. Settings today hardcodes dark `#0f0f0f` even as “default” — migration in Task 4 must make Settings respect light tokens too.

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: add shared --win-* light/dark CSS tokens"
```

---

### Task 4: Migrate shell apps onto tokens

**Files:**
- Modify: `assets/css/mail.css`
- Modify: `assets/css/desktop/desktop-finder.css`
- Modify: `assets/css/desktop/desktop-contacts.css`
- Modify: `assets/css/desktop/desktop-settings.css`
- Modify: `assets/css/desktop/desktop-safari.css`
- Modify: `assets/css/desktop/desktop-spotify.css`
- Modify: `assets/css/desktop/desktop-preview.css`
- Test: `tests/e2e/theme-parity.spec.js` (created here or Task 5)

**Interfaces:**
- Consumes: `--win-*` from Task 3

- [ ] **Step 1: Write failing theme-parity shell test**

Create `tests/e2e/theme-parity.spec.js`:

```js
import { test, expect } from "@playwright/test";
import { bootDesktop, openDockApp, withScenario } from "./helpers/desktop.js";

async function setThemeMode(page, themeMode) {
  await page.evaluate((mode) => {
    const raw = localStorage.getItem("portfolio-appearance");
    const cur = raw ? JSON.parse(raw) : {};
    localStorage.setItem(
      "portfolio-appearance",
      JSON.stringify({
        themeMode: mode,
        wallpaper: "default",
        uiFont: "system",
        accent: "#007aff",
        animations: false,
        textScale: 1,
        ...cur,
        themeMode: mode,
      }),
    );
  }, themeMode);
  await page.reload({ waitUntil: "domcontentloaded" });
  await bootDesktop(page);
}

test("mail and settings window backgrounds share dark token family", async ({
  page,
}) => {
  await withScenario(page, { scenario: "theme.shell-dark", app: "mail" }, async () => {
    await setThemeMode(page, "dark");
    await openDockApp(page, "mail");
    await openDockApp(page, "settings");
    const colors = await page.evaluate(() => {
      const mail = getComputedStyle(document.querySelector(".mail-window")).backgroundColor;
      const settings = getComputedStyle(document.querySelector(".settings-window")).backgroundColor;
      const token = getComputedStyle(document.body).getPropertyValue("--win-bg").trim();
      return { mail, settings, token };
    });
    // Both should resolve close to --win-bg (same rgb family); exact match preferred
    expect(colors.mail).toBeTruthy();
    expect(colors.settings).toBeTruthy();
    // After migration, backgrounds should match each other
    expect(colors.mail).toBe(colors.settings);
  });
});

test("mail window background changes between light and dark", async ({ page }) => {
  await withScenario(page, { scenario: "theme.shell-toggle", app: "mail" }, async () => {
    await setThemeMode(page, "light");
    await openDockApp(page, "mail");
    const lightBg = await page.locator(".mail-window").evaluate((el) => getComputedStyle(el).backgroundColor);
    await setThemeMode(page, "dark");
    await openDockApp(page, "mail");
    const darkBg = await page.locator(".mail-window").evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(lightBg).not.toBe(darkBg);
  });
});
```

- [ ] **Step 2: Run — expect FAIL** (Settings dark-only vs Mail token mismatch)

Run: `npx playwright test tests/e2e/theme-parity.spec.js --reporter=list`

- [ ] **Step 3: Migrate CSS to tokens**

Pattern for each app window root:

```css
.mail-window {
  background: var(--win-bg);
  color: var(--win-text);
  border: 1px solid var(--win-border);
}
/* Remove redundant body.dark-theme .mail-window background/color/border if fully tokenized */
```

Apply same idea to:

- `.settings-window` / `.settings-sidebar` → `--win-bg` / `--win-sidebar` (fix Settings light mode)
- `.finder-window`, sidebar, main, labels
- `.contacts-window` and panes
- `.safari-window` chrome (not iframe content)
- `.spotify-window` chrome surfaces
- `.preview-window` / titlebar / body chrome

Keep traffic-light dot colors (red/yellow/green) unchanged. Prefer replacing duplicated `body.dark-theme …` color pairs with single tokenized rules.

- [ ] **Step 4: Run theme-parity tests — PASS**

- [ ] **Step 5: Commit + PR merge**

```bash
git commit -m "feat: migrate shell apps to shared --win-* theme tokens"
```

---

### Task 5: Sync Founders Cafe theme from desktop

**Files:**
- Modify: `assets/js/desktop/appearance-state.js`
- Modify: `assets/js/desktop/safari-app.js`
- Modify: `founders-cafe/src/App.jsx`
- Modify: `tests/e2e/theme-parity.spec.js` (add Cafe case)
- Run: `npm run build` (updates `assets/founders-cafe/`)

**Interfaces:**
- Consumes: `getEffectiveTheme()` from Task 1
- Produces: `pushThemeToSafariFrame(theme?: "light"|"dark")`
- Message shape: `{ source: "portfolio-os", type: "portfolio-theme", theme: "light"|"dark" }`

- [ ] **Step 1: Implement `pushThemeToSafariFrame` in appearance-state.js**

```js
export function pushThemeToSafariFrame(theme = getEffectiveTheme()) {
  const iframe = document.getElementById("safariFrame");
  if (!iframe) return;
  try {
    const win = iframe.contentWindow;
    if (!win) return;
    win.postMessage(
      { source: "portfolio-os", type: "portfolio-theme", theme },
      window.location.origin,
    );
    try {
      win.localStorage.setItem("founders-theme", theme);
    } catch {
      /* ignore cross-origin / denied */
    }
  } catch {
    /* ignore */
  }
}
```

Call `pushThemeToSafariFrame(getEffectiveTheme(state))` at end of `applyAppearance`.

- [ ] **Step 2: Re-push on Safari iframe load**

In `safari-app.js` `iframe.addEventListener("load", …)` also call `pushThemeToSafariFrame()` (import from appearance-state).

- [ ] **Step 3: Cafe message listener in App.jsx**

Inside `App()`, add:

```js
useEffect(() => {
  const onMessage = (event) => {
    if (event.origin !== window.location.origin) return;
    const data = event.data;
    if (!data || data.source !== "portfolio-os" || data.type !== "portfolio-theme") return;
    if (data.theme !== "light" && data.theme !== "dark") return;
    setTheme(data.theme);
    setEffectiveTheme(data.theme);
  };
  window.addEventListener("message", onMessage);
  return () => window.removeEventListener("message", onMessage);
}, []);
```

When embedded, desktop wins on each push. Standalone Cafe toggle can still cycle local theme until parent sends a message.

- [ ] **Step 4: Build Cafe**

Run: `npm run build`  
Expected: exit 0; `assets/founders-cafe/` updated

- [ ] **Step 5: E2E Cafe sync (best-effort)**

Append to `theme-parity.spec.js`:

```js
test("founders cafe data-theme follows desktop dark", async ({ page }) => {
  await withScenario(page, { scenario: "theme.cafe-sync", app: "safari" }, async () => {
    await setThemeMode(page, "dark");
    await openDockApp(page, "safari");
    // Activate Founders Cafe favorite if needed — use existing safari tile selector
    const tile = page.locator('[data-safari-href*="founders"]').first();
    if (await tile.count()) {
      await tile.click();
    }
    const frame = page.frameLocator("#safariFrame");
    await expect
      .poll(async () => {
        return frame.locator("html").evaluate((el) => el.getAttribute("data-theme"));
      }, { timeout: 15000 })
      .toBe("dark");
  });
});
```

If favorite selector differs, read `index.html` / safari markup for the real `data-safari-href` before writing the test. Skip with `test.skip` only if Cafe asset missing — prefer fixing selector.

- [ ] **Step 6: Run theme + reduce-motion suites**

Run: `npx playwright test tests/e2e/theme-parity.spec.js tests/e2e/reduce-motion.spec.js --reporter=list`  
Expected: PASS

- [ ] **Step 7: Commit + PR merge**

```bash
git add assets/js/desktop/appearance-state.js assets/js/desktop/safari-app.js founders-cafe/src/App.jsx assets/founders-cafe tests/e2e/theme-parity.spec.js
git commit -m "feat: sync Founders Cafe theme from desktop appearance"
```

---

### Task 6: Full suite + docs acceptance

**Files:**
- Modify: `docs/testing/PROOF.md`
- Modify: `docs/testing/SIGNIFICANT.md`
- Modify: `docs/testing/ACCEPTANCE.md`

- [ ] **Step 1: Run full Playwright suite**

Run: `npx playwright test --reporter=list`  
Expected: all passed (prior count + new motion/theme tests)

- [ ] **Step 2: Record acceptance**

Append to PROOF/SIGNIFICANT/ACCEPTANCE: theme tokens, Cafe sync, instant close/open, PR numbers.

- [ ] **Step 3: Commit + PR merge**

```bash
git commit -m "docs: accept theme parity and instant reduce-motion"
```

---

## Spec coverage self-check

| Spec requirement | Task |
|------------------|------|
| Shared `--win-*` tokens | Task 3 |
| Migrate shell apps | Task 4 |
| Cafe postMessage + storage + load re-push | Task 5 |
| Instant close / open / preview | Tasks 1–2 |
| E2E motion + theme | Tasks 1, 4, 5 |
| Terminal out of scope | (no task) |
| Cafe build artifacts | Task 5 Step 4 |
| PROOF/SIGNIFICANT | Task 6 |

## Placeholder scan

No TBD/TODO steps; commands and code included.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A macOS-inspired "desktop OS" portfolio site: vanilla HTML/CSS/JS (ES modules, no framework, no bundler for the shell) served statically. The single `index.html` (~2800 lines) holds the markup for every app window; behavior lives in `assets/js/`, styling in `assets/css/`. GSAP (animation + Draggable) and Lenis (smooth scroll) load from CDN in `index.html`, not npm — `gsap`, `Draggable`, `TextPlugin`, `Lenis` are globals.

**Founders Cafe** (`founders-cafe/`) is a separate React/Vite app, built into `assets/founders-cafe/` and embedded inside the shell's "Safari" window. It has its own `package.json`.

## Commands

```bash
npm run build         # builds founders-cafe/ via Vite into assets/founders-cafe/ (scripts/build-founders-cafe.cjs)
npm run serve         # static server on :4173 (the shell needs a server — ES modules + CORS, don't open index.html via file://)
npm run test:e2e      # Playwright against http://127.0.0.1:4173 (start `npm run serve` first, or set PORTFOLIO_BASE_URL)
npx playwright test tests/e2e/drag-windows.spec.js      # single spec
npx playwright test -g "resize"                          # single test by title
```

There is no lint step and no unit tests — Playwright e2e is the only test layer. `scripts/build-founders-cafe.cjs` exits 0 if `founders-cafe/package.json` is missing (deploy uses committed `assets/founders-cafe/`).

## Architecture

**Boot flow** (`assets/js/app.js`): on `DOMContentLoaded` → apply stored appearance → boot splash → then branch on `shouldShowMobileGate()`. Desktop viewport initializes the full shell (`initDesktopUi`); mobile viewport shows a **desktop-only gate** instead of a touch shell. A resize watcher swaps between the two live. `desktopInited`/`terminalInited` flags guard against double-init.

**Two parallel UI trees:**
- `assets/js/desktop/` — the real shell. `init.js` is the wiring hub: it calls every `init*App()` in a specific order (Safari last, so its dock handler is wired before the first click). Each app is one module (`finder.js`, `mail-app.js`, `settings-app.js`, `safari-app.js`, `contacts-app.js`, `spotify-app.js`, `control-center.js`).
- `assets/js/mobile/` — the gate + minimal per-app views (`desktop-gate.js`, `viewport.js`, `apps/`). Only shown below the desktop breakpoint.

**Window management is layered across three modules** — a new window touches all of them:
- `window-focus.js` — registers windows for drag + focus z-index + menubar app-name. New windows MUST be registered here.
- `window-resize.js` — resize handles, bounded to `#desktop-workarea`.
- `window-chrome.js` / `monitor.js` — traffic-light controls (`.mac-close`/`.mac-min`/`.mac-max` + app dot class like `.safari-dot`), close/min/max behavior.

**Terminal** (`assets/js/terminal/`): `input.js` reads input, `commands.js` processes it, backed by `assets/js/data/portfolio-data.js` (the terminal's content "database" — edit this to change terminal output).

**Shared state** (`assets/js/core/state.js`): the singleton `lenis` instance and terminal DOM refs. `core/` also has small utilities (`copy-text`, `open-external`, `preview-mount`).

## Adding a new app (checklist — all layers or it breaks)

1. Markup: overlay window in `index.html`.
2. Behavior: dedicated module in `assets/js/desktop/`, called from `desktop/init.js`.
3. Register in `window-focus.js` (drag/focus/menubar).
4. CSS: new file `assets/css/desktop/*.css` **imported in `assets/css/desktop.css`** — unimported CSS = app renders unstyled.
5. One open handler only (avoid duplicate dock/desktop-icon handlers → silent conflicts).

## Conventions (from design-philosophy.md)

- **SVG-first buttons**: inline SVG for all toolbar/action controls, `stroke="currentColor"` `fill="none"`. Avoid raster icons for controls.
- **Inactive placeholders**: features that exist visually but aren't wired use `ui-chrome--inactive` + `aria-disabled="true"`, muted color, disabled cursor — no pointer cursor, hover lift, focus ring, or click. Keep them (they sell the OS realism); don't delete.
- **Theme parity**: dark and light must both look intentional. Accent color is `--sys-color`; theme vars live in `assets/css/desktop/desktop-variables.css`.
- `data-lenis-prevent` on scrollable inner panes stops Lenis from hijacking their scroll.
- External links: `rel="noopener noreferrer"`.

## Testing conventions

`tests/e2e/helpers/desktop.js` is the shared harness: `bootDesktop(page)` waits for `#desktop.desktop--visible` and asserts no active gate; `assertWindowInDesktop` checks a window settled (`has-explicit-layout`) and sits inside `#desktop-workarea`; `withScenario` times a run, writes JSONL to the greybox log, and screenshots to `docs/testing/proof/` on failure. Prefer class/event waits over sleeps. Playwright runs serially (`workers: 1`, `fullyParallel: false`) at 1440×900.

## Deploy

Vercel, static (`vercel.json` sets strict security headers/CSP — new CDN origins must be allowlisted there). CDN dependencies are pinned (GSAP 3.12.5, Lenis 1.1.18).

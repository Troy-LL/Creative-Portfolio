# Design: CI/CD gates + OS-like desktop framing

**Date:** 2026-07-17  
**Status:** Approved (brainstorm §§1–3′)  
**Repo:** Creative Portfolio (static Vercel + Playwright greybox)

## Goals

1. **CI/CD** — catch bad deploy artifacts and broken UX before merge.
2. **OS-like selection** — no text/image highlight on shell; Resume document + form fields exempt.
3. **Framing** — open/resize/drag windows inside a measured workarea that excludes menubar **and** dock; re-fit on browser resize and Ctrl+/- zoom.

## §1 CI pipeline (Approach A)

| Job | Trigger | Checks |
|-----|---------|--------|
| `deploy-sanity` | PR + push `master` | `npm ci`; `npm run build`; assert Founders Cafe build outputs; required paths (`index.html`, `assets/js/app.js`); parse `vercel.json` |
| `e2e` | same; `needs: deploy-sanity` | Playwright Chromium; static serve; full `npx playwright test`; upload report on failure |

- Playwright runs on **every PR + `master`**.
- Vercel remains deploy; Actions are the commit gate.
- Branch protection: require both jobs (manual one-time).

**Out of scope v1:** Actions auto-deploy, preview-URL e2e, Lighthouse, visual regression.

## §2 OS-like selection

- Root: `#desktop` / shell → `user-select: none` (+ webkit).
- Allow: `input`, `textarea`, `[contenteditable]`, `.user-select-text`, resume/document preview surfaces.
- Desktop Resume **icon label** may stay non-selectable; **opened resume document** selectable.
- Founders Cafe iframe: out of scope v1.
- E2E: `os-selection.spec.js` — shell `user-select: none`; resume doc not `none`.

## §3′ Solid dock + proportional zoom-aware windows

- Measure menubar + `.desktop-dock` rects; inset `#desktop-workarea` so apps **cannot occupy dock band** (bottom dock or left dock on narrow).
- Open: fit preferred size into workarea; clamp position; shared path for all dock apps.
- On `resize` + `visualViewport` resize/scroll: refresh insets; re-fit/clamp visible windows; prefer fractional saved layouts.
- E2E: in-frame vs workarea; window bottom ≤ dock top; optional smaller viewport case.

## Success criteria

- CI green on PR/master for sanity + e2e.
- Manual + automated: no selection on wallpaper/chrome; resume readable/selectable when open.
- No window under dock; open/fit survives viewport change and zoom.

## Related

- Existing greybox: `docs/testing/PROOF.md`, `ACCEPTANCE.md`
- Prior fix: safari/spotify clamp into workarea

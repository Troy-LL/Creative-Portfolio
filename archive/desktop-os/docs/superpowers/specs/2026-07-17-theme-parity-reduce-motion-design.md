# Design: Theme parity + instant Reduce Motion

**Date:** 2026-07-17  
**Status:** Approved (brainstorm — Approach 1)  
**Repo:** Creative Portfolio (static Vercel + Playwright greybox)

## Goals

1. **Theme parity** — Light/Dark share one token family across shell apps (Finder, Mail, Contacts, Settings, Safari chrome, Spotify, PDF/image preview).
2. **Founders Cafe sync** — Cafe iframe `data-theme` follows desktop Light/Dark from Settings / Control Center.
3. **Instant Reduce Motion** — When Interface animations / Control Center animations are **off**, window open/close snaps with **no GSAP fade** (instant finish).
4. **Terminal** remains CRT phosphor styling (explicitly out of theme parity).

## Decisions (locked)

| Topic | Choice |
|-------|--------|
| Theme scope | **C** — shared shell tokens **and** sync Founders Cafe |
| Reduce motion | **A** — Instant (no fade) when animations disabled |
| Implementation approach | **1** — Token bridge + motion gate |

## §1 Shared shell tokens

**File:** `assets/css/desktop/desktop-variables.css` (extend).

Add semantic window tokens (names may be adjusted slightly during implement, meaning stays):

| Token | Role |
|-------|------|
| `--win-bg` | Primary window / content surface |
| `--win-bg-secondary` | Lists, alternate panes |
| `--win-chrome` | Titlebars / toolbars |
| `--win-sidebar` | Sidebars |
| `--win-text` | Primary text |
| `--win-text-muted` | Secondary / labels |
| `--win-border` | Dividers / hairlines |
| `--win-hover` | Row / icon hover |
| `--win-field-bg` | Inputs / fields |
| `--win-field-border` | Field borders |

- Light values on `:root` / default `body`.
- Dark values under `body.dark-theme`.
- Accent remains `--sys-color` (already applied via `appearance-state.js`).
- Existing wallpaper / control-center / dock tokens stay as-is.

**Migration:** Update app CSS (`desktop-finder`, `mail`, `desktop-contacts`, `desktop-settings`, `desktop-safari`, `desktop-spotify`, `desktop-preview`, and related) so light defaults and `body.dark-theme` overrides prefer these tokens instead of one-off hex where practical. Do not require deleting every hex in one pass — prioritize surfaces that currently mismatch between apps (window chrome, sidebars, body text, fields).

## §2 Founders Cafe theme sync

**Desktop → Cafe**

- In `applyAppearance` (or a small helper it calls): resolve effective theme to `"light"` | `"dark"` (respect `themeMode` auto via `prefers-color-scheme`).
- If `#safariFrame` is same-origin and loaded:
  - `postMessage({ source: "portfolio-os", type: "portfolio-theme", theme }, iframeOrigin)`.
  - Also set Cafe storage key `founders-theme` to `"light"` | `"dark"` when reachable via `contentWindow.localStorage` (same origin), so reloads match.
- On iframe `load` (Safari), re-push current theme so late loads sync.

**Cafe listener** (`founders-cafe/src/App.jsx` or thin module):

- Listen for `portfolio-theme` messages; set React theme state + `document.documentElement.setAttribute("data-theme", theme)`.
- Desktop appearance is source of truth when the parent sends a message.
- In-app theme toggle may remain for standalone Cafe opens; when embedded, prefer following parent (or map “system” to last desktop push). Do not leave Cafe stuck on an opposite theme after desktop toggle.

**Build:** Run `npm run build` so `assets/founders-cafe/` picks up listener changes.

## §3 Instant motion gate

**Root cause:** `body.disable-animations` only kills CSS transitions/animations. `closeMacWindow` / `animateWindowOpen` / preview GSAP tweens still run (~0.25–0.35s fades).

**API**

- `animationsEnabled()` → `getAppearance().animations === true` (centralize in `appearance-state.js` or a tiny motion helper).

**Call sites**

| Call site | When animations off |
|-----------|---------------------|
| `closeMacWindow` | Skip `gsap.to`; call `finishClose` immediately |
| `animateWindowOpen` | Skip tween; apply final opacity/transform; run `onComplete` / layout refresh immediately |
| `viewers.js` open tweens | Same — register/layout without duration |

Keep existing CSS override for dock/UI transitions. Boot splash may keep its own `prefers-reduced-motion` path (unchanged unless trivial).

## §4 Tests / acceptance

1. **Motion:** With `animations: false` in appearance (or toggle Control Center), open Settings → close → overlay not visible; close path must not wait on GSAP duration (assert via timing or spy: finish without ~250ms fade). Prefer Playwright e2e under `tests/e2e/`.
2. **Theme shell:** Toggle dark/light; assert a shared token-backed surface (e.g. Finder sidebar or Settings window background) changes consistently.
3. **Cafe sync (best-effort e2e):** If Safari iframe loads Founders Cafe in test env, assert `data-theme` on iframe document matches desktop; otherwise manual check recorded in SIGNIFICANT/PROOF.

Update `docs/testing/PROOF.md` / `SIGNIFICANT.md` with notable findings.

## Out of scope

- True minimize-to-dock / restore.
- Theming the SQL terminal CRT.
- Redesigning Founders Cafe visual identity beyond theme attribute sync.
- Fractional layout storage / zoom e2e (prior framing work).

## Success criteria

- [ ] Shell apps use shared `--win-*` tokens for primary chrome/surfaces in light and dark.
- [ ] Toggling desktop Light/Dark updates Founders Cafe `data-theme` when Safari shows Cafe.
- [ ] Animations off → close (and open) are instant — no fade.
- [ ] Playwright covers motion gate; theme checks as feasible.
- [ ] Cafe build artifacts updated if Cafe source changes.

## Related

- Appearance: `assets/js/desktop/appearance-state.js`, Control Center, Settings.
- Close/open: `assets/js/desktop/window-chrome.js`, `window-resize.js`, `viewers.js`.
- Cafe: `founders-cafe/src/App.jsx`, `founders-cafe/src/styles.css`.

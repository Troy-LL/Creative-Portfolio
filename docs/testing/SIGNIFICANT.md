# Significant greybox events

Log these signals to `docs/testing/greybox-log.jsonl` (fields: `ts`, `scenario`, `app`, `signal`, `durationMs`, `detail`, optional `screenshot`).

## Seed topics

| Topic | When to log |
|-------|-------------|
| **boot gate** | Desktop viewport incorrectly shows / hides the mobile gate |
| **open visibility** | App overlay/window open or fail to become visible |
| **geometry clip** | Window leaves `#desktop-workarea` (2px) or overlaps `.desktop-dock` |
| **os selection** | Shell text/images selectable when they should not be |
| **hit-test** | Chrome control not under `elementFromPoint` at its center |
| **drag delta** | Titlebar drag moves window by unexpected delta or clamps oddly |
| **resize delta** | Resize handle changes size incorrectly or clips out of frame |
| **perf overrun** | Single scenario duration exceeds 8000ms budget |

## Signal values

- `pass` — scenario completed
- `fail` — assertion or runtime error (attach screenshot when possible)
- `perf` — duration / budget notes
- `note` — noteworthy but non-failing observation

## Trial discoveries

- Frame is `#desktop-workarea`, not `#desktop`
- Safari/Spotify open with negative `x` (~-430..-470) — clipped left (open-apps RED)
- Workarea `bottom:0` overlapped dock band (`work.bottom` > `dock.top`) — structural
- settings@1280×720 sat under dock until workarea insets + clamp (sanity 2026-07-17)
- Wallpaper `user-select: auto` — shell selectable until `#desktop` OS rule
- Probe artifact: `docs/testing/sanity-probe-2026-07-17.json`

## Deeper loop (2026-07-17)

Probe: `docs/testing/sanity-probe-deeper-2026-07-17.json` (`tests/e2e/_probe-deeper.spec.js`).

**New (not previously logged as fixed):**

- **Preview/Resume PDF ignores viewport refit** — `.preview-window` is outside `WINDOW_CONFIGS` / `refitVisible`. Open at 1440×900 then shrink to 1280×720 leaves fixed `800×600 @ 150,100` with `bottom > work.bottom` and under dock. Proof: `docs/testing/proof/probe-deeper-preview-1280x720-fail.png`. (Fits at 1100×800 only by geometry luck.)
- **Page-zoom / visualViewport sim** — `documentElement.zoom = 1.25` + `visualViewport`/`resize` events: open dock windows report out-of-frame (Safari also under dock). Not true pinch; still shows refit is layout-viewport-centric. Proof: `docs/testing/proof/probe-deeper-vv-zoom-fail.png`.
- **Minimize is fake** — `.mac-min` calls `closeMacWindow({ removeDockIndicator: false })`: overlay hides, dock `is-open` stays. No minimize-to-dock / restore.
- **mac-max inert by design** — `.mac-max.disabled { pointer-events: none }` on all dock apps; center hit-test lands on parent dots strip (not a close/min regression).

**Re-validated green in this loop:** sequential open + dock clearance @ 1440×900 / 1280×720 / 1920×1080 / 1100×800; multi-open clamp; mid-session viewport resize clamp; shell `user-select: none` + Resume `.preview-body` `text`; close/min hit-tests; drag+resize after viewport change; no stuck overlays / console errors.

**Fixed in deeper loop 2:** Preview registered via `registerManagedWindow` + `.preview-window` in `WINDOW_CONFIGS` — viewport shrink now clamps Resume PDF (covered by `tests/e2e/preview-refit.spec.js`).

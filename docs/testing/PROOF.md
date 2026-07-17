# Greybox desktop system tests — proof

**Branch lineage:** PR #3 (harness) → PR #4 (open-apps) → interactions → acceptance  
**Base URL:** `http://127.0.0.1:4173`  
**Viewport:** 1440×900  

## Commands

```bash
npx serve -l 4173 .
npx playwright test
```

## Suite results (local acceptance run)

| Suite | Result | Notes |
|-------|--------|-------|
| `harness.smoke` | pass | Desktop boots; gate inactive |
| `open-apps` | pass | 6/6 in `#desktop-workarea`; safari/spotify clamp fix |
| `clickable-chrome` | pass | settings + finder close/min hit-test + action |
| `drag-windows` | pass | settings via `.settings-dots` |
| `resize-windows` | pass | finder SE handle ≥ +40px, mins 400×300 |
| `dock-clearance` | pass | workarea excludes dock; settings@1280×720 clear |
| `os-selection` | pass | shell `user-select: none` |
| `preview-refit` | pass | Resume PDF refits after 1440→1280×720; body selectable |

## Deeper loop (2026-07-17)

- Spec: `docs/superpowers/specs/2026-07-17-cicd-os-desktop-framing-design.md`
- Sanity probe: `docs/testing/sanity-probe-2026-07-17.json` (0 fails after fix)
- Suite: **17 passed** (prior 15 + dock-clearance + os-selection)
- Fixes: dock-aware workarea insets + viewport/visualViewport refit; OS-like `#desktop` user-select
- CI: `.github/workflows/ci.yml` (`deploy-sanity` + `e2e`)

## Deeper loop 2 — preview refit (2026-07-17)

- Probe: `docs/testing/sanity-probe-deeper-2026-07-17.json` (68 pass / 2 real fails pre-fix)
- **Fix:** `.preview-window` added to `WINDOW_CONFIGS`; `registerManagedWindow()` after PDF/image open so clamp + `refitVisible` apply
- Suite: **19 passed** (+ `preview-refit` viewport shrink + resume selection)
- CI: master green after Playwright `webServer` (#9)
- Still noted (not fixed): fake minimize; page-zoom sim is layout-viewport-centric

## Performance


- Budget: **8000ms** per scenario (`withScenario` / greybox log)
- Typical open-app scenario: ~3.5–4.5s (boot splash dominates first open)
- p95 should stay under budget; fail test if any entry exceeds

## Significant UI fixes proven

1. Safari/Spotify initial layout clamped into `#desktop-workarea` (was negative `x`)
2. Geometry assertions use workarea, not full `#desktop`

## Confidence

Automated Playwright greybox coverage for open / click / drag / resize with geometry and hit-test assertions. Confidence is backed by green CI-local suite runs and JSONL logs under `docs/testing/greybox-log.jsonl` (gitignored runtime) plus optional PNGs in `docs/testing/proof/`.

## Theme parity + instant reduce-motion (2026-07-17)

- Spec: `docs/superpowers/specs/2026-07-17-theme-parity-reduce-motion-design.md`
- Plan: `docs/superpowers/plans/2026-07-17-theme-parity-reduce-motion.md`
- Suite: **24 passed** (prior 19 + reduce-motion ×2 + theme-parity ×3)
- **Instant reduce-motion** — `animationsEnabled()` gates GSAP in close/open/preview; PRs **#16–17**
- **`--win-*` tokens + shell migration** — shared light/dark surfaces across Mail/Settings/Finder/Contacts/Safari/Spotify/Preview; PRs **#18–19**
- **Founders Cafe theme sync** — desktop `postMessage` + `founders-theme` storage + iframe load re-push; PR **#20**
- E2E: `tests/e2e/reduce-motion.spec.js`, `tests/e2e/theme-parity.spec.js`

## Acceptance checklist

- [x] Apps open in-frame (not clipped)
- [x] Chrome buttons clickable (hit-test + close/min)
- [x] Windows draggable within workarea
- [x] Windows resizable within workarea / mins
- [x] Performance budget enforced
- [x] Section PRs merged to `master` via `gh`
- [x] Instant open/close when Interface animations off
- [x] Shell apps share `--win-*` light/dark tokens
- [x] Founders Cafe `data-theme` follows desktop

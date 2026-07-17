# QA / Acceptance — greybox desktop UX

Date: 2026-07-17 (theme parity + instant reduce-motion)
Result: PASS locally (**24** Playwright)

Merged PRs:
- #3 harness
- #4 open-apps + safari/spotify clamp
- #5 click/drag/resize + perf proof
- #6 acceptance record
- #7 dock-aware framing + OS selection + GitHub Actions CI
- #8 deeper-loop ACCEPTANCE
- #9 Playwright webServer for CI e2e
- #10 preview WINDOW_CONFIGS + registerManagedWindow + preview-refit e2e
- #16 instant window close when animations disabled
- #17 instant window open when animations disabled
- #18 shared `--win-*` light/dark CSS tokens
- #19 migrate shell apps to `--win-*` theme tokens
- #20 sync Founders Cafe theme from desktop appearance

Theme / motion acceptance notes:
- Instant reduce-motion close/open (PRs #16–17)
- `--win-*` tokens + shell migration (PRs #18–19)
- Founders Cafe theme sync (PR #20)

Proof: docs/testing/PROOF.md
Sanity probes:
- docs/testing/sanity-probe-2026-07-17.json
- docs/testing/sanity-probe-deeper-2026-07-17.json
Spec: docs/superpowers/specs/2026-07-17-theme-parity-reduce-motion-design.md
Command: npx playwright test

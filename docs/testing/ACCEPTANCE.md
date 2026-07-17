# QA / Acceptance — greybox desktop UX

Date: 2026-07-17 (deeper loop 2 — preview refit)
Result: PASS locally (19 Playwright)

Merged PRs:
- #3 harness
- #4 open-apps + safari/spotify clamp
- #5 click/drag/resize + perf proof
- #6 acceptance record
- #7 dock-aware framing + OS selection + GitHub Actions CI
- #8 deeper-loop ACCEPTANCE
- #9 Playwright webServer for CI e2e
- #10 preview WINDOW_CONFIGS + registerManagedWindow + preview-refit e2e

Proof: docs/testing/PROOF.md
Sanity probes:
- docs/testing/sanity-probe-2026-07-17.json
- docs/testing/sanity-probe-deeper-2026-07-17.json
Spec: docs/superpowers/specs/2026-07-17-cicd-os-desktop-framing-design.md
Command: npx playwright test

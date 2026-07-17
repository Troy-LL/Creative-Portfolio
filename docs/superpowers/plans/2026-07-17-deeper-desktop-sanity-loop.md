# Plan: Deeper functional sanity + greybox loop (framing / selection / CI)

> **For agentic workers:** Use superpowers:subagent-driven-development or execute sequentially with TDD, granular commits, gh PR+merge per section.

**Goal:** Find and fix framing/selection bugs via sanity + Playwright; land CI workflow; record findings.

**Architecture:** Measure workarea (menubar+dock), OS user-select root rule, GitHub Actions two-job gate.

**Tech Stack:** Playwright, GitHub Actions, existing `window-resize.js` / CSS dock+workarea, Vercel static.

## Global Constraints

- Viewport desktop tests ≥1025px wide; primary 1440×900; add 1280×720 case for fit.
- Geometry frame = measured `#desktop-workarea` after dock/menubar insets.
- TDD for behavior fixes; granular commits; PR→merge to `master` via `gh` after each major section.
- Record discoveries in `docs/testing/SIGNIFICANT.md` and update `PROOF.md` / acceptance notes.
- Do not kill local serve on 4173 if running.

---

### Task 1: Functional sanity pass (record findings)

- [ ] Boot desktop; open all dock apps; note clip/dock overlap/selection
- [ ] Resize browser; Ctrl+/- if possible; note window behavior
- [ ] Append findings to SIGNIFICANT.md
- [ ] Commit: `docs: record deeper desktop sanity findings`

### Task 2: Workarea excludes dock + open fit (TDD)

- [ ] RED: e2e assert no overlap with `.desktop-dock`; open at 1280×720 still in frame
- [ ] GREEN: measure dock/menubar → inset workarea; clamp/fit on open + viewport/visualViewport
- [ ] Commits: `test:` then `fix:`
- [ ] PR + merge

### Task 3: OS-like user-select (TDD)

- [ ] RED: `os-selection.spec.js`
- [ ] GREEN: root CSS allowlist; resume document exception
- [ ] PR + merge

### Task 4: GitHub Actions CI (Approach A)

- [ ] `.github/workflows/ci.yml` — deploy-sanity + e2e
- [ ] PR + merge; confirm Actions run

### Task 5: Full suite acceptance + PROOF update

- [ ] `npx playwright test` all green on master
- [ ] Update PROOF.md / ACCEPTANCE.md
- [ ] PR docs if needed + merge

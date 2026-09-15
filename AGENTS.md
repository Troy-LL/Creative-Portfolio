## Learned Workspace Facts

- Root is the portfolio redesign. First live surface is card-lab (`npm start` → :4173). The former desktop OS shell (and Founders Cafe) lives under `archive/desktop-os/` and is not the live surface.
- WIP branch is `dev/redesign`. `master` is the last shipped stub.
- Brand SoT is external: `Troy-LL/personal` → `docs/branding.md`.

## Docs

- Front door / how to run: `README.md` (local cheat sheet: `start.md`)
- Three trees (root card-lab, calling-card lab, archived OS): `docs/architecture.md`
- Entry fold-open UI (fall, tooth, flip, fold, hatch, motion): `docs/design.md`
- Fold-open entry, not paper tear: `docs/decisions/002-fold-open-entry-not-paper-tear.md`
- L-path scroll (one H hop, then V stack): `docs/decisions/004-l-path-scroll-not-staircase.md`
- Superseded staircase ADR: `docs/decisions/003-staircase-scroll-not-pure-horizontal.md`
- Superseded shutter ADR: `docs/decisions/001-shutter-entry-not-paper-tear.md`

## Conventions

- No narrative inline comments in source — notes go in markdown. Rule: `.cursor/rules/no-narrative-code-comments.mdc`.

Scratch is local thinking only. Do not map it. Do not commit it unless asked.

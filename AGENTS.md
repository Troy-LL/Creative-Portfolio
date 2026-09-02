## Learned User Preferences

- Prefer CodeGraph and code-review-graph installed for Cursor at user-global scope (`~/.cursor/mcp.json` and user-level guidance), not project-local MCP/rules pollution.
- On Windows, code-review-graph must stay MCP-only (no Cursor hooks). Hooks/`.sh`/`.cmd` under `~/.cursor/hooks` cause popups; keep `~/.cursor/hooks.json` empty of CRG entries and rely on MCP `serve --auto-watch`.
- When graph/MCP tooling is broken or unindexed, prefer the agent fixing, configuring, and indexing rather than only listing manual steps.

## Learned Workspace Facts

- This Portfolio repo is indexed with both CodeGraph (`.codegraph/`) and code-review-graph (`.code-review-graph/`); those index dirs are local and gitignored.
- Root is the portfolio redesign. First live surface is card-lab (`npm start` → :4173). The former desktop OS shell (and Founders Cafe) lives under `archive/desktop-os/` and is not the live surface.
- WIP branch is `dev/redesign`. `master` is the last shipped stub.
- Brand SoT is external: `Troy-LL/personal` → `docs/branding.md`.
- On Windows, Cursor MCP for these tools often needs absolute binary paths—bare `codegraph` / `code-review-graph` command names frequently fail under Cursor’s launch PATH.

## Docs

- Front door / how to run: `README.md` (local cheat sheet: `start.md`)
- Three trees (root card-lab, calling-card lab, archived OS): `docs/architecture.md`
- Entry fold-open UI (tab / fold / inside / press / zoom): `docs/design.md`
- Fold-open entry, not paper tear: `docs/decisions/002-fold-open-entry-not-paper-tear.md`
- Superseded shutter ADR: `docs/decisions/001-shutter-entry-not-paper-tear.md`

Scratch is local thinking only. Do not map it. Do not commit it unless asked.

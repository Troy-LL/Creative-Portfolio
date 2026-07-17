## Learned User Preferences

- Prefer CodeGraph and code-review-graph installed for Cursor at user-global scope (`~/.cursor/mcp.json` and user-level guidance), not project-local MCP/rules pollution.
- On Windows, code-review-graph must stay MCP-only (no Cursor hooks). Hooks/`.sh`/`.cmd` under `~/.cursor/hooks` cause popups; keep `~/.cursor/hooks.json` empty of CRG entries and rely on MCP `serve --auto-watch`.
- When graph/MCP tooling is broken or unindexed, prefer the agent fixing, configuring, and indexing rather than only listing manual steps.

## Learned Workspace Facts

- This Portfolio repo is indexed with both CodeGraph (`.codegraph/`) and code-review-graph (`.code-review-graph/`); those index dirs are local and gitignored.
- The site is a desktop OS-style portfolio shell; Founders Cafe is a separate React/Vite app built into `assets/founders-cafe/`.
- On Windows, Cursor MCP for these tools often needs absolute binary paths—bare `codegraph` / `code-review-graph` command names frequently fail under Cursor’s launch PATH.

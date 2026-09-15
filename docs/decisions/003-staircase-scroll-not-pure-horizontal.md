# Staircase scroll, not a pure horizontal strip

Status: Superseded by [004-l-path-scroll-not-staircase.md](004-l-path-scroll-not-staircase.md)

## Context

After the fold-open card entry, the live table today maps further vertical wheel to horizontal travel only (`01` → `02` / `Welcome.`). That is enough for the entry handoff, but content chapters (flagship and later) need depth. A single long vertical page would abandon the table. Extending pure-horizontal forever would force every chapter into one viewport and starve the flagship.

The desired path is a staircase (zigzag): horizontal moves change chapter; vertical scroll reads inside a chapter. Drawn as right-angle runs — horizontal bar, corner, vertical leg, corner, next vertical leg — not a free 2D camera.

## Decision

Portfolio navigation after the card uses a **staircase**:

1. **Section `01` (card)** — Vertical wheel still drives fold (and the short hold). The first **horizontal** run is the chapter change off the card into the next section. `01` is not a free vertical story page.
2. **Later sections** — Each content chapter is a **vertical leg**: wheel scrolls that section’s own content until its bottom wall.
3. **Corners** — At the end of a vertical leg (or after `01`’s hold), further downward wheel performs a **horizontal** chapter change into the next section. Scroll-up reverses: back through the current leg, then the prior corner, then earlier chapters, then fold.
4. **Motion rule** — One axis at a time. No diagonal pan, no zoom/dolly/portal into the card for chapter changes. Horizontal hops stay translateX-style table moves; vertical legs scroll section content in place (or an equivalent single-axis track).

We will not use: infinite free roamlane, nested scroll traps that fight the wheel without clear walls, or replacing the table with a normal multi-page marketing site.

## Consequences

- Superseded: chapter changes after `02` are no longer horizontal corners. See ADR 004 (L-path: one H hop, then vertical stack).

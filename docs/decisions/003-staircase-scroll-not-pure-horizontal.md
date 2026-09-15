# Staircase scroll, not a pure horizontal strip

Status: Accepted

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

- `docs/design.md` owns the visitor scroll story; this ADR is the axis rule.
- `assets/js/portfolio-horizon.js` owns hold + staircase path (corners and legs). Placeholder stations `02`–`04` ship in `index.html`; real section bodies replace those stubs without changing this axis rule.
- Each section declares its own wall (and may change floor color). Vertical legs stay long enough to read (`legVh` ≥ ~3); a short dwell after each chapter (except the last) lands before the next horizontal hop so the axis flip does not feel like a whip. Horizontal hops stay roughly one viewport unless a later ADR says otherwise.
- Section map (flagship, shelf, archive, person, book exit) can evolve in design docs without changing this axis rule.

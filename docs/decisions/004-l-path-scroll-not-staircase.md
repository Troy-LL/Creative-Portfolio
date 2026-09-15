# L-path scroll, not a staircase

Status: Accepted  
Supersedes: [003-staircase-scroll-not-pure-horizontal.md](003-staircase-scroll-not-pure-horizontal.md)

## Context

The staircase (H corner → V leg → H corner → …) asked for too many axis flips between chapters. The visitor diagram is a single right angle: leave the card horizontally, then read everything else vertically.

## Decision

After fold + hold on `01`:

1. **One horizontal hop** — chapter change off the card onto the content column (`01` → `02`).
2. **One vertical stack** — sections `02`–`06` sit in a single column; further wheel only moves Y. No more horizontal corners between chapters.
3. **Motion rule** — still one axis at a time; no diagonal, zoom, scale, dolly, or portal into the card.

Scroll-up reverses: back up the stack → the single hop → hold → fold.

## Consequences

- `docs/design.md` owns the visitor scroll story; this ADR is the axis rule.
- `assets/js/portfolio-horizon.js` builds the L (`buildStaircase` kept as the builder name).
- ADR 003 is superseded; do not add zigzag chapter hops without a new ADR.

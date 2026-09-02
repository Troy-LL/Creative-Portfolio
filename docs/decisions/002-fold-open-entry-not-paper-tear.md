# Fold-open entry, not paper tear

Status: Accepted

## Context

Shutter-lift entry (ADR 001) treated the card as a rigid panel that translates up. The desired visitor experience is thick printed cardstock that folds open around horizontal creases, reveals an inside, then requires an explicit press to enter. Paper rip / tearable cloth still fights the stiff-card metaphor and needs heavy simulation.

## Decision

We enter the portfolio by folding the calling card open via a bottom pull tab (CSS 3D Z-fold illusion), revealing an inside surface, then zooming in only after the visitor presses that inside. We will not use paper tearing, cloth, fracture, particle destruction, or a physics engine for this entry. Snap-open does not navigate.

## Consequences

- Visitor entry code lives at repo root (`index.html`, `assets/js/card-lab.js`, `assets/js/card-fold.js`). Fold math is also in `calling-card/src/fold/` for the React lab.
- `calling-card/src/shutter/` is retired in favor of fold.
- Paper-rip / card-tear prototypes were removed from the live tree. Do not put them back without a new ADR.
- Interaction ships in phases: fold proof → inside reveal → enter press → portfolio zoom.

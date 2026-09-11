# 02 feel lock

Status: Accepted

Date: 2026-09-12

## Context

Station `02` on the horizontal table currently reads as `Welcome.` That is not the product. After the `01` card/hatch, the workbench needed a feel lock before any live implement so later work does not drift into a museum, a grid, or a Mac OS revival.

## Decision

We will treat [docs/02-FEEL.md](../02-FEEL.md) (locked 2026-09-12 by Troy) as the feel source of truth for station `02`. The workbench is a bone-paper desk with at most three furniture pads stacked vertically (Tinig on top, EditLayer under it, third empty under that). Room travel (`01` → `02` → `03`) stays a horizontal table: main visual is sideways pan (`translateX`); after `02`’s stack is done, vertical wheel can still pan between stations. Inside `02`, wheel down moves to the next project down the stack. Each seat is a framed landscape plate; neighbor peek is above/below, not left/right carousel pads. Peek is nested in-frame and earned; leave pulls back to the desk. `03` stays parked. No live implement until Troy names a sprint.

## Consequences

- Feel lives in `docs/02-FEEL.md`. The Horizontal table section in `docs/design.md` only points there.
- Do not ship `Welcome.` as the `02` product, a fake demo, a store tile, or twin MacBooks.
- Do not add `03` / CRAFT from this lock.
- Do not revive seats in a horizontal row or left/right neighbor pads. The PR #23 row lock was wrong; the stack is the lock.
- Violating axis, refuse, or peek/leave would look right and still be wrong — read the feel file first.

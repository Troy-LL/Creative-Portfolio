# Design — portfolio entry (card-lab)

First surface of the redesign. Visitor UI on the static root (`npm start` → http://localhost:4173). Not the Vite calling-card lab.

## Intent

The calling card falls onto the table with the locked curved-fall physicality (size, dual shadows, cursor lean). After settle, scroll flattens any cursor tilt, then folds the same card into a nested 3-panel Z to the locked end pose. Clicking the settled card flips it over to show the back (same paper tooth, offset grain; click again returns to the front) — flip duration is a lab dial, slower than a snap. As it folds, the wall surface patch directly under the card slides straight up on the same scroll-driven fold progress — like raising a hatch in the wall — revealing a looping WebM glimpse through the slit below the folded card, framed as a window (vignette on that slit, not the full well). Scroll-up closes both. One continuous object — keep the 4173 look; fold is added on top. It is not a shutter lift, button, fade, page wipe, or paper tear.

After the fold locks open, a short wall of extra downward scroll holds that pose (card does not move) so leaving `01` is easy but not instant. Further scroll takes **one horizontal hop** off the card onto the content column, then a **vertical stack** through later sections (ADR [004](decisions/004-l-path-scroll-not-staircase.md)). One axis at a time — no diagonal pan, zoom, scale, dolly, or portal into the card. The old zigzag staircase (ADR [003](decisions/003-staircase-scroll-not-pure-horizontal.md)) is superseded.

The hop off `01` runs past one viewport (`cornerVw` ≈ 1.35). Station `01` is that wide, but the card world stays one viewport wide and left-anchored (centered in the resting frame). The extra width is a right-side runway for the dual-layer push hand. A decorative hand sits on the `01`→`02` seam: `.horizon-hand--front` (`assets/hands/push-fingers.png`, on top of `01`) and `.horizon-hand--back` (`assets/hands/push-palm.png`, in `02` under `01`’s floor). Same display height (~70vh) so the cut edges join; runway-clipped off-frame at rest (`cornerVw` ≈ 1.35). Station `02` is a black field. The hand is `aria-hidden` and non-interactive.

**Shipped today:** L-path after fold — hold on `01`, one H hop onto `02`, then V through `02`–`06` (flagship / shelf / archive / person / exit) on one column. The hop still counts as chapter `01` for nav; each handoff between stacked legs stays on the leaving chapter until the next section’s top is parked. Scroll-up reverses the stack → hop → hold → fold.

Done when (entry): fall → settle → cursor OK → click flips to back → scroll flattens → fold to end pose with hatch cover slide in sync and the WebM window visible in the slit → short wall → first horizontal hop onto `02`, without the card scaling. Flat rest reads as one sheet (no panel seams, no paper outline halo). Real flagship copy on `02` is a later done-line.

## Stack

Vanilla HTML/CSS/JS: `index.html`, `assets/js/card-lab.js`, `assets/js/card-fold.js`, `assets/js/portfolio-horizon.js`, `assets/css/card-lab.css`. Physical print via `mountPhysicalCard`. Lab dial on the same surface (`?lab=1` or press **L**): material, type, cursor lean, **Nav waveform** (baseline · tilt · lengthen · strength · opacity · epicenter span), **Fold + opening**, **Opening video** (Y + zoom + vignette amount / soft / size + format + uncached payload), physicality — autosaved. Visitor hatch clip is **WebM**. All lab `<details>` start collapsed. Fold/opening debug on this surface too (`?debug=1` skips the fall; does not auto-expand a section). Do not use a second localhost for this.

## Layers (front → back)

1. Perspective stage + dual table shadows (one silhouette: contact umbra at rest, soft only in air)
2. CSS rig (fall + cursor forces)
3. Nested 3-panel fold sheet (flat at rest = one card)
4. Wall hatch behind the card (well: looping clip + vignette overlay; paper cover slides up). Visible window is the slit below the folded card, not the full well.

## Interaction

| State | Behavior |
| --- | --- |
| Fall / settle | Locked PHYS curved drop + soft land (card-lab prefs) |
| Settled | Cursor pick-up lean / lift on front **and** back |
| Click | Flip to back: plain paper + **TL** in **Dancing Script** (lab **Back → Initials font**; kit in `personal/fonts/DancingScript`). Flip **900 ms** (lab **Flip duration**). Back face: no fold on scroll. |
| Scroll on `01` | Front: cursor scale → 0 (flatten) then fold 0→1; wall hatch slides up with fold; scroll-up closes both. Back: first scroll flips to front, then fold runs on continued scroll. |
| After fold | Fold locked: a short wall (~0.22 vh) on `01`. Then L-path: one H hop (`cornerVw` ≈ 1.35) onto the content column, then V through stacked sections (`legVh` 3.5 each). Viewport stays pinned; track `translate3d(-x,-y,0)` — no scale. |
| L-path | Vertical wheel after hold: one shared path. First segment moves X; the rest only move Y down the `02`–`06` stack. Scroll-up reverses path → hold → fold. See ADR 004. |
| Fold end | `{ top: 20, mid: 103, bot: -111 }`, viewTip −1 |
| Fold hinges | preserve-3d stack; sheet +4px; hatch on table plane (card at `--layer-z`); 2px hinge overlap |
| Surface hatch | Card width; cover slides up with fold (`shiftPct`); well clipped from the reveal line down. Locked opening `{ heightScale: 1.5, extendBottomPct: 0.4, layerZ: 80, wellOpacity: 1 }`. |
| Hatch clip | Visitor: looping `assets/hatch/IMG_6909.webm` (muted, `playsinline`). Lab **Video Y** / **Video zoom** crop it; format buttons can swap local MP4 / MOV. **Measure uncached** reports payload + time to first frame with `cache: no-store`. |
| Hatch vignette | Overlay is sized to the **visible slit below the folded card** (`hatchApertureVars`), not the full well. Lab **Vignette** (amount) / **Vignette soft** / **Vignette size** (scales the overlay on that slit; default `{ vignette: 0.85, vignetteSoft: 32, vignetteSize: 1.3 }`). |
| Affordance | Subtle “scroll down” once per session after settle |
| Debug | `?debug=1` on :4173 — skip fall, same lab (sections stay collapsed), scrub fold 0→1 |

## Out of scope here

Paper tear; React FoldStage as the visitor entry (dial only); free 2D roam; nested scroll traps without clear walls; replacing the table with a conventional multi-page marketing site. Full section contents (flagship body, shelf, archive desk, person, book exit) are planned against the L-path, not shipped in this entry pass.

## Table + L-path

Same bone `--floor` on early stations; later sections may change floor color and must declare their own wall. Quiet corner index on each station, not a HUD.

| Run | Axis | Role |
| --- | --- | --- |
| `01` card | Vertical → fold + hold | Entry object; not a free story page |
| `01` → `02` | Horizontal hop | Only chapter change off the card |
| `02`–`06` | Vertical stack | Flagship → shelf → archive → person → exit on one column |

**Shipped:** L-path geometry + legs `02`–`06`. **Next:** real flagship content on `02`.

`02` is the workbench: work objects stack vertically (Tinig / EditLayer / empty). Feel is in [02-FEEL.md](02-FEEL.md).

## Code

- Fall + cursor: `assets/js/card-lab.js`
- Fold math: `assets/js/card-fold.js` (`resolveOpeningPeel`, `hatchApertureVars`, `hatchVideoVars`, `HATCH_OPENING`, `HATCH_VIDEO`, `HATCH_VIDEO_FORMATS`) + `calling-card/src/fold/model.ts`
- After-fold L-path travel: `assets/js/portfolio-horizon.js` (`buildStaircase`, `advanceHorizon`, `trackPose`, `applyStaircaseLayout`, `HORIZON`)
- Styles: `assets/css/card-lab.css` (`.css-hatch-well` / `.css-hatch-video` / `.css-hatch-vignette`, `.horizon-hand--front` / `--back`) + `calling-card/src/fold/fold.css`
- Markup: `index.html` hatch slot (video + vignette + cover) + `.horizon-track` stations `01` / `02`; push hand split across `01`/`02` (`push-fingers.png` + `push-palm.png`)
- Material / type / cursor / nav waveform / fold / opening video / phys dial: `?lab=1` or **L** on :4173
- Fold + opening debug (same surface): `?debug=1` on :4173
- Scroll axis rule: `docs/decisions/004-l-path-scroll-not-staircase.md`

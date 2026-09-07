# Design — portfolio entry (card-lab)

First surface of the redesign. Visitor UI on the static root (`npm start` → http://localhost:4173). Not the Vite calling-card lab.

## Intent

The calling card falls onto the table with the locked curved-fall physicality (size, dual shadows, cursor lean). After settle, scroll flattens any cursor tilt, then folds the same card into a nested 3-panel Z to the locked end pose. Clicking the settled card flips it over to show the back (same paper tooth, offset grain; click again returns to the front) — flip duration is a lab dial, slower than a snap. As it folds, the wall surface patch directly under the card slides straight up on the same scroll-driven fold progress — like raising a hatch in the wall — revealing a looping WebM glimpse through the slit below the folded card, framed as a window (vignette on that slit, not the full well). Scroll-up closes both. One continuous object — keep the 4173 look; fold is added on top. It is not a shutter lift, button, fade, page wipe, or paper tear.

After the fold locks open, a short wall of extra downward scroll holds that pose (card does not move) so leaving `01` is easy but not instant. Further scroll pans one viewport left — translateX only, no camera zoom, scale, dolly, or portal into the card. Station `01` is the folded card; station `02` is the same bone floor with `Welcome.`, one viewport wide. `02` is the last page for now: further down stops at that wall. Later stations will each have their own wall sized to their content. Scroll-up returns through the card.

Done when: fall → settle → cursor OK → click flips to back → scroll flattens → fold to end pose with hatch cover slide in sync and the WebM window visible in the slit → short wall → table slides left one page to `02` / `Welcome.` and stops there, without the card scaling. Flat rest reads as one sheet (no panel seams, no paper outline halo).

## Stack

Vanilla HTML/CSS/JS: `index.html`, `assets/js/card-lab.js`, `assets/js/card-fold.js`, `assets/js/portfolio-horizon.js`, `assets/css/card-lab.css`. Physical print via `mountPhysicalCard`. Lab dial on the same surface (`?lab=1` or press **L**): material, type, cursor lean, **Fold + opening**, **Opening video** (Y + zoom + vignette amount / soft / size + format + uncached payload), physicality — autosaved. Visitor hatch clip is **WebM**. All lab `<details>` start collapsed. Fold/opening debug on this surface too (`?debug=1` skips the fall; does not auto-expand a section). Do not use a second localhost for this.

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
| Scroll | Front: cursor scale → 0 (flatten) then fold 0→1; wall hatch slides up with fold; scroll-up closes both. Back: first scroll flips to front, then fold runs on continued scroll. |
| After fold | Fold locked: a short wall (~0.22 vh) on `01` before pan. Then vertical wheel maps to one viewport of horizontal travel (`travelVw` 1). Viewport stays pinned; track `translate3d(x,0,0)` only — no scale. `02` has no next page yet, so further down clamps there (a wall). Scroll-up reverses the pan, then the `01` wall, then fold. |
| Fold end | `{ top: 20, mid: 103, bot: -111 }`, viewTip −1 |
| Fold hinges | preserve-3d stack; sheet +4px; hatch on table plane (card at `--layer-z`); 2px hinge overlap |
| Surface hatch | Card width; cover slides up with fold (`shiftPct`); well clipped from the reveal line down. Locked opening `{ heightScale: 1.5, extendBottomPct: 0.4, layerZ: 80, wellOpacity: 1 }`. |
| Hatch clip | Visitor: looping `assets/hatch/IMG_6909.webm` (muted, `playsinline`). Lab **Video Y** / **Video zoom** crop it; format buttons can swap local MP4 / MOV. **Measure uncached** reports payload + time to first frame with `cache: no-store`. |
| Hatch vignette | Overlay is sized to the **visible slit below the folded card** (`hatchApertureVars`), not the full well. Lab **Vignette** (amount) / **Vignette soft** / **Vignette size** (scales the overlay on that slit; default `{ vignette: 0.55, vignetteSoft: 32, vignetteSize: 1 }`). |
| Affordance | Subtle “scroll down” once per session after settle |
| Debug | `?debug=1` on :4173 — skip fall, same lab (sections stay collapsed), scrub fold 0→1 |

## Out of scope here

Full portfolio (work grid, color-per-section, later stations), paper tear, React FoldStage as the visitor entry (dial only). Vertical page after the strip — navigation stays horizontal.

## Horizontal table

Same `--floor`. Two stations this pass, each one viewport: `01` card/hatch, `02` + `Welcome.` Quiet corner index on each station, not a HUD. Each page has a wall before the next; `01`'s wall is short. Future stations may change floor color and will declare their own wall; this pass does not add a page after `02`.

## Code

- Fall + cursor: `assets/js/card-lab.js`
- Fold math: `assets/js/card-fold.js` (`resolveOpeningPeel`, `hatchApertureVars`, `hatchVideoVars`, `HATCH_OPENING`, `HATCH_VIDEO`, `HATCH_VIDEO_FORMATS`) + `calling-card/src/fold/model.ts`
- After fold: `assets/js/portfolio-horizon.js` (`advanceHorizon`, `trackTranslatePx`, `HORIZON`)
- Styles: `assets/css/card-lab.css` (`.css-hatch-well` / `.css-hatch-video` / `.css-hatch-vignette`) + `calling-card/src/fold/fold.css`
- Markup: `index.html` hatch slot (video + vignette + cover) + `.horizon-track` stations `01` / `02`
- Material / type / cursor / fold / opening video / phys dial: `?lab=1` or **L** on :4173
- Fold + opening debug (same surface): `?debug=1` on :4173

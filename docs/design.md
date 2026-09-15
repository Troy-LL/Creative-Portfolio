# Design — portfolio entry (card-lab)

First surface of the redesign. Visitor UI on the static root (`npm start` → http://localhost:4173). Not the Vite calling-card lab.

## Intent

The calling card falls onto the table with the locked curved-fall physicality (size, dual shadows, cursor lean). After settle, scroll flattens any cursor tilt, then folds the same card into a nested 3-panel Z to the locked end pose. Clicking the settled card flips it over to show the back (same paper tooth, offset grain; click again returns to the front) — flip duration is a lab dial, slower than a snap. As it folds, the wall surface patch directly under the card slides straight up on the same scroll-driven fold progress — like raising a hatch in the wall — revealing a looping WebM glimpse through the slit below the folded card, framed as a window (vignette on that slit, not the full well). Scroll-up closes both. One continuous object — keep the 4173 look; fold is added on top. It is not a shutter lift, button, fade, page wipe, or paper tear.

After the fold locks open, a short wall of extra downward scroll holds that pose (card does not move) so leaving `01` is easy but not instant. Further scroll takes the **first horizontal chapter change** off the card onto the next section. Navigation after entry follows a **staircase** (ADR [003](decisions/003-staircase-scroll-not-pure-horizontal.md)): horizontal = change chapter; vertical = read inside a chapter. One axis at a time — no diagonal pan, zoom, scale, dolly, or portal into the card for chapter changes.

**Shipped today:** staircase after fold — hold on `01`, then H corner → V leg for sections `02`–`06` (flagship / shelf / archive / person / exit). Scroll-up reverses through the current leg, prior corners, then the card fold.

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
| After fold | Fold locked: a short wall (~0.22 vh) on `01`. Then staircase path: H corner → V leg → dwell → … (`cornerVw` 1, `legVh` 3.5, `cornerHoldVh` 0.32). Viewport stays pinned; track `translate3d(-x,-y,0)` — no scale. |
| Staircase | Vertical wheel after hold advances one shared path. Corners move X; legs move Y; a short dwell at the foot of each chapter (except the last) absorbs scroll before the next corner so the axis flip does not feel like a whip. Scroll-up reverses path → hold → fold. See ADR 003. |
| Fold end | `{ top: 20, mid: 103, bot: -111 }`, viewTip −1 |
| Fold hinges | preserve-3d stack; sheet +4px; hatch on table plane (card at `--layer-z`); 2px hinge overlap |
| Surface hatch | Card width; cover slides up with fold (`shiftPct`); well clipped from the reveal line down. Locked opening `{ heightScale: 1.5, extendBottomPct: 0.4, layerZ: 80, wellOpacity: 1 }`. |
| Hatch clip | Visitor: looping `assets/hatch/IMG_6909.webm` (muted, `playsinline`). Lab **Video Y** / **Video zoom** crop it; format buttons can swap local MP4 / MOV. **Measure uncached** reports payload + time to first frame with `cache: no-store`. |
| Hatch vignette | Overlay is sized to the **visible slit below the folded card** (`hatchApertureVars`), not the full well. Lab **Vignette** (amount) / **Vignette soft** / **Vignette size** (scales the overlay on that slit; default `{ vignette: 0.85, vignetteSoft: 32, vignetteSize: 1.3 }`). |
| Affordance | Subtle “scroll down” once per session after settle |
| Debug | `?debug=1` on :4173 — skip fall, same lab (sections stay collapsed), scrub fold 0→1 |

## Out of scope here

Paper tear; React FoldStage as the visitor entry (dial only); free 2D roam; nested scroll traps without clear walls; replacing the table with a conventional multi-page marketing site. Full section contents (flagship body, shelf, archive desk, person, book exit) are planned against the staircase, not shipped in this entry pass.

## Table + staircase

Same bone `--floor` on early stations; later sections may change floor color and must declare their own wall. Quiet corner index on each station, not a HUD.

| Run | Axis | Role |
| --- | --- | --- |
| `01` card | Vertical → fold + hold | Entry object; not a free story page |
| `01` → `02` | Horizontal corner | First chapter change off the card |
| `02` flagship | Vertical leg | Placeholder title + note (real project later) |
| `02` → `03` | Horizontal corner | Chapter change |
| `03` shelf | Vertical leg | Placeholder |
| `03` → `04` | Horizontal corner | Chapter change |
| `04` archive | Vertical leg | Retired desktop OS museum piece |
| `04` → `05` | Horizontal corner | Chapter change |
| `05` person | Vertical leg | Who made the card |
| `05` → `06` | Horizontal corner | Chapter change |
| `06` exit | Vertical leg | Book CTA; end wall |

**Shipped:** staircase geometry + legs `02`–`06`. **Next:** real flagship content on `02`.

`02` is the workbench: work objects stack vertically (Tinig / EditLayer / empty); room pan stays horizontal. Feel is in [02-FEEL.md](02-FEEL.md).

## Code

- Fall + cursor: `assets/js/card-lab.js`
- Fold math: `assets/js/card-fold.js` (`resolveOpeningPeel`, `hatchApertureVars`, `hatchVideoVars`, `HATCH_OPENING`, `HATCH_VIDEO`, `HATCH_VIDEO_FORMATS`) + `calling-card/src/fold/model.ts`
- After-fold staircase travel: `assets/js/portfolio-horizon.js` (`buildStaircase`, `advanceHorizon`, `trackPose`, `applyStaircaseLayout`, `HORIZON`)
- Styles: `assets/css/card-lab.css` (`.css-hatch-well` / `.css-hatch-video` / `.css-hatch-vignette`) + `calling-card/src/fold/fold.css`
- Markup: `index.html` hatch slot (video + vignette + cover) + `.horizon-track` stations `01` / `02`
- Material / type / cursor / nav waveform / fold / opening video / phys dial: `?lab=1` or **L** on :4173
- Fold + opening debug (same surface): `?debug=1` on :4173
- Scroll axis rule: `docs/decisions/003-staircase-scroll-not-pure-horizontal.md`

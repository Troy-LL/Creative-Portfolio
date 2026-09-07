# Design — portfolio entry (card-lab)

First surface of the redesign. Visitor UI on the static root (`npm start` → http://localhost:4173). Not the Vite calling-card lab.

## Intent

The calling card falls onto the table with the locked curved-fall physicality (size, dual shadows, cursor lean). After settle, scroll flattens any cursor tilt, then folds the same card into a nested 3-panel Z to the locked end pose. Clicking the settled card flips it over to show the back (same paper tooth, offset grain; click again returns to the front) — flip duration is a lab dial, slower than a snap. As it folds, the wall surface patch directly under the card slides straight up on the same scroll-driven fold progress — like raising a hatch in the wall — revealing a glimpse of the inside; scroll-up closes both. One continuous object — keep the 4173 look; fold is added on top. It is not a shutter lift, button, fade, page wipe, or paper tear.

Done when: fall → settle → cursor OK → click flips to back → scroll flattens → fold to end pose with wall hatch slide in sync. Flat rest reads as one sheet (no panel seams, no paper outline halo).

## Stack

Vanilla HTML/CSS/JS: `index.html`, `assets/js/card-lab.js`, `assets/js/card-fold.js`, `assets/css/card-lab.css`. Physical print via `mountPhysicalCard`. Lab dial on the same surface (`?lab=1` or press **L**): material, type, cursor lean, fold, opening, **Opening video** (Y + zoom + vignette + size + MOV/MP4/WebM + uncached payload), flip duration, physicality — autosaved. All lab `<details>` start collapsed. Fold/opening debug on this surface too (`?debug=1` skips the fall; does not auto-expand a section). Do not use a second localhost for this.

## Layers (front → back)

1. Perspective stage + dual table shadows (one silhouette: contact umbra at rest, soft only in air)
2. CSS rig (fall + cursor forces)
3. Nested 3-panel fold sheet (flat at rest = one card)
4. Wall hatch behind the card, sized to the folded silhouette (bottom hugs bot panel)

## Interaction

| State | Behavior |
| --- | --- |
| Fall / settle | Locked PHYS curved drop + soft land (card-lab prefs) |
| Settled | Cursor pick-up lean / lift on front **and** back |
| Click | Flip to back: plain paper + **TL** in **Dancing Script** (lab **Back → Initials font**; kit in `personal/fonts/DancingScript`). Back face: no fold on scroll. |
| Scroll | Front: cursor scale → 0 (flatten) then fold 0→1; wall hatch slides up with fold; scroll-up closes both. Back: first scroll flips to front, then fold runs on continued scroll. |
| Fold end | `{ top: 20, mid: 103, bot: -111 }`, viewTip −1 |
| Fold hinges | preserve-3d stack; sheet +4px; hatch on table plane (card at `--layer-z`); 2px hinge overlap |
| Surface hatch | Card width; top tracks fold; bottom anchored at card edge (persistent shadow slot). Grey well plays looping hatch clip (`assets/hatch/IMG_6909.webm`; lab can swap MP4 / MOV). Lab **Video Y** / **Video zoom** crop it; **Vignette** / **Vignette soft** / **Vignette size** shade the **visible slit below the folded card** (size scales the overlay on that slit); **Measure uncached** reports payload + time to first frame with `cache: no-store` |
| Affordance | Subtle “scroll down” once per session after settle |
| Debug | `?debug=1` on :4173 — skip fall, same lab (sections stay collapsed), scrub fold 0→1 |

## Out of scope here

Full portfolio room, paper tear, React FoldStage as the visitor entry (dial only).

## Code

- Fall + cursor: `assets/js/card-lab.js`
- Fold math: `assets/js/card-fold.js` (`resolveOpeningPeel`, `hatchApertureVars`, `HATCH_OPENING`, `HATCH_VIDEO`, `HATCH_VIDEO_FORMATS`) + `calling-card/src/fold/model.ts`
- Styles: `assets/css/card-lab.css` + `calling-card/src/fold/fold.css`
- Markup: `index.html` + FoldStage hatch
- Material / type / cursor / fold / opening / phys dial: `?lab=1` or **L** on :4173
- Fold + opening debug (same surface): `?debug=1` on :4173

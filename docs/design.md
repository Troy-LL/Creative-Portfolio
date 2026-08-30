# Design — portfolio entry (card-lab)

Visitor UI on the static root surface (`npm run serve` → http://localhost:4173).

## Intent

The calling card falls onto the table with the locked curved-fall physicality (size, dual shadows, cursor lean). After settle, scroll flattens any cursor tilt, then folds the same card into a nested 3-panel Z to the locked end pose. One continuous object — keep the 4173 look; fold is added on top. It is not a shutter lift, button, fade, page wipe, or paper tear.

Done when: fall → settle → cursor OK → scroll flattens → fold to end pose.

## Stack

Vanilla HTML/CSS/JS: `index.html`, `assets/js/card-lab.js`, `assets/js/card-fold.js`, `assets/css/card-lab.css`. Physical print via `mountPhysicalCard`. Lab dial on the same surface (`?lab=1` or press **L**): material, type, cursor lean, fold end pose, physicality — autosaved. React `calling-card/` remains a secondary material sandbox (`localhost:5174`).

## Layers (front → back)

1. Perspective stage + dual table shadows
2. CSS rig (fall + cursor forces)
3. Nested 3-panel fold sheet (flat at rest = one card)

## Interaction

| State | Behavior |
| --- | --- |
| Fall / settle | Locked PHYS curved drop + soft land (card-lab prefs) |
| Settled | Cursor pick-up lean / lift (unchanged) |
| Scroll | Cursor scale → 0 (flatten) then fold 0→1; scroll-up closes |
| Fold end | `{ top: 20, mid: 103, bot: -111 }`, viewTip −1 |
| Affordance | Subtle “scroll down” once per session after settle |

## Out of scope here

Full portfolio room, paper tear, React FoldStage as the visitor entry (dial only).

## Code

- Fall + cursor: `assets/js/card-lab.js`
- Fold math: `assets/js/card-fold.js`
- Styles: `assets/css/card-lab.css`
- Markup: `index.html`
- Material / type / cursor / fold / phys dial: `?lab=1` or **L** on :4173
- React sandbox: `calling-card/` @ :5174

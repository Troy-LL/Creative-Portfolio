# Architecture

Three trees. Do not collapse them into one app.

| Tree | Command / URL | Role |
| --- | --- | --- |
| Root `index.html` + `assets/js/card-*.js` | `npm start` → http://localhost:4173 | **Live redesign.** First surface is card-lab (fall, cursor, flip, fold, hatch). |
| `calling-card/` | `npm run dev:card` → http://localhost:5174 | React + TypeScript material / fold lab. Shares print CSS and fold math. Not the visitor entry. |
| `archive/desktop-os/` | http://localhost:4173/archive/desktop-os/ | Former Mac desktop OS + Founders Cafe. Not live. |

## Visitor path (card-lab)

`index.html` → `assets/js/card-lab.js` (fall, cursor, flip, scroll) → `assets/js/card-fold.js` (fold / hatch / flip motion) → `assets/js/portfolio-horizon.js` (hold then horizontal table after fold) → `assets/js/card-material/mount-physical-card.js` (stock + ink + back mark).

Styles: `assets/css/card-lab.css`, `assets/css/card-back-fonts.css`, plus `calling-card/src/components/Card/Card.css` for the print face.

Back initials font kit is copied into `assets/fonts/back/`; source of truth is `Troy-LL/personal` → `fonts/`.

## Tests

- Fold / flip / hatch: `tests/unit/card-fold-opening.test.js`, `tests/unit/fold-model.test.ts`
- After-fold horizontal table: `tests/unit/portfolio-horizon.test.js`
- Root is redesign, not the OS: `tests/e2e/redesign.spec.js`
- Desktop OS e2e: `tests/e2e/archive/` (ignored by default Playwright config)

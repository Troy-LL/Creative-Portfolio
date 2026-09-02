# Creative Portfolio

Redesign in progress on **`dev/redesign`**. `master` is the last shipped stub only.

The live visitor surface is a fold-open calling card (**card-lab**): fall onto the table, cursor lean, click to flip, scroll to fold and raise the hatch. That is the first room of the new site, not a prototype parked behind Vite. See `docs/design.md`.

The old Mac desktop OS is archived as past work.

## Run

Local steps, ports, and how to free a stuck port: **`start.md`**.

```bash
git checkout dev/redesign
npm start    # same as npm run serve — http://localhost:4173
```

| URL | What |
| --- | --- |
| http://localhost:4173 | Visitor entry (card-lab) |
| http://localhost:4173/?lab=1 | Same + dials (or press **L**) |
| http://localhost:4173/?debug=1 | Skip fall, start settled |
| http://localhost:5174 | Optional React material lab (`npm run dev:card`) |
| http://localhost:4173/archive/desktop-os/ | Archived Desktop TL |

## Brand

Visual and voice SoT: [Troy-LL/personal](https://github.com/Troy-LL/personal) → `docs/branding.md`.

## Archive

`archive/desktop-os/` is the former interactive desktop portfolio (dock, Finder, windows, Founders Cafe). Kept runnable for selected-work later. See that folder's README.

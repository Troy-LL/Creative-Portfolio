# Physical calling card

React + TypeScript material study for uncoated stationery (American Psycho reference stock feel). Typography and real credentials are out of scope here.

## Run

From repo root:

```bash
npm run dev:card
```

Open http://localhost:5174

## Structure

`src/components/Card/` — layered material:

- `PaperSurface` — ivory base
- `PaperTexture` — seeded canvas grain + SVG tooth/fiber
- `PrintedContent` — placeholder ink layout
- `PrintRelief` — micro deboss via opposing light/shadow
- `CardEdge` — cut thickness
- `Lighting` — soft directional + contact shadow

Tune with CSS variables on `.physical-card` (see `Card.css`).

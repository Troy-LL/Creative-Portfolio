# Physical calling card (React lab)

React + TypeScript material study for uncoated stationery. **Not the visitor entry** — that is root card-lab on http://localhost:4173 (`npm start`). This Vite app is the optional fold / material lab.

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

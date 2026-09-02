# Start locally

Work in progress lives on **`dev/redesign`**. `master` is the last shipped stub only.

```bash
git checkout dev/redesign
```

## Visitor entry (card-lab)

This is the redesign's first surface. From the repo root:

```bash
npm start
```

(`npm run serve` is the same command.)

Open **http://localhost:4173**

| URL | What |
| --- | --- |
| http://localhost:4173 | Fall → settle → scroll fold → click flip |
| http://localhost:4173/?lab=1 | Same + material / cursor / fold dials (or press **L**) |
| http://localhost:4173/?debug=1 | Skip fall; start settled (fold debug on same surface) |

Stop: **Ctrl+C** in the terminal.

If the port is stuck (Windows):

```powershell
netstat -ano | findstr ":4173"
Stop-Process -Id <PID> -Force
```

## React fold lab (optional)

Separate Vite app for material / fold experiments. Not the visitor entry.

```bash
npm install --prefix calling-card   # first time only
npm run dev:card
```

Open **http://localhost:5174** (material lab: `?lab=1`).

## Archived desktop OS

With `npm start` already running: http://localhost:4173/archive/desktop-os/

## Tests

```bash
node --test tests/unit/card-fold-opening.test.js
node --test tests/unit/fold-model.test.ts
npx playwright test
```

## More

- Trees: `docs/architecture.md`
- Interaction spec: `docs/design.md`
- Brand fonts / voice: [Troy-LL/personal](https://github.com/Troy-LL/personal) → `docs/branding.md`

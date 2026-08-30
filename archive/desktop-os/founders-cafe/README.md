# Founders Cafe (Vite + React)

Demo site embedded in the portfolio **Safari** window. Source lives here; production files are written to **`../assets/founders-cafe/`** by `vite build` (see `vite.config.js`).

## Commands

```bash
npm install
npm run dev      # local dev server
npm run build    # emit to ../assets/founders-cafe/
```

## Config notes

- **`base`:** `/assets/founders-cafe/` — asset URLs are root-absolute so the iframe loads JS/CSS reliably from the portfolio origin.
- **`build.outDir`:** `../assets/founders-cafe`
- **`build.assetsDir`:** `fc` — avoids a nested `assets/` folder name next to `index.html`.

The **repo includes this folder** so CI (e.g. Vercel) can run **`npm run build`** from the repo root and refresh `assets/founders-cafe/` on every deploy.

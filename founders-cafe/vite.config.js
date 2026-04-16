import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Built into `assets/founders-cafe/`. `assetsDir: "fc"` avoids Vite putting chunks in
 * a folder named `assets/` next to index.html (resolves to `.../assets/assets/` 404s).
 */
export default defineConfig({
  /* Root-absolute URLs so script/CSS always resolve from the site origin (reliable in iframes). */
  base: "/assets/founders-cafe/",
  build: {
    outDir: path.resolve(__dirname, "../assets/founders-cafe"),
    emptyOutDir: true,
    assetsDir: "fc",
  },
});

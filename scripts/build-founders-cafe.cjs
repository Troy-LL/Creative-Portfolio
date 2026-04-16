/**
 * Root `npm run build` for Vercel / CI.
 * Installs deps in `founders-cafe/` and runs Vite → `assets/founders-cafe/`.
 * If `founders-cafe/package.json` is missing, exits 0 (use committed `assets/founders-cafe/` only).
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const dir = path.join(process.cwd(), "founders-cafe");
const pkg = path.join(dir, "package.json");

if (!fs.existsSync(pkg)) {
  console.log(
    "[build] founders-cafe/ not found — skipping Vite build. Ensure assets/founders-cafe/ is committed.",
  );
  process.exit(0);
}

const hasLock = fs.existsSync(path.join(dir, "package-lock.json"));
execSync(hasLock ? "npm ci" : "npm install", {
  cwd: dir,
  stdio: "inherit",
  env: process.env,
});
execSync("npm run build", { cwd: dir, stdio: "inherit", env: process.env });

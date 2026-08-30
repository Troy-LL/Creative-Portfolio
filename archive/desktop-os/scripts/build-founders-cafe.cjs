/**
 * Build Founders Cafe into archive/desktop-os/assets/founders-cafe/.
 * Run from repo root: npm run build
 * If founders-cafe/package.json is missing, exits 0 (use committed assets).
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const archiveRoot = path.join(__dirname, "..");
const dir = path.join(archiveRoot, "founders-cafe");
const pkg = path.join(dir, "package.json");

if (!fs.existsSync(pkg)) {
  console.log(
    "[build] archive/desktop-os/founders-cafe/ not found — skipping Vite build.",
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

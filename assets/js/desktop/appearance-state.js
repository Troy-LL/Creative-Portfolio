const STORAGE_KEY = "portfolio-appearance";

const DEFAULTS = {
  themeMode: "dark",
  wallpaper: "default",
  uiFont: "system",
  accent: "#007aff",
  animations: true,
};

let mqListener = null;

function normalizeHex(hex) {
  if (!hex || typeof hex !== "string") return "";
  const h = hex.trim().toLowerCase();
  if (h.length === 4 && h[0] === "#") {
    return `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`;
  }
  return h;
}

export function getAppearance() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

function applyDarkClass(isDark) {
  document.body.classList.toggle("dark-theme", isDark);
}

function syncControlCenterUi(state) {
  const btnDark = document.getElementById("btnDarkMode");
  if (btnDark) {
    btnDark.classList.toggle(
      "active",
      document.body.classList.contains("dark-theme"),
    );
  }

  const accent = normalizeHex(state.accent);
  document.querySelectorAll(".cc-color-dot").forEach((d) => {
    const c = normalizeHex(d.dataset.color);
    d.classList.toggle("active", c === accent);
  });

  const btnAnim = document.getElementById("btnAnimations");
  if (btnAnim) btnAnim.classList.toggle("active", state.animations);
}

export function applyAppearance(state = getAppearance()) {
  const { themeMode, wallpaper, uiFont, accent, animations } = state;

  document.documentElement.style.setProperty("--sys-color", accent);

  document.body.dataset.wallpaper = wallpaper;
  document.body.dataset.uiFont = uiFont;

  if (animations) {
    document.body.classList.remove("disable-animations");
  } else {
    document.body.classList.add("disable-animations");
  }

  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  if (mqListener) {
    mq.removeEventListener("change", mqListener);
    mqListener = null;
  }

  if (themeMode === "auto") {
    applyDarkClass(mq.matches);
    mqListener = () => applyDarkClass(mq.matches);
    mq.addEventListener("change", mqListener);
  } else {
    applyDarkClass(themeMode === "dark");
  }

  syncControlCenterUi(state);
}

export function saveAppearance(partial) {
  const next = { ...getAppearance(), ...partial };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  applyAppearance(next);
}

export function applyStoredAppearance() {
  applyAppearance(getAppearance());
}

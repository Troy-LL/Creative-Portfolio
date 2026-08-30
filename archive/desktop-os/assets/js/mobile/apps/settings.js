import {
  getAppearance,
  saveAppearance,
} from "../../desktop/appearance-state.js";

function normalizeHex(hex) {
  if (!hex || typeof hex !== "string") return "";
  const h = hex.trim().toLowerCase();
  if (h.length === 4 && h[0] === "#") {
    return `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`;
  }
  return h;
}

export function mountMobileSettings(host) {
  const render = () => {
    const s = getAppearance();
    const accent = normalizeHex(s.accent);

    host.innerHTML = `
      <div class="ios-list-section">
        <div class="ios-list-header">Appearance</div>
        <div class="ios-list-group">
          <div style="padding:8px 14px 12px">
            <div style="font-size:13px;opacity:0.7;margin-bottom:8px">Theme</div>
            <div class="ios-segmented" role="group" aria-label="Theme">
              <button type="button" data-theme="light" class="${s.themeMode === "light" ? "is-active" : ""}">Light</button>
              <button type="button" data-theme="dark" class="${s.themeMode === "dark" ? "is-active" : ""}">Dark</button>
              <button type="button" data-theme="auto" class="${s.themeMode === "auto" ? "is-active" : ""}">Auto</button>
            </div>
          </div>
          <div style="padding:8px 14px 12px">
            <div style="font-size:13px;opacity:0.7;margin-bottom:8px">Wallpaper</div>
            <div class="ios-wallpaper-grid">
              ${["default", "ocean", "sunset", "forest", "aurora", "midnight"]
                .map(
                  (w) =>
                    `<button type="button" class="ios-wp-btn ios-wp-btn--${w} ${s.wallpaper === w ? "is-selected" : ""}" data-wallpaper="${w}" aria-label="${w}"></button>`,
                )
                .join("")}
            </div>
          </div>
          <div style="padding:8px 14px 12px">
            <div style="font-size:13px;opacity:0.7;margin-bottom:8px">Accent</div>
            <div class="ios-color-dots">
              ${["#f59e0b", "#10b981", "#007aff", "#6366f1", "#a855f7", "#ef4444"]
                .map(
                  (c) =>
                    `<button type="button" class="ios-color-dot ${normalizeHex(c) === accent ? "is-active" : ""}" data-color="${c}" style="background:${c}" aria-label="Accent ${c}"></button>`,
                )
                .join("")}
            </div>
          </div>
        </div>
      </div>
      <div class="ios-list-section">
        <div class="ios-list-header">General</div>
        <div class="ios-list-group">
          <div class="ios-settings-toggle">
            <span>Interface animations</span>
            <button type="button" class="ios-switch" role="switch" aria-checked="${s.animations}" data-toggle-anim></button>
          </div>
          <div style="padding:8px 14px 12px">
            <div style="font-size:13px;opacity:0.7;margin-bottom:8px">Desktop typeface</div>
            <div class="ios-segmented" role="group">
              ${["system", "inter", "dm-sans", "mono"]
                .map(
                  (f) =>
                    `<button type="button" data-font="${f}" class="${s.uiFont === f ? "is-active" : ""}">${f === "dm-sans" ? "DM Sans" : f === "mono" ? "Pixel" : f[0].toUpperCase() + f.slice(1)}</button>`,
                )
                .join("")}
            </div>
          </div>
        </div>
      </div>
    `;

    const animSw = host.querySelector("[data-toggle-anim]");
    if (animSw) {
      animSw.setAttribute("aria-checked", String(s.animations));
      animSw.addEventListener("click", () => {
        saveAppearance({ animations: !getAppearance().animations });
        render();
      });
    }

    host.querySelectorAll("[data-theme]").forEach((btn) => {
      btn.addEventListener("click", () => {
        saveAppearance({ themeMode: btn.dataset.theme });
        render();
      });
    });

    host.querySelectorAll("[data-wallpaper]").forEach((btn) => {
      btn.addEventListener("click", () => {
        saveAppearance({ wallpaper: btn.dataset.wallpaper });
        render();
      });
    });

    host.querySelectorAll("[data-color]").forEach((btn) => {
      btn.addEventListener("click", () => {
        saveAppearance({ accent: btn.dataset.color });
        render();
      });
    });

    host.querySelectorAll("[data-font]").forEach((btn) => {
      btn.addEventListener("click", () => {
        saveAppearance({ uiFont: btn.dataset.font });
        render();
      });
    });
  };

  render();
}

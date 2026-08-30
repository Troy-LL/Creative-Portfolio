import {
  getAppearance,
  normalizeTextScale,
  saveAppearance,
  textScaleEquals,
} from "./appearance-state.js";

function syncSettingsUi(root) {
  const s = getAppearance();

  root.querySelectorAll(".settings-theme-card").forEach((el) => {
    el.classList.toggle(
      "is-selected",
      el.dataset.themeMode === s.themeMode,
    );
  });

  root.querySelectorAll(".settings-wallpaper-swatch").forEach((el) => {
    el.classList.toggle(
      "is-selected",
      el.dataset.wallpaper === s.wallpaper,
    );
  });

  root.querySelectorAll(".settings-font-card").forEach((el) => {
    el.classList.toggle("is-selected", el.dataset.uiFont === s.uiFont);
  });

  root.querySelectorAll(".settings-text-scale-card").forEach((el) => {
    el.classList.toggle(
      "is-selected",
      textScaleEquals(el.dataset.textScale, s.textScale),
    );
  });
}

export function initSettingsApp() {
  const overlay = document.getElementById("settingsOverlay");
  if (!overlay) return;

  syncSettingsUi(overlay);

  overlay.querySelectorAll(".settings-nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.settingsPanel;
      if (!id || btn.classList.contains("ui-chrome--inactive")) return;
      overlay.querySelectorAll(".settings-nav-item").forEach((b) => {
        if (b.dataset.settingsPanel) {
          b.classList.toggle("is-active", b === btn);
        }
      });
      overlay.querySelectorAll(".settings-panel").forEach((panel) => {
        panel.classList.toggle(
          "is-active",
          panel.dataset.settingsPanel === id,
        );
      });
    });
  });

  overlay.querySelectorAll(".settings-theme-card").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.themeMode;
      if (!mode) return;
      saveAppearance({ themeMode: mode });
      syncSettingsUi(overlay);
    });
  });

  overlay.querySelectorAll(".settings-wallpaper-swatch").forEach((btn) => {
    btn.addEventListener("click", () => {
      const wp = btn.dataset.wallpaper;
      if (!wp) return;
      saveAppearance({ wallpaper: wp });
      syncSettingsUi(overlay);
    });
  });

  overlay.querySelectorAll(".settings-font-card").forEach((btn) => {
    btn.addEventListener("click", () => {
      const f = btn.dataset.uiFont;
      if (!f) return;
      saveAppearance({ uiFont: f });
      syncSettingsUi(overlay);
    });
  });

  overlay.querySelectorAll(".settings-text-scale-card").forEach((btn) => {
    btn.addEventListener("click", () => {
      const scale = normalizeTextScale(btn.dataset.textScale);
      saveAppearance({ textScale: scale });
      syncSettingsUi(overlay);
    });
  });

}

export function syncSettingsOverlay() {
  const overlay = document.getElementById("settingsOverlay");
  if (overlay) syncSettingsUi(overlay);
}

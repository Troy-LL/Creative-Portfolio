import { getAppearance, saveAppearance } from "./appearance-state.js";

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
}

export function initSettingsApp() {
  const overlay = document.getElementById("settingsOverlay");
  if (!overlay) return;

  const windowEl = overlay.querySelector(".settings-window");
  const closeDot = overlay.querySelector(".mac-close");
  const minDot = overlay.querySelector(".mac-min");

  syncSettingsUi(overlay);

  overlay.querySelectorAll(".settings-nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.settingsPanel;
      overlay.querySelectorAll(".settings-nav-item").forEach((b) => {
        b.classList.toggle("is-active", b === btn);
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

  function close() {
    gsap.to(windowEl, {
      opacity: 0,
      scale: 0.9,
      y: 18,
      duration: 0.25,
      ease: "power2.in",
      onComplete: () => {
        overlay.classList.remove("is-visible");
        windowEl.classList.remove("is-maximized");
        document
          .querySelector('.dock-icon[data-app="settings"]')
          ?.classList.remove("is-open");
      },
    });
  }

  closeDot?.addEventListener("click", (e) => {
    e.stopPropagation();
    close();
  });

  minDot?.addEventListener("click", (e) => {
    e.stopPropagation();
    close();
  });
}

export function syncSettingsOverlay() {
  const overlay = document.getElementById("settingsOverlay");
  if (overlay) syncSettingsUi(overlay);
}

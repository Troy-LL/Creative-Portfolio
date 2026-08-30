import { getAppearance, saveAppearance } from "./appearance-state.js";

export function initControlCenter() {
  const ccToggle = document.getElementById("ccToggle");
  const ccMenu = document.getElementById("ccMenu");

  if (!ccToggle || !ccMenu) return;

  ccToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    ccMenu.classList.toggle("is-open");
  });

  document.addEventListener("click", (e) => {
    if (
      !ccMenu.contains(e.target) &&
      e.target !== ccToggle &&
      !ccToggle.contains(e.target)
    ) {
      ccMenu.classList.remove("is-open");
    }
  });

  const btnDarkMode = document.getElementById("btnDarkMode");
  if (btnDarkMode) {
    btnDarkMode.addEventListener("click", () => {
      const nextDark = !document.body.classList.contains("dark-theme");
      saveAppearance({ themeMode: nextDark ? "dark" : "light" });
    });
  }

  const btnAnim = document.getElementById("btnAnimations");
  btnAnim?.addEventListener("click", () => {
    const a = getAppearance();
    saveAppearance({ animations: !a.animations });
  });

  const colorDots = document.querySelectorAll(".cc-color-dot");
  colorDots.forEach((dot) => {
    dot.addEventListener("click", () => {
      const newColor = dot.dataset.color;
      if (newColor) saveAppearance({ accent: newColor });
    });
  });
}

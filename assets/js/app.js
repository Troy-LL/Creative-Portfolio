import { initLenisSmoothScroll } from "./bootstrap/app-shell.js";
import { initBootSplash } from "./bootstrap/boot-splash.js";
import { lenis } from "./core/state.js";
import { applyStoredAppearance } from "./desktop/appearance-state.js";
import { initDesktopUi } from "./desktop/init.js";
import { initTerminalInput } from "./terminal/input.js";
import { initMobileUi, onMobileDesktopViewChange } from "./mobile/init.js";
import { isMobileViewport, setDataViewAttr } from "./mobile/viewport.js";

let desktopInited = false;

function ensureDesktopUi() {
  if (desktopInited || isMobileViewport()) return;
  initLenisSmoothScroll();
  if (document.querySelector(".monitor-bezel")?.classList.contains("is-minimized")) {
    lenis?.stop?.();
  } else {
    lenis?.start?.();
  }
  initDesktopUi();
  desktopInited = true;
}

window.addEventListener("DOMContentLoaded", async () => {
  applyStoredAppearance();
  setDataViewAttr();

  await initBootSplash();

  if (!isMobileViewport()) {
    ensureDesktopUi();
  } else {
    initMobileUi();
  }

  initTerminalInput();

  const onResize = () => {
    const wasMobile = document.documentElement.getAttribute("data-view") === "mobile";
    setDataViewAttr();
    const nowMobile = isMobileViewport();

    if (wasMobile !== nowMobile) {
      onMobileDesktopViewChange(nowMobile);
    }

    if (nowMobile) {
      lenis?.stop?.();
    } else {
      ensureDesktopUi();
      lenis?.start?.();
    }
  };

  window.addEventListener("resize", onResize);
  window.matchMedia("(orientation: landscape)").addEventListener("change", onResize);
});

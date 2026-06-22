import { initLenisSmoothScroll } from "./bootstrap/app-shell.js";
import { initBootSplash } from "./bootstrap/boot-splash.js";
import { lenis } from "./core/state.js";
import { applyStoredAppearance } from "./desktop/appearance-state.js";
import { initDesktopUi } from "./desktop/init.js";
import { animateDesktopChromeIn } from "./desktop/monitor-transition.js";
import { initTerminalInput } from "./terminal/input.js";
import {
  initDesktopGate,
  onDesktopGateViewChange,
} from "./mobile/desktop-gate.js";
import {
  shouldShowMobileGate,
  setDataViewAttr,
  watchGateViewport,
} from "./mobile/viewport.js";

let desktopInited = false;
let terminalInited = false;

function revealDesktopChrome() {
  const desktop = document.getElementById("desktop");
  if (desktop && !desktop.classList.contains("desktop--visible")) {
    desktop.classList.add("desktop--visible");
    animateDesktopChromeIn();
  }
}

function ensureDesktopUi() {
  if (desktopInited || shouldShowMobileGate()) return;
  initLenisSmoothScroll();
  if (document.querySelector(".monitor-bezel")?.classList.contains("is-minimized")) {
    lenis?.stop?.();
  } else {
    lenis?.start?.();
  }
  revealDesktopChrome();
  initDesktopUi();
  desktopInited = true;
}

function ensureTerminalInput() {
  if (terminalInited) return;
  initTerminalInput();
  terminalInited = true;
}

window.addEventListener("DOMContentLoaded", async () => {
  applyStoredAppearance();
  setDataViewAttr();

  await initBootSplash();

  if (shouldShowMobileGate()) {
    initDesktopGate();
  } else {
    ensureDesktopUi();
    ensureTerminalInput();
  }

  const onResize = () => {
    const wasGated =
      document.documentElement.getAttribute("data-gate") === "active";
    setDataViewAttr();
    const nowGated = shouldShowMobileGate();

    if (wasGated !== nowGated) {
      onDesktopGateViewChange(nowGated);
    }

    if (nowGated) {
      lenis?.stop?.();
    } else {
      revealDesktopChrome();
      ensureDesktopUi();
      ensureTerminalInput();
      lenis?.start?.();
    }
  };

  window.addEventListener("resize", onResize);
  watchGateViewport(() => onResize());
});

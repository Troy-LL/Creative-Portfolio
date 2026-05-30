import { initLenisSmoothScroll } from "./bootstrap/app-shell.js";
import { initBootSplash } from "./bootstrap/boot-splash.js";
import { lenis } from "./core/state.js";
import { initDesktopUi } from "./desktop/init.js";
import { initTerminalInput } from "./terminal/input.js";
import { initDeviceTier } from "./mobile/device-tier.js";

window.addEventListener("DOMContentLoaded", async () => {
  initDeviceTier();
  await initBootSplash();
  initLenisSmoothScroll();
  if (document.querySelector(".monitor-bezel")?.classList.contains("is-minimized")) {
    lenis?.stop?.();
  }
  initDesktopUi();
  initTerminalInput();
});

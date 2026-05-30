import { initLenisSmoothScroll } from "./bootstrap/app-shell.js";
import { initBootSplash } from "./bootstrap/boot-splash.js";
import { lenis } from "./core/state.js";
import { initDesktopUi } from "./desktop/init.js";
import { initTerminalInput } from "./terminal/input.js";
import { initDeviceTier } from "./mobile/device-tier.js";
import { initLockScreen } from "./mobile/lock-screen.js";
import { initHomeScreen } from "./mobile/home-screen.js";
import { initTerminalApp } from "./mobile/terminal-app.js";

window.addEventListener("DOMContentLoaded", async () => {
  initDeviceTier();
  await initBootSplash();
  initLenisSmoothScroll();
  if (document.querySelector(".monitor-bezel")?.classList.contains("is-minimized")) {
    lenis?.stop?.();
  }
  initDesktopUi();
  initLockScreen();
  initHomeScreen();
  initTerminalApp();
  initTerminalInput();
});

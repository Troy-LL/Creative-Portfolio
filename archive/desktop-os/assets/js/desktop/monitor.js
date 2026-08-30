import { resetTerminal } from "../terminal/reset.js";
import { minimizeToDesktop, restoreFromDesktop } from "./monitor-transition.js";

export function initWindowControls() {
  const closeBtn = document.querySelector(".control.close");
  const minBtn = document.querySelector(".control.minimize");
  const maxBtn = document.querySelector(".control.maximize");
  const monitor = document.querySelector(".monitor-bezel");
  const desktop = document.getElementById("desktop");

  closeBtn?.addEventListener("click", () => {
    if (!monitor || !desktop) return;
    minimizeToDesktop(monitor, desktop);
    resetTerminal();
    document
      .querySelector('.dock-icon[data-command=""]')
      ?.classList.remove("is-open");
  });

  minBtn?.addEventListener("click", () => {
    if (!monitor || !desktop) return;
    minimizeToDesktop(monitor, desktop);
  });

  maxBtn?.addEventListener("click", () => {
    if (!monitor) return;
    const isMax = monitor.classList.toggle("is-maximized");
    document.body.style.overflow = isMax ? "hidden" : "auto";
  });
}

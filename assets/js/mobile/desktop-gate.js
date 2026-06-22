import { shouldShowMobileGate } from "./viewport.js";

export const DESKTOP_GATE_MESSAGE =
  "Please switch to desktop for the best experience";

const GATE_ID = "desktopGate";

function ensureGateElement() {
  let gate = document.getElementById(GATE_ID);
  if (gate) return gate;

  gate = document.createElement("div");
  gate.id = GATE_ID;
  gate.className = "desktop-gate";
  gate.setAttribute("role", "dialog");
  gate.setAttribute("aria-modal", "true");
  gate.setAttribute("aria-labelledby", "desktopGateTitle");
  gate.innerHTML = `
    <div class="desktop-gate__panel">
      <div class="desktop-gate__mark" aria-hidden="true">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="10" width="36" height="24" rx="3" stroke="currentColor" stroke-width="2"/>
          <path d="M18 38h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M24 34v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
      <p class="desktop-gate__title" id="desktopGateTitle">${DESKTOP_GATE_MESSAGE}</p>
    </div>
  `;

  document.body.appendChild(gate);
  return gate;
}

export function showDesktopGate() {
  if (!shouldShowMobileGate()) return;

  const gate = ensureGateElement();
  gate.classList.remove("desktop-gate--preload");
  document.documentElement.setAttribute("data-gate", "active");
  document.body.classList.add("desktop-gate--active");
}

export function hideDesktopGate() {
  document.documentElement.removeAttribute("data-gate");
  document.body.classList.remove("desktop-gate--active");
  document.getElementById(GATE_ID)?.classList.add("desktop-gate--preload");
}

export function initDesktopGate() {
  if (!shouldShowMobileGate()) return;
  showDesktopGate();
}

export function onDesktopGateViewChange(isGated) {
  if (isGated) {
    showDesktopGate();
  } else {
    hideDesktopGate();
  }
}

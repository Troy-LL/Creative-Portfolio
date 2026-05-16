import { stopLockClock } from "../bootstrap/boot-splash.js";
import { initPreviewViewers } from "../desktop/viewers.js";
import { isMobileViewport, setDataViewAttr } from "./viewport.js";
import { openAppSheet, setSheetLayer, closeActiveSheet } from "./sheets.js";
import { restoreTerminalPlacement } from "./terminal-mount.js";
import { mountMobileTerminal } from "./apps/terminal.js";
import { mountMobileFinder } from "./apps/finder.js";
import { mountMobileSettings } from "./apps/settings.js";
import { mountMobileMail } from "./apps/mail.js";
import { mountMobileContacts } from "./apps/contacts.js";
import { mountMobileSafari } from "./apps/safari.js";

const APPS = {
  terminal: { title: "Terminal", mount: mountMobileTerminal },
  finder: { title: "Finder", mount: mountMobileFinder },
  settings: { title: "Settings", mount: mountMobileSettings },
  mail: { title: "Mail", mount: mountMobileMail },
  contacts: { title: "Contacts", mount: mountMobileContacts },
  safari: { title: "Safari", mount: mountMobileSafari },
};

let mobileInfrastructureReady = false;
let statusClockStarted = false;

function statusIconSvg() {
  return `
    <span class="ios-status__icons" aria-hidden="true">
      <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><path d="M1 10h2v2H1zm4-2h2v4H5zm4-3h2v7H9zm4-4h2v11h-2z"/></svg>
      <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor"><path d="M8 2c2.5 0 4.5 1.6 5.3 4H15c-.8-3.3-3.7-6-7-6S1.8 2.7 1 6h1.7C3.5 3.6 5.5 2 8 2zm0 3c1.8 0 3.3 1.2 3.8 3H15.9c-.5-2.9-3.1-5-7.9-5-4.8 0-7.4 2.1-7.9 5h4.1c.5-1.8 2-3 3.8-3z"/></svg>
      <svg width="22" height="11" viewBox="0 0 22 11" fill="currentColor"><rect x="1" y="1" width="18" height="9" rx="2" stroke="currentColor" fill="none"/><rect x="20" y="3.5" width="1.5" height="4" rx="0.5"/><rect x="3" y="3" width="12" height="5" rx="1"/></svg>
    </span>
  `;
}

function injectIosShell() {
  if (document.getElementById("iosShell")) return;

  const shell = document.createElement("div");
  shell.id = "iosShell";
  shell.className = "ios-shell";
  shell.innerHTML = `
    <div class="ios-dynamic-island" aria-hidden="true"></div>
    <div class="ios-home" id="iosHome">
      <div class="ios-home__wallpaper" aria-hidden="true"></div>
      <header class="ios-status">
        <span class="ios-status__time" id="iosStatusTime"></span>
        ${statusIconSvg()}
      </header>
      <div class="ios-pages" id="iosPages">
        <div class="ios-page">
          <div class="ios-icon-grid" id="iosIconGrid">
            <button type="button" class="ios-app-icon" data-app="terminal" aria-label="Terminal">
              <span class="ios-app-icon__img"><img src="assets/img/app-icons/terminal/256.png" alt="" /></span>
              <span class="ios-app-icon__label">Terminal</span>
            </button>
            <button type="button" class="ios-app-icon" data-app="finder" aria-label="Finder">
              <span class="ios-app-icon__img"><img src="assets/img/app-icons/finder/256.png" alt="" /></span>
              <span class="ios-app-icon__label">Finder</span>
            </button>
            <button type="button" class="ios-app-icon" data-app="safari" aria-label="Safari">
              <span class="ios-app-icon__img"><img src="assets/img/app-icons/safari/256.png" alt="" /></span>
              <span class="ios-app-icon__label">Safari</span>
            </button>
            <button type="button" class="ios-app-icon" data-app="settings" aria-label="Settings">
              <span class="ios-app-icon__img"><img src="assets/img/app-icons/system-preferences/256.png" alt="" /></span>
              <span class="ios-app-icon__label">Settings</span>
            </button>
            <button type="button" class="ios-app-icon" data-app="mail" aria-label="Mail">
              <span class="ios-app-icon__img"><img src="assets/img/app-icons/mail/512.png" alt="" /></span>
              <span class="ios-app-icon__label">Mail</span>
            </button>
            <button type="button" class="ios-app-icon" data-app="contacts" aria-label="Contacts">
              <span class="ios-app-icon__img"><img src="assets/img/app-icons/contacts/256.png" alt="" /></span>
              <span class="ios-app-icon__label">Contacts</span>
            </button>
          </div>
        </div>
      </div>
      <nav class="ios-dock" aria-label="Dock">
        <button type="button" data-app="terminal" aria-label="Terminal"><img src="assets/img/app-icons/terminal/256.png" alt="" /></button>
        <button type="button" data-app="finder" aria-label="Finder"><img src="assets/img/app-icons/finder/256.png" alt="" /></button>
        <button type="button" data-app="safari" aria-label="Safari"><img src="assets/img/app-icons/safari/256.png" alt="" /></button>
        <button type="button" data-app="mail" aria-label="Mail"><img src="assets/img/app-icons/mail/512.png" alt="" /></button>
      </nav>
    </div>
    <div class="ios-sheet-layer" id="iosSheetLayer" aria-hidden="true"></div>
    <div id="iosPreviewMount"></div>
  `;

  document.body.appendChild(shell);
  setSheetLayer(document.getElementById("iosSheetLayer"));
}

function tickStatusTime() {
  const el = document.getElementById("iosStatusTime");
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  });
}

function startStatusClock() {
  if (statusClockStarted) return;
  statusClockStarted = true;
  tickStatusTime();
  window.setInterval(tickStatusTime, 30000);
}

function wireLockScreenUnlock() {
  const splash = document.getElementById("bootSplash");
  if (!splash || splash.dataset.iosLockWired === "1") return;
  if (!splash.classList.contains("boot-splash--ios-lock")) return;

  splash.dataset.iosLockWired = "1";
  const shell = document.getElementById("iosShell");
  if (!shell) return;

  let startY = 0;
  let armed = false;

  const unlock = () => {
    if (!splash.classList.contains("boot-splash--ios-lock")) return;
    stopLockClock();
    splash.classList.add("boot-splash--dismissed");
    window.setTimeout(() => {
      splash.style.display = "none";
      splash.setAttribute("aria-hidden", "true");
    }, 480);
    shell.classList.add("ios-shell--visible");
  };

  splash.addEventListener(
    "touchstart",
    (e) => {
      if (!splash.classList.contains("boot-splash--ios-lock")) return;
      armed = true;
      startY = e.touches[0].clientY;
    },
    { passive: true },
  );

  splash.addEventListener(
    "touchmove",
    (e) => {
      if (!armed || !splash.classList.contains("boot-splash--ios-lock")) return;
      const dy = e.touches[0].clientY - startY;
      if (dy < -48) unlock();
    },
    { passive: true },
  );

  splash.addEventListener("click", () => {
    if (splash.classList.contains("boot-splash--ios-lock")) unlock();
  });
}

function wireAppLaunchers() {
  const open = (id) => {
    const cfg = APPS[id];
    if (!cfg) return;
    openAppSheet({
      title: cfg.title,
      onMount: (body) => {
        const unmount = cfg.mount(body);
        return typeof unmount === "function" ? unmount : undefined;
      },
    });
  };

  document.querySelectorAll(".ios-app-icon[data-app], .ios-dock [data-app]").forEach((el) => {
    el.addEventListener("click", () => open(el.dataset.app));
  });

  let wiggleTimer = null;
  document.getElementById("iosIconGrid")?.addEventListener(
    "touchstart",
    (e) => {
      const icon = e.target.closest(".ios-app-icon");
      if (!icon) return;
      wiggleTimer = window.setTimeout(() => {
        document.getElementById("iosHome")?.classList.toggle("ios-home--wiggle");
      }, 500);
    },
    { passive: true },
  );

  document.getElementById("iosIconGrid")?.addEventListener("touchend", () => {
    if (wiggleTimer) clearTimeout(wiggleTimer);
  });

  document.getElementById("iosIconGrid")?.addEventListener(
    "touchmove",
    () => {
      if (wiggleTimer) clearTimeout(wiggleTimer);
    },
    { passive: true },
  );
}

export function initMobileUi() {
  if (!isMobileViewport()) return;

  injectIosShell();

  if (!mobileInfrastructureReady) {
    mobileInfrastructureReady = true;
    initPreviewViewers();
    startStatusClock();
    wireAppLaunchers();
  }

  wireLockScreenUnlock();

  const splash = document.getElementById("bootSplash");
  const shell = document.getElementById("iosShell");
  if (!shell) return;

  if (!splash || !splash.classList.contains("boot-splash--ios-lock")) {
    shell.classList.add("ios-shell--visible");
  }
}

export function onMobileDesktopViewChange(isMobile) {
  setDataViewAttr();
  if (!isMobile) {
    closeActiveSheet();
    restoreTerminalPlacement();
    document.getElementById("iosShell")?.classList.remove("ios-shell--visible");
  } else {
    initMobileUi();
  }
}

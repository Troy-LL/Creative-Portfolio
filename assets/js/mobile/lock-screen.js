/**
 * iOS 16 / iPadOS lock screen — clock, widgets, swipe/tap to unlock.
 * Shown on touch tiers after boot; unlock reveals the home screen.
 */
import { isTouchTier } from "./device-tier.js";
import { animateDesktopChromeIn } from "../desktop/monitor-transition.js";
import { openTerminalApp } from "./terminal-app.js";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const SHORT_DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

let clockTimer = null;
let unlockPending = false;

function formatLockTime(now) {
  const h = now.getHours();
  const m = now.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

function formatLockDate(now) {
  return `${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}`;
}

function tickLockClock() {
  const now = new Date();
  const time = formatLockTime(now);

  document.getElementById("lockClock")?.replaceChildren(document.createTextNode(time));
  document.getElementById("lockStatusTime")?.replaceChildren(document.createTextNode(time));
  document.getElementById("lockDate")?.replaceChildren(
    document.createTextNode(formatLockDate(now)),
  );

  const dayEl = document.getElementById("lockWidgetDay");
  const dateEl = document.getElementById("lockWidgetDate");
  if (dayEl) dayEl.textContent = SHORT_DAYS[now.getDay()];
  if (dateEl) dateEl.textContent = String(now.getDate());
}

function startLockClock() {
  tickLockClock();
  if (clockTimer) clearInterval(clockTimer);
  clockTimer = setInterval(tickLockClock, 1000);
}

function stopLockClock() {
  if (clockTimer) {
    clearInterval(clockTimer);
    clockTimer = null;
  }
}

function hideDesktopChromeForLock() {
  const targets = [
    "#desktop",
    ".desktop-menubar",
    ".desktop-icons-area .desktop-file-icon",
    ".desktop-dock",
    "#homeScreenChrome",
  ];
  if (typeof gsap !== "undefined") {
    gsap.set(targets, { opacity: 0, clearProps: "transform" });
  }
}

export function showLockScreenAfterBoot() {
  if (!isTouchTier()) return;

  const lock = document.getElementById("lockScreen");
  if (!lock) return;

  hideDesktopChromeForLock();
  lock.hidden = false;
  lock.removeAttribute("aria-hidden");
  document.body.classList.add("lock-screen--active");
  startLockClock();
}

export function unlockHomeScreen(options = {}) {
  if (unlockPending) return;
  if (!isTouchTier()) return;

  const lock = document.getElementById("lockScreen");
  const desktop = document.getElementById("desktop");
  if (!lock || lock.hidden) return;

  unlockPending = true;
  lock.classList.add("is-unlocking");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const openTerminal = options.openTerminal === true;

  const finish = () => {
    lock.hidden = true;
    lock.setAttribute("aria-hidden", "true");
    lock.classList.remove("is-unlocking");
    document.body.classList.remove("lock-screen--active");
    stopLockClock();
    unlockPending = false;

    const homeChrome = document.getElementById("homeScreenChrome");
    if (homeChrome) {
      homeChrome.hidden = false;
      homeChrome.removeAttribute("aria-hidden");
    }

    desktop?.classList.add("desktop--visible");
    animateDesktopChromeIn();

    if (openTerminal) {
      requestAnimationFrame(() => openTerminalApp("SELECT * FROM about"));
    }
  };

  if (reduceMotion || typeof gsap === "undefined") {
    finish();
    return;
  }

  gsap.to(lock, {
    y: "-100%",
    opacity: 0,
    duration: 0.45,
    ease: "power3.inOut",
    onComplete: finish,
  });
}

function bindUnlockGestures() {
  const lock = document.getElementById("lockScreen");
  const unlockBtn = document.getElementById("lockUnlockBtn");
  if (!lock || !unlockBtn) return;

  unlockBtn.addEventListener("click", () => unlockHomeScreen());

  let touchStartY = 0;
  lock.addEventListener(
    "touchstart",
    (e) => {
      touchStartY = e.touches[0]?.clientY ?? 0;
    },
    { passive: true },
  );

  lock.addEventListener(
    "touchend",
    (e) => {
      const endY = e.changedTouches[0]?.clientY ?? 0;
      const delta = touchStartY - endY;
      if (delta > 60) unlockHomeScreen();
    },
    { passive: true },
  );

  document.getElementById("lockNotificationTerminal")?.addEventListener("click", () => {
    unlockHomeScreen({ openTerminal: true });
  });
}

export function initLockScreen() {
  bindUnlockGestures();
}

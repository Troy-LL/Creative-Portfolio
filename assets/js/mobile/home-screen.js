/**
 * iOS / iPadOS home screen widgets — live clock + date on widget cards.
 */
import { isTouchTier, onTierChange } from "./device-tier.js";

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

let timer = null;

function formatTime(now) {
  const h = now.getHours();
  const m = now.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

function formatDate(now) {
  return `${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}`;
}

function tickHomeWidgets() {
  const now = new Date();
  const time = formatTime(now);
  const date = formatDate(now);

  const timeEl = document.getElementById("homeWidgetTime");
  const dateEl = document.getElementById("homeWidgetDate");
  if (timeEl) timeEl.textContent = time;
  if (dateEl) dateEl.textContent = date;
}

function syncHomeChromeVisibility() {
  const chrome = document.getElementById("homeScreenChrome");
  if (!chrome) return;

  const lockActive = document.body.classList.contains("lock-screen--active");
  const show = isTouchTier() && !lockActive;

  chrome.hidden = !show;
  chrome.setAttribute("aria-hidden", show ? "false" : "true");
}

function startHomeClock() {
  tickHomeWidgets();
  if (timer) clearInterval(timer);
  timer = setInterval(tickHomeWidgets, 1000);
}

export function initHomeScreen() {
  if (!isTouchTier()) return;

  syncHomeChromeVisibility();
  startHomeClock();

  onTierChange(() => {
    syncHomeChromeVisibility();
    if (isTouchTier()) startHomeClock();
    else if (timer) {
      clearInterval(timer);
      timer = null;
    }
  });

  /* Reveal widgets after unlock (lock-screen removes lock-screen--active). */
  const observer = new MutationObserver(() => syncHomeChromeVisibility());
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ["class"],
  });
}

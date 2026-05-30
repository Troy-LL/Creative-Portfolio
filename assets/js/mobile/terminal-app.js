/**
 * Native SQL Terminal app for iOS / iPadOS touch tiers.
 * Reuses handleCommand with a dedicated output surface (no CRT bezel).
 */
import { isTouchTier } from "./device-tier.js";
import {
  handleCommand,
  setCommandTarget,
  resetCommandTarget,
} from "../terminal/commands.js";

const DEFAULT_BANNER = `<div class="terminal-app-banner">SQL_TERM v2.0 — Portfolio Database</div>
<p class="terminal-app-line terminal-app-line--dim">Tap a query above or type below. Try <strong>SELECT * FROM about</strong>.</p>`;

let dockIcon = null;

function getOverlay() {
  return document.getElementById("terminalAppOverlay");
}

function getOutput() {
  return document.getElementById("terminalAppOutput");
}

function scrollAppOutput() {
  const body = document.querySelector(".terminal-app-body");
  if (!body) return;
  requestAnimationFrame(() => {
    body.scrollTo({ top: body.scrollHeight, behavior: "smooth" });
  });
}

function resetAppOutput() {
  const out = getOutput();
  if (out) out.innerHTML = DEFAULT_BANNER;
}

function runQuery(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return;

  setCommandTarget(getOutput(), "native");
  handleCommand(trimmed);
  resetCommandTarget();
  scrollAppOutput();
}

export function openTerminalApp(initialQuery = null) {
  if (!isTouchTier()) return false;

  const overlay = getOverlay();
  if (!overlay) return false;

  overlay.hidden = false;
  overlay.removeAttribute("aria-hidden");
  overlay.classList.add("is-visible");
  dockIcon?.classList.add("is-open");

  const win = overlay.querySelector(".terminal-app-window");
  if (typeof gsap !== "undefined" && win) {
    const isTablet = document.body.dataset.device === "tablet";
    gsap.fromTo(
      win,
      { opacity: 0, y: isTablet ? 24 : 40 },
      { opacity: 1, y: 0, duration: 0.38, ease: "power3.out" },
    );
  }

  if (initialQuery) {
    runQuery(initialQuery);
  }

  document.getElementById("terminalAppCmd")?.focus();
  return true;
}

export function closeTerminalApp() {
  const overlay = getOverlay();
  if (!overlay || overlay.hidden) return;

  const win = overlay.querySelector(".terminal-app-window");
  const finish = () => {
    overlay.hidden = true;
    overlay.setAttribute("aria-hidden", "true");
    overlay.classList.remove("is-visible");
    dockIcon?.classList.remove("is-open");
  };

  if (typeof gsap !== "undefined" && win) {
    gsap.to(win, {
      opacity: 0,
      y: 30,
      duration: 0.28,
      ease: "power2.in",
      onComplete: finish,
    });
  } else {
    finish();
  }
}

export function initTerminalApp() {
  dockIcon = document.querySelector('.dock-icon[data-command=""]');
  const overlay = getOverlay();
  if (!overlay) return;

  overlay.querySelector(".terminal-app-done")?.addEventListener("click", closeTerminalApp);

  overlay.querySelectorAll(".terminal-app-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const q = chip.dataset.query;
      if (q) runQuery(q);
    });
  });

  const input = document.getElementById("terminalAppCmd");
  input?.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const val = input.value;
    input.value = "";
    runQuery(val);
  });
}

/** Route dock / desktop terminal launches on touch tiers to this app. */
export function openTerminalForTier(command = null) {
  if (isTouchTier()) {
    openTerminalApp(command || null);
    return true;
  }
  return false;
}

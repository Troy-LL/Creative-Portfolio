/** Overlay id → dock app name. Preview overlays have no dock entry. */
const OVERLAY_DOCK = {
  settingsOverlay: "settings",
  contactsOverlay: "contacts",
  mailOverlay: "mail",
  spotifyOverlay: "spotify",
  safariOverlay: "safari",
  finderOverlay: "finder",
};

/** Optional cleanup when an overlay finishes its close animation. */
const closeHooks = new Map();

export function registerWindowCloseHook(overlayId, fn) {
  if (overlayId && typeof fn === "function") closeHooks.set(overlayId, fn);
}

function setDockOpen(app, isOpen) {
  if (!app) return;
  document.querySelectorAll(`.dock-icon[data-app="${app}"]`).forEach((el) => {
    el.classList.toggle("is-open", isOpen);
  });
}

function resolveContext(macWindowEl) {
  if (!(macWindowEl instanceof Element)) return null;

  const overlay =
    macWindowEl.closest(".window-overlay") ||
    macWindowEl.closest(".preview-overlay");
  if (!overlay) return null;

  const overlayId = overlay.id || null;
  const dockApp = overlayId ? OVERLAY_DOCK[overlayId] ?? null : null;
  const isPreview =
    overlay.classList.contains("preview-overlay") ||
    overlay.classList.contains("image-overlay");

  return { overlay, overlayId, windowEl: macWindowEl, dockApp, isPreview };
}

function runCloseHook(ctx) {
  if (!ctx.overlayId) return;
  closeHooks.get(ctx.overlayId)?.();
}

function finishClose(ctx, removeDockIndicator) {
  const { overlay, windowEl, dockApp, isPreview } = ctx;

  if (isPreview) {
    overlay.remove();
    if (document.querySelectorAll(".mac-window").length === 0) {
      document.body.classList.remove("is-dragging");
    }
    return;
  }

  overlay.classList.remove("is-visible");
  windowEl.classList.remove("is-maximized");
  windowEl.classList.remove("has-explicit-layout");
  if (typeof gsap !== "undefined") {
    gsap.set(windowEl, { clearProps: "opacity,transform,x,y,scale" });
  }
  runCloseHook(ctx);

  if (removeDockIndicator) setDockOpen(dockApp, false);
}

export function closeMacWindow(windowEl, { removeDockIndicator = true } = {}) {
  const ctx = resolveContext(windowEl);
  if (!ctx || ctx.windowEl.dataset.windowClosing === "true") return;

  ctx.windowEl.dataset.windowClosing = "true";

  gsap.to(ctx.windowEl, {
    opacity: 0,
    scale: 0.9,
    y: 18,
    duration: 0.25,
    ease: "power2.in",
    onComplete: () => {
      delete ctx.windowEl.dataset.windowClosing;
      finishClose(ctx, removeDockIndicator);
    },
  });
}

function handleChromeClick(e, removeDockIndicator) {
  const target = e.target;
  if (!(target instanceof Element)) return;

  const maxBtn = target.closest(".mac-window .mac-max");
  if (maxBtn?.classList.contains("disabled")) return;

  const closeBtn = target.closest(".mac-window .mac-close:not(.disabled)");
  const minBtn = target.closest(".mac-window .mac-min:not(.disabled)");
  const btn = closeBtn || minBtn;
  if (!btn) return;

  e.stopPropagation();
  e.preventDefault();

  const windowEl = btn.closest(".mac-window");
  if (!windowEl) return;

  closeMacWindow(windowEl, {
    removeDockIndicator: closeBtn ? true : removeDockIndicator,
  });
}

export function initWindowChrome() {
  const desktop = document.getElementById("desktop");
  if (!desktop) return;

  desktop.addEventListener("click", (e) => {
    handleChromeClick(e, false);
  });
}

/**

 * macOS-style window resize for Portfolio OS desktop windows.

 *

 * @typedef {Object} WindowResizeState

 * @property {number} width

 * @property {number} height

 * @property {number} minWidth

 * @property {number} minHeight

 */



const STORAGE_PREFIX = "mac-window-size:";

const RESIZE_HANDLES = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];



/** @type {Array<{ selector: string; key: string; minWidth: number; minHeight: number }>} */

const WINDOW_CONFIGS = [

  { selector: ".finder-window", key: "finder-window", minWidth: 400, minHeight: 300 },

  { selector: ".settings-window", key: "settings-window", minWidth: 400, minHeight: 300 },

  { selector: ".contacts-window", key: "contacts-window", minWidth: 400, minHeight: 300 },

  { selector: ".mail-window", key: "mail-window", minWidth: 400, minHeight: 300 },

  { selector: ".safari-window", key: "safari-window", minWidth: 400, minHeight: 300 },

  { selector: ".spotify-window", key: "spotify-window", minWidth: 400, minHeight: 300 },

];



/** @type {{ win: HTMLElement; axis: string; pointerId: number; box: { left: number; top: number; width: number; height: number }; clientX: number; clientY: number; minWidth: number; minHeight: number; storageKey: string } | null} */

let activeResize = null;



function getConfigForWindow(win) {

  return WINDOW_CONFIGS.find((config) => win.matches(config.selector)) ?? null;

}



function syncWorkareaInsets() {
  const workarea = document.getElementById("desktop-workarea");
  const desktop = document.getElementById("desktop");
  if (!workarea || !desktop) return;

  const dr = desktop.getBoundingClientRect();
  const menu = document.querySelector(".desktop-menubar");
  const dock = document.querySelector(".desktop-dock");

  const topInset = menu
    ? Math.max(0, menu.getBoundingClientRect().bottom - dr.top)
    : 28;

  let bottomInset = 0;
  let leftInset = 0;
  let rightInset = 0;

  if (dock) {
    const d = dock.getBoundingClientRect();
    const pad = 8;
    const centerY = (d.top + d.bottom) / 2;
    const centerX = (d.left + d.right) / 2;
    const midY = dr.top + dr.height / 2;
    const midX = dr.left + dr.width / 2;

    if (d.width >= d.height && centerY >= midY) {
      bottomInset = Math.max(0, dr.bottom - d.top + pad);
    } else if (d.height > d.width && centerX <= midX) {
      leftInset = Math.max(0, d.right - dr.left + pad);
    } else if (d.height > d.width && centerX > midX) {
      rightInset = Math.max(0, dr.right - d.left + pad);
    } else {
      bottomInset = Math.max(0, dr.bottom - d.top + pad);
    }
  }

  workarea.style.top = topInset + "px";
  workarea.style.bottom = bottomInset + "px";
  workarea.style.left = leftInset + "px";
  workarea.style.right = rightInset + "px";
}

function getWorkareaBounds() {
  syncWorkareaInsets();
  const workarea = document.getElementById("desktop-workarea");
  if (!workarea) return null;
  return workarea.getBoundingClientRect();
}




function getParentOffset(win) {

  const parent = win.offsetParent || win.parentElement;

  if (!parent) return { parent, left: 0, top: 0 };

  const pr = parent.getBoundingClientRect();

  return { parent, left: pr.left, top: pr.top };

}



function isWindowMeasurable(win) {

  const rect = win.getBoundingClientRect();

  return rect.width > 0 && rect.height > 0;

}



function syncDraggable(win) {

  if (typeof Draggable === "undefined") return;

  const instance = Draggable.get(win);

  if (!instance) return;

  if (typeof gsap !== "undefined") {

    gsap.set(win, { x: 0, y: 0 });

  }

  instance.update();

}



/** Merge CSS margins / GSAP transforms into explicit top/left/width/height. */

export function ensureExplicitLayout(win) {

  if (!(win instanceof HTMLElement)) return false;

  if (!isWindowMeasurable(win)) return false;



  // Draggable.init can bake left:50% → 50px while the overlay is display:none,
  // which breaks margin-based centering (safari/spotify). Drop those inlines once
  // so stylesheet left/top/margin can resolve before we measure.
  if (!win.classList.contains("has-explicit-layout")) {

    win.style.removeProperty("left");

    win.style.removeProperty("top");

  }



  if (typeof gsap !== "undefined") {

    gsap.killTweensOf(win, "x,y,scale,transform");

    gsap.set(win, { x: 0, y: 0, scale: 1, opacity: 1 });

  }



  win.style.opacity = "1";

  win.style.transform = "none";



  const { left: parentLeft, top: parentTop } = getParentOffset(win);

  const rect = win.getBoundingClientRect();

  const width = win.offsetWidth || rect.width;

  const height = win.offsetHeight || rect.height;

  const top = rect.top - parentTop;

  const left = rect.left - parentLeft;



  win.style.margin = "0";

  win.style.marginTop = "0";

  win.style.marginLeft = "0";

  win.style.top = `${top}px`;

  win.style.left = `${left}px`;

  win.style.width = `${width}px`;

  win.style.height = `${height}px`;

  win.classList.add("has-explicit-layout");



  if (typeof gsap !== "undefined") {

    gsap.set(win, { x: 0, y: 0, scale: 1, clearProps: "transform" });

  }



  syncDraggable(win);

  return true;

}



function readExplicitBox(win, minWidth, minHeight) {

  return {

    left: parseFloat(win.style.left) || 0,

    top: parseFloat(win.style.top) || 0,

    width: parseFloat(win.style.width) || minWidth,

    height: parseFloat(win.style.height) || minHeight,

  };

}



/** @returns {WindowResizeState | null} */

function loadStoredSize(key) {

  try {

    const raw = sessionStorage.getItem(STORAGE_PREFIX + key);

    if (!raw) return null;

    const parsed = JSON.parse(raw);

    if (

      typeof parsed.width === "number" &&

      typeof parsed.height === "number"

    ) {

      return parsed;

    }

  } catch {

    /* ignore corrupt session data */

  }

  return null;

}



/** @param {string} key @param {WindowResizeState} state */

function saveStoredSize(key, state) {

  try {

    sessionStorage.setItem(

      STORAGE_PREFIX + key,

      JSON.stringify({

        width: state.width,

        height: state.height,

        minWidth: state.minWidth,

        minHeight: state.minHeight,

      }),

    );

  } catch {

    /* sessionStorage may be unavailable */

  }

}



function clampWindowToWorkarea(win, minWidth, minHeight) {
  const wa = getWorkareaBounds();
  if (!wa) return;

  const { left: parentLeft, top: parentTop } = getParentOffset(win);
  const minLeft = wa.left - parentLeft;
  const minTop = wa.top - parentTop;
  const maxRight = wa.right - parentLeft;
  const maxBottom = wa.bottom - parentTop;

  let left = parseFloat(win.style.left) || 0;
  let top = parseFloat(win.style.top) || 0;
  let width = parseFloat(win.style.width) || minWidth;
  let height = parseFloat(win.style.height) || minHeight;

  const maxWidth = Math.max(0, maxRight - minLeft);
  const maxHeight = Math.max(0, maxBottom - minTop);
  const effMinW = Math.min(minWidth, maxWidth);
  const effMinH = Math.min(minHeight, maxHeight);

  width = Math.max(effMinW, Math.min(width, maxWidth));
  height = Math.max(effMinH, Math.min(height, maxHeight));

  if (left < minLeft) left = minLeft;
  if (top < minTop) top = minTop;
  if (left + width > maxRight) left = Math.max(minLeft, maxRight - width);
  if (top + height > maxBottom) top = Math.max(minTop, maxBottom - height);

  win.style.left = left + "px";
  win.style.top = top + "px";
  win.style.width = width + "px";
  win.style.height = height + "px";
}




function applyWindowLayout(win, config) {

  if (!ensureExplicitLayout(win)) return;



  const stored = loadStoredSize(config.key);

  if (stored) {

    win.style.width = `${Math.max(stored.width, config.minWidth)}px`;

    win.style.height = `${Math.max(stored.height, config.minHeight)}px`;

  }



  // Always clamp — default open must stay inside #desktop-workarea even when
  // there is no stored size (safari/spotify centering edge cases).
  clampWindowToWorkarea(win, config.minWidth, config.minHeight);

  syncDraggable(win);

}



function resolveWindow(winOrSelector) {

  return typeof winOrSelector === "string"

    ? document.querySelector(winOrSelector)

    : winOrSelector;

}



/** Open animation — windows stay fully opaque; only scale/y move. */

export function animateWindowOpen(winOrSelector, options = {}) {

  const win = resolveWindow(winOrSelector);

  if (!(win instanceof HTMLElement)) return;



  const {

    duration = 0.35,

    ease = "power2.out",

    fromScale = 0.92,

    fromY = 16,

    onComplete,

  } = options;



  const finish = () => {

    refreshWindowLayout(win);

    onComplete?.();

  };



  if (typeof gsap === "undefined") {

    win.style.opacity = "1";

    finish();

    return;

  }



  gsap.killTweensOf(win, "scale,y,x");

  gsap.set(win, { opacity: 1, scale: fromScale, y: fromY, x: 0 });

  gsap.to(win, {

    scale: 1,

    y: 0,

    duration,

    ease,

    onComplete: finish,

  });

}



/** Call after a window open animation completes so resize handles use explicit geometry. */

export function refreshWindowLayout(winOrSelector) {

  const win =

    typeof winOrSelector === "string"

      ? document.querySelector(winOrSelector)

      : winOrSelector;

  if (!(win instanceof HTMLElement)) return;

  const config = getConfigForWindow(win);

  if (!config) return;

  applyWindowLayout(win, config);

}



function applyResize(win, axis, startBox, dx, dy, minWidth, minHeight) {

  let { left, top, width, height } = startBox;



  if (axis.includes("e")) width = startBox.width + dx;

  if (axis.includes("w")) {

    width = startBox.width - dx;

    left = startBox.left + dx;

  }

  if (axis.includes("s")) height = startBox.height + dy;

  if (axis.includes("n")) {

    height = startBox.height - dy;

    top = startBox.top + dy;

  }



  if (width < minWidth) {

    if (axis.includes("w")) left = startBox.left + startBox.width - minWidth;

    width = minWidth;

  }

  if (height < minHeight) {

    if (axis.includes("n")) top = startBox.top + startBox.height - minHeight;

    height = minHeight;

  }



  win.style.width = `${width}px`;

  win.style.height = `${height}px`;

  win.style.left = `${left}px`;

  win.style.top = `${top}px`;



  clampWindowToWorkarea(win, minWidth, minHeight);

}



function onResizePointerMove(e) {

  if (!activeResize || e.pointerId !== activeResize.pointerId) return;

  e.preventDefault();

  const dx = e.clientX - activeResize.clientX;

  const dy = e.clientY - activeResize.clientY;

  applyResize(

    activeResize.win,

    activeResize.axis,

    activeResize.box,

    dx,

    dy,

    activeResize.minWidth,

    activeResize.minHeight,

  );

}



function endResize(e) {

  if (!activeResize || (e && e.pointerId !== activeResize.pointerId)) return;



  const { win, minWidth, minHeight, storageKey } = activeResize;

  activeResize = null;



  document.body.classList.remove("is-resizing-window");

  delete document.body.dataset.resizeAxis;

  document.removeEventListener("pointermove", onResizePointerMove);

  document.removeEventListener("pointerup", endResize);

  document.removeEventListener("pointercancel", endResize);



  if (storageKey) {

    saveStoredSize(storageKey, {

      width: parseFloat(win.style.width) || minWidth,

      height: parseFloat(win.style.height) || minHeight,

      minWidth,

      minHeight,

    });

  }



  syncDraggable(win);

  window.dispatchEvent(new Event("resize"));

}



function startResize(e, win, axis, minWidth, minHeight, storageKey) {

  if (win.classList.contains("is-maximized")) return;

  if (e.button !== 0) return;



  e.preventDefault();

  e.stopPropagation();



  ensureExplicitLayout(win);

  if (typeof window.focusWindow === "function") window.focusWindow(win);



  activeResize = {

    win,

    axis,

    pointerId: e.pointerId,

    box: readExplicitBox(win, minWidth, minHeight),

    clientX: e.clientX,

    clientY: e.clientY,

    minWidth,

    minHeight,

    storageKey,

  };



  document.body.classList.add("is-resizing-window");

  document.body.dataset.resizeAxis = axis;

  document.addEventListener("pointermove", onResizePointerMove);

  document.addEventListener("pointerup", endResize);

  document.addEventListener("pointercancel", endResize);



  if (e.target instanceof Element && e.target.setPointerCapture) {

    e.target.setPointerCapture(e.pointerId);

  }

}



function injectResizeHandles(win) {

  if (win.querySelector(".mac-window-resize-handles")) return;



  const container = document.createElement("div");

  container.className = "mac-window-resize-handles";

  container.setAttribute("aria-hidden", "true");



  RESIZE_HANDLES.forEach((axis) => {

    const handle = document.createElement("div");

    handle.className = `mac-window-resize-handle mac-window-resize-handle--${axis}`;

    handle.dataset.resize = axis;

    container.appendChild(handle);

  });



  win.appendChild(container);

}



function setupWindowResize(win, config) {

  injectResizeHandles(win);

  applyWindowLayout(win, config);



  win.querySelectorAll(".mac-window-resize-handle").forEach((handle) => {

    handle.addEventListener("pointerdown", (e) => {

      const axis = handle.dataset.resize;

      if (!axis) return;

      startResize(e, win, axis, config.minWidth, config.minHeight, config.key);

    });

  });

}



function patchFocusWindowForLayout() {

  if (window._resizeFocusPatched) return;

  window._resizeFocusPatched = true;



  const previousFocusWindow = window.focusWindow;

  window.focusWindow = function focusWindowWithLayout(targetEl) {

    previousFocusWindow?.(targetEl);



    let el = null;

    if (targetEl) {

      el =

        typeof targetEl === "string"

          ? document.querySelector(targetEl)

          : targetEl;

    }

    if (!(el instanceof HTMLElement) || !el.classList.contains("mac-window")) {

      return;

    }



    requestAnimationFrame(() => {

      if (typeof gsap !== "undefined" && gsap.isTweening(el)) return;

      refreshWindowLayout(el);

    });

  };

}



export function initResizableWindows() {
  if (window.matchMedia("(max-width: 768px)").matches) return;

  syncWorkareaInsets();

  WINDOW_CONFIGS.forEach((config) => {
    document.querySelectorAll(config.selector).forEach((win) => {
      if (!(win instanceof HTMLElement)) return;
      setupWindowResize(win, config);
    });
  });

  patchFocusWindowForLayout();

  const refitVisible = () => {
    syncWorkareaInsets();
    WINDOW_CONFIGS.forEach((config) => {
      document.querySelectorAll(config.selector).forEach((win) => {
        if (!(win instanceof HTMLElement)) return;
        const overlay = win.closest(".window-overlay");
        if (overlay && !overlay.classList.contains("is-visible")) return;
        if (!win.classList.contains("has-explicit-layout")) return;
        clampWindowToWorkarea(win, config.minWidth, config.minHeight);
        syncDraggable(win);
      });
    });
  };

  window.addEventListener("resize", refitVisible, { passive: true });
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", refitVisible, {
      passive: true,
    });
    window.visualViewport.addEventListener("scroll", refitVisible, {
      passive: true,
    });
  }
}




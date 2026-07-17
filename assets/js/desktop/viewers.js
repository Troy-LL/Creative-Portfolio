import { getPreviewMountEl } from "../core/preview-mount.js";
import { registerManagedWindow } from "./window-resize.js";

export function initPreviewViewers() {
  window.openPdfViewer = openPdfViewer;
  window.openImageViewer = openImageViewer;
}

function openPdfViewer(pdfSrc, title, width = "800px", height = "600px") {
  const mount = getPreviewMountEl();
  if (!mount) return;

  const isMobile = document.documentElement.getAttribute("data-view") === "mobile";

  const existingOverlay = document.querySelector(".preview-overlay");
  if (existingOverlay) {
    const win = existingOverlay.querySelector(".preview-window");
    const titleEl = existingOverlay.querySelector(".preview-title");
    const iframe = existingOverlay.querySelector("iframe");

    if (titleEl) titleEl.textContent = title || "Preview";
    if (iframe) iframe.src = pdfSrc;

    if (win && !isMobile) {
      win.style.width = width;
      win.style.height = height;
    }

    window.focusWindow(win);

    gsap.fromTo(
      win,
      { scale: 0.98 },
      {
        scale: 1,
        duration: 0.3,
        ease: "back.out(2)",
        onComplete: () => {
          if (!isMobile) registerManagedWindow(win);
        },
      },
    );
    return;
  }

  const instanceId = "preview-" + Date.now();
  const overlay = document.createElement("div");
  overlay.className = "preview-overlay window-overlay is-visible";
  overlay.id = instanceId;
  overlay.style.zIndex = "30";

  overlay.innerHTML = `
    <div class="preview-window mac-window" style="width: ${width}; height: ${height}; transform: scale(0.9) translateY(20px); position: absolute; top: 100px; left: 150px; margin: 0;">
      <div class="preview-titlebar">
        <div class="preview-dots mac-controls">
          <span class="preview-dot mac-close preview-close"></span>
          <span class="preview-dot mac-min"></span>
          <span class="preview-dot mac-max disabled"></span>
        </div>
        <div class="preview-title">${title || "Preview"}</div>
      </div>
      <div class="preview-body" data-lenis-prevent>
        <div class="preview-iframe-shim"></div>
        <iframe src="${pdfSrc}" style="width: 100%; height: 100%; border: none"></iframe>
      </div>
    </div>
  `;

  mount.appendChild(overlay);

  const win = overlay.querySelector(".preview-window");

  const animConfig = isMobile
    ? { duration: 0.35 }
    : { scale: 1, y: 0, duration: 0.35, ease: "back.out(1.4)" };

  gsap.set(win, { opacity: 1 });
  gsap.to(win, {
    ...animConfig,
    onComplete: () => {
      if (!isMobile) registerManagedWindow(win);
    },
  });

  window.focusWindow(win);

  const shim = win.querySelector(".preview-iframe-shim");
  shim?.addEventListener("mousedown", () => {
    window.focusWindow(win);
  });

  if (typeof Draggable !== "undefined" && !isMobile) {
    Draggable.create(win, {
      type: "top,left",
      handle: ".preview-titlebar",
      bounds: "#desktop-workarea",
      onPress: function () {
        window.focusWindow(this.target);
      },
      onDragStart: function () {
        document.body.classList.add("is-dragging");
      },
      onDragEnd: function () {
        document.body.classList.remove("is-dragging");
      },
    });
  }
}

function openImageViewer(imgSrc, title) {
  const mount = getPreviewMountEl();
  if (!mount) return;

  const overlay = document.createElement("div");
  overlay.className = "window-overlay image-overlay is-visible";
  overlay.innerHTML = `
    <div class="mac-window preview-window" style="width: min(90vw, 600px); height: auto; transform: translateY(20px) scale(0.95);">
      <div class="preview-titlebar">
        <div class="preview-dots mac-controls">
          <span class="preview-dot mac-close"></span>
          <span class="preview-dot mac-min"></span>
          <span class="preview-dot mac-max disabled"></span>
        </div>
        <div class="preview-title">${title || "Image Preview"}</div>
      </div>
      <div class="preview-body" style="padding: 0; background: #000; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 0 0 12px 12px;">
        <img src="${imgSrc}" style="width: 100%; height: auto; display: block;">
      </div>
    </div>
  `;

  mount.appendChild(overlay);

  const win = overlay.querySelector(".preview-window");
  const isMobile = document.documentElement.getAttribute("data-view") === "mobile";

  gsap.set(win, { opacity: 1 });
  gsap.to(win, {
    scale: 1,
    y: 0,
    duration: 0.35,
    ease: "back.out(1.4)",
    onComplete: () => {
      if (!isMobile) registerManagedWindow(win);
    },
  });

  window.focusWindow(win);

  if (typeof Draggable !== "undefined" && !isMobile) {
    Draggable.create(win, {
      type: "top,left",
      handle: ".preview-titlebar",
      bounds: "#desktop-workarea",
      onPress: () => window.focusWindow(win),
      onDragStart() {
        document.body.classList.add("is-dragging");
      },
      onDragEnd() {
        document.body.classList.remove("is-dragging");
      },
    });
  }
}

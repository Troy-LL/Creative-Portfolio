export function initPreviewViewers() {
  window.openPdfViewer = openPdfViewer;
  window.openImageViewer = openImageViewer;
}

function openPdfViewer(pdfSrc, title, width = "800px", height = "600px") {
  const desktop = document.getElementById("desktop");
  if (!desktop) return;

  const existingOverlay = document.querySelector(".preview-overlay");
  if (existingOverlay) {
    const win = existingOverlay.querySelector(".preview-window");
    const titleEl = existingOverlay.querySelector(".preview-title");
    const iframe = existingOverlay.querySelector("iframe");

    if (titleEl) titleEl.textContent = title || "Preview";
    if (iframe) iframe.src = pdfSrc;

    if (win && !window.matchMedia("(max-width: 768px)").matches) {
      win.style.width = width;
      win.style.height = height;
    }

    window.focusWindow(win);

    gsap.fromTo(
      win,
      { scale: 0.98 },
      { scale: 1, duration: 0.3, ease: "back.out(2)" },
    );
    return;
  }

  const instanceId = "preview-" + Date.now();
  const overlay = document.createElement("div");
  overlay.className = "preview-overlay window-overlay is-visible";
  overlay.id = instanceId;
  overlay.style.zIndex = "30";

  overlay.innerHTML = `
    <div class="preview-window mac-window" style="width: ${width}; height: ${height}; opacity: 0; transform: scale(0.9) translateY(20px); position: absolute; top: 100px; left: 150px; margin: 0;">
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

  desktop.appendChild(overlay);

  const win = overlay.querySelector(".preview-window");
  const closeBtn = overlay.querySelector(".mac-close");
  const minBtn = overlay.querySelector(".mac-min");

  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const animConfig = isMobile
    ? { opacity: 1, duration: 0.35 }
    : { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: "back.out(1.4)" };

  gsap.to(win, animConfig);

  window.focusWindow(win);

  const closeWindow = () => {
    gsap.to(win, {
      opacity: 0,
      scale: 0.9,
      y: 20,
      duration: 0.25,
      ease: "power2.in",
      onComplete: () => {
        overlay.remove();
        if (document.querySelectorAll(".mac-window").length === 0) {
          document.body.classList.remove("is-dragging");
        }
      },
    });
  };

  const shim = win.querySelector(".preview-iframe-shim");
  shim?.addEventListener("mousedown", () => {
    window.focusWindow(win);
  });

  closeBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    closeWindow();
  });

  minBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    closeWindow();
  });

  if (typeof Draggable !== "undefined") {
    Draggable.create(win, {
      type: "x,y",
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
  const desktop = document.getElementById("desktop");
  if (!desktop) return;

  const overlay = document.createElement("div");
  overlay.className = "window-overlay image-overlay is-visible";
  overlay.innerHTML = `
    <div class="mac-window preview-window" style="width: min(90vw, 600px); height: auto; opacity: 0; transform: translateY(20px) scale(0.95);">
      <div class="preview-titlebar">
        <div class="preview-dots mac-controls">
          <div class="preview-dot mac-close"></div>
          <div class="preview-dot mac-min"></div>
          <div class="preview-dot mac-max"></div>
        </div>
        <div class="preview-title">${title || "Image Preview"}</div>
      </div>
      <div class="preview-body" style="padding: 0; background: #000; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 0 0 12px 12px;">
        <img src="${imgSrc}" style="width: 100%; height: auto; display: block;">
      </div>
    </div>
  `;

  desktop.appendChild(overlay);

  const win = overlay.querySelector(".preview-window");
  const closeBtn = overlay.querySelector(".mac-close");

  gsap.to(win, {
    opacity: 1,
    scale: 1,
    y: 0,
    duration: 0.35,
    ease: "back.out(1.4)",
  });

  window.focusWindow(win);

  const closeWindow = () => {
    gsap.to(win, {
      opacity: 0,
      scale: 0.9,
      y: 20,
      duration: 0.25,
      ease: "power2.in",
      onComplete: () => overlay.remove(),
    });
  };

  closeBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    closeWindow();
  });

  if (typeof Draggable !== "undefined") {
    Draggable.create(win, {
      handle: ".preview-titlebar",
      bounds: "#desktop-workarea",
      onPress: () => window.focusWindow(win),
    });
  }
}

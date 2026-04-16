/** Set by initSafariApp — lets interactions.js open Safari like other dock apps. */
let openSafariFromDockImpl = () => {};

export function openSafariFromDock() {
  openSafariFromDockImpl();
}

/** Virtual viewport sizes — embedded page layout matches desktop vs narrow breakpoints. */
const PREVIEW = {
  desktop: { w: 1280, h: 820 },
  phone: { w: 390, h: 844 },
};

/** Narrow window ⇒ phone-sized embed; matches typical mobile layout breakpoint. */
function getPreviewModeFromWindow() {
  return window.matchMedia("(max-width: 768px)").matches ? "phone" : "desktop";
}

export function initSafariApp() {
  const overlay = document.getElementById("safariOverlay");
  if (!overlay) return;

  const dockIcon = document.querySelector('.dock-icon[data-app="safari"]');
  const windowEl = overlay.querySelector(".safari-window");
  const closeDot = overlay.querySelector(".safari-titlebar .mac-close");
  const minDot = overlay.querySelector(".safari-titlebar .mac-min");
  const startPage = document.getElementById("safariStartPage");
  const webShell = document.getElementById("safariWebShell");
  const iframe = document.getElementById("safariFrame");
  const backBtn = document.getElementById("safariBackBtn");
  const addressEl = document.getElementById("safariAddress");
  const favFounders = document.getElementById("safariFavFounders");
  const previewStage = document.getElementById("safariPreviewStage");
  const previewScaler = document.getElementById("safariPreviewScaler");

  let previewResizeObserver = null;

  function resolveHref(rel) {
    try {
      return new URL(rel, window.location.href).href;
    } catch {
      return rel;
    }
  }

  function setAddressStart() {
    if (addressEl) addressEl.textContent = "Search or enter website name";
    if (backBtn) backBtn.disabled = true;
  }

  function setAddressBrowsing(label) {
    if (addressEl) addressEl.textContent = label || "";
    if (backBtn) backBtn.disabled = false;
  }

  /**
   * Cover-style scale: fills the stage (no letterboxing / black gutters). Virtual
   * viewport (vw×vh) is scaled up so one axis matches the stage and the other
   * overflows; overflow is clipped and the iframe is centered.
   */
  function updatePreviewScale() {
    if (!webShell || webShell.hasAttribute("hidden") || !previewStage || !previewScaler || !iframe) {
      return;
    }
    const mode = getPreviewModeFromWindow();
    const { w: vw, h: vh } = PREVIEW[mode];
    const rect = previewStage.getBoundingClientRect();
    const availW = Math.max(rect.width, 1);
    const availH = Math.max(rect.height, 1);

    const scale = Math.max(availW / vw, availH / vh);
    const scaledW = vw * scale;
    const scaledH = vh * scale;
    const left = (availW - scaledW) / 2;
    const top = (availH - scaledH) / 2;

    previewScaler.classList.toggle("safari-preview-scaler--phone", mode === "phone");

    previewScaler.style.width = `${availW}px`;
    previewScaler.style.height = `${availH}px`;
    previewScaler.style.overflow = "hidden";

    iframe.style.left = `${left}px`;
    iframe.style.top = `${top}px`;
    iframe.style.width = `${vw}px`;
    iframe.style.height = `${vh}px`;
    iframe.style.transform = `scale(${scale})`;
    iframe.style.transformOrigin = "top left";
  }

  function attachPreviewResize() {
    if (!previewStage || previewResizeObserver) return;
    previewResizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(updatePreviewScale);
    });
    previewResizeObserver.observe(previewStage);
  }

  function detachPreviewResize() {
    if (previewResizeObserver) {
      previewResizeObserver.disconnect();
    }
    previewResizeObserver = null;
  }

  function showStartPage() {
    windowEl?.classList.remove("safari-window--browsing");
    startPage?.removeAttribute("hidden");
    webShell?.setAttribute("hidden", "");
    if (iframe) iframe.src = "";
    detachPreviewResize();
    setAddressStart();
  }

  function showSite(relHref, addressLabel) {
    if (!iframe || !relHref) return;
    const href = resolveHref(relHref);
    windowEl?.classList.add("safari-window--browsing");
    startPage?.setAttribute("hidden", "");
    webShell?.removeAttribute("hidden");
    setAddressBrowsing(addressLabel || "Founders Cafe");
    if (typeof window.focusWindow === "function") window.focusWindow(".safari-window");
    attachPreviewResize();
    requestAnimationFrame(() => {
      if (iframe) iframe.src = href;
      requestAnimationFrame(updatePreviewScale);
    });
  }

  function activateFoundersFavorite() {
    if (!favFounders) return;
    const href = favFounders.dataset.safariHref;
    const addr = favFounders.dataset.safariAddress || "Founders Cafe";
    if (href) showSite(href, addr);
  }

  function open() {
    if (overlay.classList.contains("is-visible")) {
      if (windowEl.classList.contains("is-focused")) {
        close(false);
      } else if (typeof window.focusWindow === "function") {
        window.focusWindow(".safari-window");
      }
      return;
    }
    overlay.classList.add("is-visible");
    dockIcon?.classList.add("is-open");
    showStartPage();
    gsap.fromTo(
      ".safari-window",
      { opacity: 0, scale: 0.9, y: 20 },
      { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: "power2.out" },
    );
    if (typeof window.focusWindow === "function") window.focusWindow(".safari-window");
  }

  openSafariFromDockImpl = open;

  function close(removeDockIndicator = true) {
    gsap.to(windowEl, {
      opacity: 0,
      scale: 0.9,
      y: 18,
      duration: 0.25,
      ease: "power2.in",
      onComplete: () => {
        overlay.classList.remove("is-visible");
        if (removeDockIndicator) dockIcon?.classList.remove("is-open");
        showStartPage();
      },
    });
  }

  closeDot?.addEventListener("click", (e) => {
    e.stopPropagation();
    close();
  });

  minDot?.addEventListener("click", (e) => {
    e.stopPropagation();
    close(false);
  });

  overlay.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    if (target.closest(".safari-titlebar .mac-close")) {
      e.stopPropagation();
      close();
      return;
    }
    if (target.closest(".safari-titlebar .mac-min")) {
      e.stopPropagation();
      close(false);
    }
  });

  backBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (backBtn.disabled) return;
    showStartPage();
  });

  favFounders?.addEventListener(
    "click",
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      activateFoundersFavorite();
    },
    true,
  );

  favFounders?.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    activateFoundersFavorite();
  });

  iframe?.addEventListener("load", () => {
    requestAnimationFrame(updatePreviewScale);
  });

  window.addEventListener(
    "resize",
    () => {
      if (webShell && !webShell.hasAttribute("hidden")) {
        requestAnimationFrame(updatePreviewScale);
      }
    },
    { passive: true },
  );

  const mobileMq = window.matchMedia("(max-width: 768px)");
  function onViewportModeChange() {
    if (webShell && !webShell.hasAttribute("hidden")) {
      requestAnimationFrame(updatePreviewScale);
    }
  }
  if (mobileMq.addEventListener) {
    mobileMq.addEventListener("change", onViewportModeChange);
  } else {
    mobileMq.addListener(onViewportModeChange);
  }
}

export function initSafariApp() {
  const overlay = document.getElementById("safariOverlay");
  if (!overlay) return;

  const dockIcon = document.querySelector('.dock-icon[data-app="safari"]');
  const windowEl = overlay.querySelector(".safari-window");
  const closeDot = overlay.querySelector(".safari-titlebar .mac-close");
  const minDot = overlay.querySelector(".safari-titlebar .mac-min");

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
    gsap.fromTo(
      ".safari-window",
      { opacity: 0, scale: 0.9, y: 20 },
      { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: "power2.out" },
    );
    if (typeof window.focusWindow === "function") window.focusWindow(".safari-window");
  }

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
      },
    });
  }

  dockIcon?.addEventListener("click", (e) => {
    e.stopPropagation();
    open();
  });

  closeDot?.addEventListener("click", (e) => {
    e.stopPropagation();
    close();
  });

  minDot?.addEventListener("click", (e) => {
    e.stopPropagation();
    close(false);
  });

  // Delegated fallback for Safari traffic lights.
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
}

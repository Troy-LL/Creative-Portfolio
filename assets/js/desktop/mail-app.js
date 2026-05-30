export function initMailApp() {
  const overlay = document.getElementById("mailOverlay");
  if (!overlay) return;

  const windowEl = overlay.querySelector(".mail-window");
  const closeDot = overlay.querySelector(".mail-titlebar .mac-close");
  const minDot = overlay.querySelector(".mail-titlebar .mac-min");
  const form = document.getElementById("mailComposeForm");

  function close(removeDockIndicator = true) {
    gsap.to(windowEl, {
      opacity: 0,
      scale: 0.9,
      y: 18,
      duration: 0.25,
      ease: "power2.in",
      onComplete: () => {
        overlay.classList.remove("is-visible");
        if (removeDockIndicator) {
          document
            .querySelector('.dock-icon[data-app="mail"]')
            ?.classList.remove("is-open");
        }
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

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const to = String(fd.get("to") ?? "").trim();
    const subject = String(fd.get("subject") ?? "");
    const body = String(fd.get("body") ?? "");
    if (!to) return;
    const url = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
  });
}

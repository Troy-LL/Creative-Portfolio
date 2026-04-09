export function initContactsApp() {
  const overlay = document.getElementById("contactsOverlay");
  if (!overlay) return;

  const windowEl = overlay.querySelector(".contacts-window");
  const closeDot = overlay.querySelector(".mac-close");
  const minDot = overlay.querySelector(".mac-min");

  function close() {
    gsap.to(windowEl, {
      opacity: 0,
      scale: 0.9,
      y: 18,
      duration: 0.25,
      ease: "power2.in",
      onComplete: () => {
        overlay.classList.remove("is-visible");
        document
          .querySelector('.dock-icon[data-app="contacts"]')
          ?.classList.remove("is-open");
      },
    });
  }

  closeDot?.addEventListener("click", (e) => {
    e.stopPropagation();
    close();
  });

  minDot?.addEventListener("click", (e) => {
    e.stopPropagation();
    close();
  });
}

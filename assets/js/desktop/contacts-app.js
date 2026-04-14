export function initContactsApp() {
  const overlay = document.getElementById("contactsOverlay");
  if (!overlay) return;

  const windowEl = overlay.querySelector(".contacts-window");
  const closeDot = overlay.querySelector(".mac-close");
  const minDot = overlay.querySelector(".mac-min");
  const quickMail = document.getElementById("contactsQuickMail");

  function openMailFromContacts() {
    const mailDockIcon = document.querySelector('.dock-icon[data-app="mail"]');
    if (mailDockIcon) {
      mailDockIcon.click();
      return;
    }

    // Fallback if dock icon is unavailable
    const mailOverlay = document.getElementById("mailOverlay");
    if (!mailOverlay) return;
    mailOverlay.classList.add("is-visible");
    gsap.fromTo(
      ".mail-window",
      { opacity: 0, scale: 0.9, y: 20 },
      { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: "power2.out" },
    );
    if (typeof window.focusWindow === "function") window.focusWindow(".mail-window");
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
        if (removeDockIndicator) {
          document
            .querySelector('.dock-icon[data-app="contacts"]')
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

  quickMail?.addEventListener("click", (e) => {
    e.stopPropagation();
    openMailFromContacts();
  });
}

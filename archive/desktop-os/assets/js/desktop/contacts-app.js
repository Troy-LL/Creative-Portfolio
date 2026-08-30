import { animateWindowOpen } from "./window-resize.js";

export function initContactsApp() {
  const overlay = document.getElementById("contactsOverlay");
  if (!overlay) return;

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
    animateWindowOpen(".mail-window", {
      duration: 0.35,
      ease: "power2.out",
      fromScale: 0.9,
      fromY: 20,
    });
    if (typeof window.focusWindow === "function") window.focusWindow(".mail-window");
  }

  quickMail?.addEventListener("click", (e) => {
    e.stopPropagation();
    openMailFromContacts();
  });
}

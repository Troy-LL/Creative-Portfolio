import { restoreFromDesktop } from "./monitor-transition.js";
import { openFinder } from "./finder.js";
import { syncSettingsOverlay } from "./settings-app.js";

export function initDesktopInteractions() {
  const monitor = document.querySelector(".monitor-bezel");
  const desktop = document.getElementById("desktop");
  const settingsOverlay = document.getElementById("settingsOverlay");
  if (!monitor || !desktop) return;

  document.querySelectorAll(".dock-icon").forEach((icon) => {
    icon.addEventListener("click", () => {
      const app = icon.dataset.app !== undefined ? icon.dataset.app : null;
      const command =
        icon.dataset.command !== undefined ? icon.dataset.command : null;
      const folder =
        icon.dataset.folder !== undefined ? icon.dataset.folder : null;

      if (app === "settings") {
        if (!settingsOverlay) return;
        settingsOverlay.classList.add("is-visible");
        icon.classList.add("is-open");
        syncSettingsOverlay();
        gsap.fromTo(
          ".settings-window",
          { opacity: 0, scale: 0.9, y: 20 },
          { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: "back.out(1.3)" },
        );
        if (typeof window.focusWindow === "function")
          window.focusWindow(".settings-window");
        return;
      }

      if (app === "contacts") {
        const contactsOverlay = document.getElementById("contactsOverlay");
        if (!contactsOverlay) return;
        contactsOverlay.classList.add("is-visible");
        icon.classList.add("is-open");
        gsap.fromTo(
          ".contacts-window",
          { opacity: 0, scale: 0.9, y: 20 },
          { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: "power2.out" },
        );
        if (typeof window.focusWindow === "function")
          window.focusWindow(".contacts-window");
        return;
      }

      if (app === "mail") {
        const mailOverlay = document.getElementById("mailOverlay");
        if (!mailOverlay) return;
        mailOverlay.classList.add("is-visible");
        icon.classList.add("is-open");
        gsap.fromTo(
          ".mail-window",
          { opacity: 0, scale: 0.9, y: 20 },
          { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: "power2.out" },
        );
        if (typeof window.focusWindow === "function")
          window.focusWindow(".mail-window");
        return;
      }

      if (app === "finder") {
        openFinder("recents");
        return;
      }

      if (folder) {
        openFinder(folder);
        return;
      }

      if (command !== null) {
        restoreFromDesktop(monitor, desktop, command);
      }
    });
  });

  document.querySelectorAll(".desktop-file-icon").forEach((icon) => {
    const openHandler = () => {
      const app = icon.dataset.app !== undefined ? icon.dataset.app : null;
      const command =
        icon.dataset.command !== undefined ? icon.dataset.command : null;
      const folder =
        icon.dataset.folder !== undefined ? icon.dataset.folder : null;
      const img = icon.dataset.img !== undefined ? icon.dataset.img : null;

      if (app === "contacts") {
        const conn = document.querySelector('.dock-icon[data-app="contacts"]');
        conn?.click();
        return;
      }

      if (folder) {
        openFinder(folder);
      } else if (img && typeof window.openImageViewer === "function") {
        const label =
          icon.querySelector(".file-icon__label") ||
          icon.querySelector(".finder-icon-label");
        window.openImageViewer(img, label?.innerText);
      } else if (command !== null) {
        restoreFromDesktop(monitor, desktop, command);
      }
    };

    icon.addEventListener("click", () => {
      document
        .querySelectorAll(".desktop-file-icon")
        .forEach((i) => i.classList.remove("selected"));
      icon.classList.add("selected");

      const isMobile = window.matchMedia("(max-width: 768px)").matches;
      if (isMobile) {
        openHandler();
      }
    });

    icon.addEventListener("dblclick", openHandler);
  });
}

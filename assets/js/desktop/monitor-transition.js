import { cmdInput, lenis } from "../core/state.js";
import { handleCommand } from "../terminal/commands.js";

/** Menubar, desktop icons, dock — shared by boot sequence and minimize-from-terminal. */
export function animateDesktopChromeIn() {
  const desktop = document.getElementById("desktop");
  if (!desktop) return;

  gsap.fromTo(
    desktop,
    { opacity: 0 },
    { opacity: 1, duration: 0.35, ease: "power2.out", delay: 0.15 },
  );

  gsap.fromTo(
    ".desktop-menubar",
    { opacity: 0, y: -10 },
    { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", delay: 0.25 },
  );

  gsap.fromTo(
    ".desktop-icons-area .desktop-file-icon",
    { opacity: 0, y: 12 },
    {
      opacity: 1,
      y: 0,
      duration: 0.35,
      stagger: 0.06,
      ease: "power2.out",
      delay: 0.3,
    },
  );

  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const dockStart = isMobile
    ? { x: -20, y: 0, xPercent: 0, yPercent: -50 }
    : { x: 0, y: 20, xPercent: -50, yPercent: 0 };

  const dockEnd = isMobile
    ? { x: 0, y: 0, xPercent: 0, yPercent: -50 }
    : { x: 0, y: 0, xPercent: -50, yPercent: 0 };

  gsap.fromTo(
    ".desktop-dock",
    { opacity: 0, ...dockStart },
    { opacity: 1, ...dockEnd, duration: 0.45, ease: "back.out(1.4)", delay: 0.3 },
  );
}

export function minimizeToDesktop(monitor, desktop) {
  monitor.classList.add("is-minimized");
  desktop.classList.add("desktop--visible");

  if (lenis) lenis.stop();

  gsap.to(monitor, {
    opacity: 0,
    scale: 0.85,
    y: 60,
    duration: 0.38,
    ease: "power3.in",
  });

  animateDesktopChromeIn();
}

export function restoreFromDesktop(monitor, desktop, command = null) {
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const dockOut = isMobile
    ? { x: -25, y: 0, xPercent: 0, yPercent: -50 }
    : { x: 0, y: 20, xPercent: -50, yPercent: 0 };

  gsap.to(".desktop-dock", {
    opacity: 0,
    ...dockOut,
    duration: 0.22,
    ease: "power2.in",
  });
  gsap.to(".desktop-menubar", {
    opacity: 0,
    y: -8,
    duration: 0.22,
    ease: "power2.in",
  });
  gsap.to(".desktop-icons-area .desktop-file-icon", {
    opacity: 0,
    y: 8,
    duration: 0.18,
    stagger: 0.04,
    ease: "power2.in",
  });

  gsap.to(desktop, {
    opacity: 0,
    duration: 0.3,
    delay: 0.1,
    ease: "power2.in",
    onComplete: () => {
      desktop.classList.remove("desktop--visible");
    },
  });

  monitor.classList.remove("is-hidden", "is-minimized");

  gsap.fromTo(
    monitor,
    { opacity: 0, scale: 0.88, y: 50 },
    {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 0.5,
      ease: "back.out(1.3)",
      delay: 0.15,
      onComplete: () => {
        if (lenis) lenis.start();
        if (command) handleCommand(command);

        const mobile = window.matchMedia("(max-width: 768px)").matches;
        if (!mobile) {
          cmdInput.focus();
        }
      },
    },
  );
}

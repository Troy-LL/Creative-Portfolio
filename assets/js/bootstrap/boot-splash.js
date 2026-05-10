/**
 * Boot: TL logo + thin bar, then macOS desktop (terminal stays minimized).
 * Mobile: same progress, then iOS lock screen (splash element kept).
 */
import { animateDesktopChromeIn } from "../desktop/monitor-transition.js";
import { isMobileViewport } from "../mobile/viewport.js";

let lockClockId = 0;

function startLockClock(splash) {
  const timeEl = splash.querySelector("#iosLockTime");
  const dateEl = splash.querySelector("#iosLockDate");
  if (!timeEl || !dateEl) return;

  const tick = () => {
    const now = new Date();
    timeEl.textContent = now.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    dateEl.textContent = now.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  tick();
  if (lockClockId) clearInterval(lockClockId);
  lockClockId = window.setInterval(tick, 1000);
}

export function stopLockClock() {
  if (lockClockId) {
    clearInterval(lockClockId);
    lockClockId = 0;
  }
}

export function initBootSplash() {
  const splash = document.getElementById("bootSplash");
  const fill = document.querySelector(".boot-splash__fill");
  const monitor = document.querySelector(".monitor-bezel");
  const desktop = document.getElementById("desktop");

  if (!splash || !fill || !monitor || !desktop) {
    return Promise.resolve();
  }

  const mobile = isMobileViewport();
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  document.body.setAttribute("aria-busy", "true");

  const track = document.querySelector(".boot-splash__track");
  const inner = splash.querySelector(".boot-splash__inner");

  if (reduceMotion || typeof gsap === "undefined") {
    if (mobile) {
      document.body.removeAttribute("aria-busy");
      document.body.classList.remove("boot-splash--active");
      splash.classList.add("boot-splash--ios-lock");
      splash.setAttribute("aria-hidden", "false");
      if (inner) inner.style.opacity = "0";
      startLockClock(splash);
      return Promise.resolve();
    }

    splash.remove();
    document.body.classList.remove("boot-splash--active");
    document.body.removeAttribute("aria-busy");
    desktop.classList.add("desktop--visible");
    if (typeof gsap !== "undefined") {
      gsap.set(
        [
          desktop,
          ".desktop-menubar",
          ".desktop-icons-area .desktop-file-icon",
          ".desktop-dock",
        ],
        { opacity: 1, clearProps: "transform" },
      );
    }
    return Promise.resolve();
  }

  gsap.set(fill, { scaleX: 0, transformOrigin: "left center" });

  const fillDuration = 1.65;
  const fadeOut = 0.42;

  if (mobile) {
    return new Promise((resolve) => {
      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        onComplete: () => {
          document.body.removeAttribute("aria-busy");
          document.body.classList.remove("boot-splash--active");
          splash.classList.add("boot-splash--ios-lock");
          splash.setAttribute("aria-hidden", "false");
          startLockClock(splash);
          resolve();
        },
      });

      tl.to(fill, {
        scaleX: 1,
        duration: fillDuration,
        ease: "power2.inOut",
        onUpdate: () => {
          const x = gsap.getProperty(fill, "scaleX");
          const pct = Math.min(100, Math.round(Number(x) * 100));
          track?.setAttribute("aria-valuenow", String(pct));
        },
      });

      if (inner) {
        tl.to(inner, { opacity: 0, duration: fadeOut });
      }
    });
  }

  return new Promise((resolve) => {
    const tl = gsap.timeline({
      defaults: { ease: "power2.inOut" },
      onComplete: () => {
        splash.remove();
        document.body.classList.remove("boot-splash--active");
        document.body.removeAttribute("aria-busy");
        resolve();
      },
    });

    tl.to(fill, {
      scaleX: 1,
      duration: fillDuration,
      ease: "power2.inOut",
      onUpdate: () => {
        const x = gsap.getProperty(fill, "scaleX");
        const pct = Math.min(100, Math.round(Number(x) * 100));
        track?.setAttribute("aria-valuenow", String(pct));
      },
    });

    tl.call(() => {
      desktop.classList.add("desktop--visible");
      animateDesktopChromeIn();
    });

    tl.to(
      splash,
      { opacity: 0, duration: fadeOut, ease: "power2.inOut" },
      "<",
    );
  });
}

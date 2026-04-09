/**
 * Boot: TL logo + thin bar, then macOS desktop (terminal stays minimized).
 */
import { animateDesktopChromeIn } from "../desktop/monitor-transition.js";

export function initBootSplash() {
  const splash = document.getElementById("bootSplash");
  const fill = document.querySelector(".boot-splash__fill");
  const monitor = document.querySelector(".monitor-bezel");
  const desktop = document.getElementById("desktop");

  if (!splash || !fill || !monitor || !desktop) {
    return Promise.resolve();
  }

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  document.body.setAttribute("aria-busy", "true");

  const track = document.querySelector(".boot-splash__track");

  if (reduceMotion || typeof gsap === "undefined") {
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

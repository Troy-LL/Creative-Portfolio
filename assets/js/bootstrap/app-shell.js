import { setLenis, lenis } from "../core/state.js";

export function initLenisSmoothScroll() {
  if (!window.Lenis) return;
  setLenis(
    new window.Lenis({
      smoothWheel: true,
      smoothTouch: false,
    }),
  );

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
}

/** Narrow layout: tablets and phones in any orientation. */
const NARROW_MQ = "(max-width: 1024px)";

/** Touch-primary devices: phones/tablets, not touchscreen laptops. */
const TOUCH_PRIMARY_MQ = "(hover: none) and (pointer: coarse)";

export const GATE_MEDIA_QUERIES = [NARROW_MQ, TOUCH_PRIMARY_MQ];

/** Mirrors the inline bootstrap in index.html — keep in sync. */
export function isMobileViewport() {
  return GATE_MEDIA_QUERIES.some((query) => window.matchMedia(query).matches);
}

export function shouldShowMobileGate() {
  return isMobileViewport();
}

export function setDataViewAttr() {
  document.documentElement.setAttribute(
    "data-view",
    isMobileViewport() ? "mobile" : "desktop",
  );
}

export function watchGateViewport(onChange) {
  const handler = () => onChange(shouldShowMobileGate());
  GATE_MEDIA_QUERIES.forEach((query) => {
    window.matchMedia(query).addEventListener("change", handler);
  });
  return () => {
    GATE_MEDIA_QUERIES.forEach((query) => {
      window.matchMedia(query).removeEventListener("change", handler);
    });
  };
}

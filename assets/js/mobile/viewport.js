/** Match mobile-context.md: narrow viewport or primary touch device. */
export function isMobileViewport() {
  return window.innerWidth < 768 || "ontouchstart" in window;
}

export function setDataViewAttr() {
  document.documentElement.setAttribute(
    "data-view",
    isMobileViewport() ? "mobile" : "desktop",
  );
}

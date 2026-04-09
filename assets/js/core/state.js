/**
 * Shared DOM refs and scroll helper for the terminal + Lenis instance.
 * Loaded as an ES module; assumes DOM is ready (script at end of body).
 */
if (typeof gsap !== "undefined" && typeof TextPlugin !== "undefined") {
  gsap.registerPlugin(TextPlugin);
}

export const terminalEl = document.getElementById("terminal");
export let lenis = null;
export function setLenis(instance) {
  lenis = instance;
}

export const output = document.getElementById("output");
export const cmdInput = document.getElementById("cmd");
export const inputDisplay = document.getElementById("inputDisplay");

export function scrollDown() {
  requestAnimationFrame(() => {
    terminalEl.scrollTo({
      top: terminalEl.scrollHeight,
      behavior: "smooth",
    });
  });
}

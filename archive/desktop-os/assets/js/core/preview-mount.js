/** Where Finder preview overlays attach: iOS layer on mobile, desktop otherwise. */
export function getPreviewMountEl() {
  if (document.documentElement.getAttribute("data-view") === "mobile") {
    return document.getElementById("iosPreviewMount") ?? document.body;
  }
  return document.getElementById("desktop") ?? document.body;
}

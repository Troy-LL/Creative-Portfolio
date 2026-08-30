import { applyStoredAppearance } from "./appearance-state.js";
import { initWindowControls } from "./monitor.js";
import { initDesktopInteractions } from "./interactions.js";
import { initSettingsApp } from "./settings-app.js";
import { initContactsApp } from "./contacts-app.js";
import { initMailApp } from "./mail-app.js";
import { initSpotifyApp } from "./spotify-app.js";
import { initSafariApp } from "./safari-app.js";
import { initMenubarClock } from "./menubar-clock.js";
import { initFinderApp } from "./finder.js";
import { initPreviewViewers } from "./viewers.js";
import { initControlCenter } from "./control-center.js";
import { initDraggableWindows } from "./window-focus.js";
import { initResizableWindows } from "./window-resize.js";
import { initDraggableDesktopIcons } from "./desktop-icons.js";
import { initWindowChrome } from "./window-chrome.js";

export function initDesktopUi() {
  applyStoredAppearance();
  initPreviewViewers();
  initWindowChrome();
  initWindowControls();
  initDesktopInteractions();
  initDraggableDesktopIcons();
  initSettingsApp();
  initFinderApp();
  initControlCenter();
  initMenubarClock();
  initDraggableWindows();
  initResizableWindows();
  initContactsApp();
  initMailApp();
  initSpotifyApp();
  /* Safari after interactions so openSafariFromDock is wired before first dock click. */
  initSafariApp();
}

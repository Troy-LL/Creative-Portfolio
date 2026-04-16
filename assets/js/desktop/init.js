import { applyStoredAppearance } from "./appearance-state.js";
import { initWindowControls } from "./monitor.js";
import { initDesktopInteractions } from "./interactions.js";
import { initSettingsApp } from "./settings-app.js";
import { initContactsApp } from "./contacts-app.js";
import { initMailApp } from "./mail-app.js";
import { initSafariApp } from "./safari-app.js";
import { initMenubarClock } from "./menubar-clock.js";
import { initFinderApp } from "./finder.js";
import { initPreviewViewers } from "./viewers.js";
import { initControlCenter } from "./control-center.js";
import { initDraggableWindows } from "./window-focus.js";

export function initDesktopUi() {
  applyStoredAppearance();
  initPreviewViewers();
  initWindowControls();
  initDesktopInteractions();
  initSettingsApp();
  initFinderApp();
  initControlCenter();
  initMenubarClock();
  initDraggableWindows();
  initContactsApp();
  initMailApp();
  /* Safari after interactions so openSafariFromDock is wired before first dock click. */
  initSafariApp();
}

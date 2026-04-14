function syncMenubarAppName(focusedWindow) {
  const label = document.querySelector(".menubar-app-name");
  if (!label) return;
  if (!focusedWindow) {
    label.textContent = "Finder";
    return;
  }
  if (focusedWindow.classList.contains("finder-window")) {
    label.textContent = "Finder";
  } else if (focusedWindow.classList.contains("settings-window")) {
    label.textContent = "Settings";
  } else if (focusedWindow.classList.contains("contacts-window")) {
    label.textContent = "Contacts";
  } else if (focusedWindow.classList.contains("mail-window")) {
    label.textContent = "Mail";
  } else if (focusedWindow.classList.contains("safari-window")) {
    label.textContent = "Safari";
  } else if (focusedWindow.classList.contains("preview-window")) {
    label.textContent = "Preview";
  } else {
    label.textContent = "Finder";
  }
}

let windowZCounter = 30;

window.focusWindow = function (targetEl) {
  document
    .querySelectorAll(".mac-window")
    .forEach((w) => w.classList.remove("is-focused"));

  let el = null;
  if (targetEl) {
    el =
      typeof targetEl === "string"
        ? document.querySelector(targetEl)
        : targetEl;
    if (el) {
      el.classList.add("is-focused");
      if (
        el.parentElement &&
        el.parentElement.classList.contains("window-overlay")
      ) {
        windowZCounter += 1;
        el.parentElement.style.zIndex = String(windowZCounter);
      }
    }
  }

  syncMenubarAppName(el);
};

export function initDraggableWindows() {
  if (typeof Draggable === "undefined") return;

  const windows = [
    ".finder-window",
    ".settings-window",
    ".contacts-window",
    ".mail-window",
    ".safari-window",
  ];
  windows.forEach((sel) => {
    let handle = "";
    if (sel === ".finder-window") {
      handle = ".finder-topbar, .finder-window-controls";
    } else if (sel === ".settings-window") {
      handle = ".settings-titlebar";
    } else if (sel === ".contacts-window") {
      handle = ".contacts-sidebar-top, .contacts-detail-header";
    } else if (sel === ".mail-window") {
      handle = ".mail-titlebar";
    } else if (sel === ".safari-window") {
      handle = ".safari-titlebar";
    }

    Draggable.create(sel, {
      type: "x,y",
      handle: handle,
      bounds: "#desktop-workarea",
      onPress: function () {
        window.focusWindow(this.target);
      },
      onDragStart: function () {
        document.body.classList.add("is-dragging");
      },
      onDragEnd: function () {
        document.body.classList.remove("is-dragging");
      },
    });
  });

  document.addEventListener("mousedown", (e) => {
    const win = e.target.closest(".mac-window");
    if (win) {
      window.focusWindow(win);
    } else if (
      e.target.closest(".desktop-wallpaper") ||
      e.target.closest(".desktop-icons-area")
    ) {
      window.focusWindow(null);
    }
  });
}

let lastIsMobile = window.matchMedia("(max-width: 768px)").matches;
window.addEventListener("resize", () => {
  const currentIsMobile = window.matchMedia("(max-width: 768px)").matches;
  if (currentIsMobile !== lastIsMobile) {
    gsap.set(".desktop-dock", {
      clearProps: "transform,x,y,xPercent,yPercent",
    });
    lastIsMobile = currentIsMobile;
  }
});

function setFinderDockOpen(isOpen) {
  document.querySelectorAll('.dock-icon[data-app="finder"]').forEach((el) => {
    el.classList.toggle("is-open", isOpen);
  });
}

function updateSidebarActive(overlay, route) {
  overlay
    .querySelectorAll(".finder-sidebar-item:not(.finder-sidebar-item--disabled)")
    .forEach((el) => {
      el.classList.remove("active");
      const v = el.dataset.finderView;
      const t = el.dataset.target;
      if (v && v === route) el.classList.add("active");
      if (t && t === route) el.classList.add("active");
    });
}

/** Skeuomorphic folder / document PNGs read better on varied backgrounds than flat SVGs. */
function folderVisual() {
  return `
    <div class="finder-icon-visual finder-icon-visual--asset" aria-hidden="true">
      <img src="assets/img/folder.png" alt="" width="72" height="72" />
    </div>`;
}

function docVisual() {
  return `
    <div class="finder-icon-visual finder-icon-visual--asset" aria-hidden="true">
      <img src="assets/img/Document.png" alt="" width="72" height="72" />
    </div>`;
}

function appTileVisual(src, alt) {
  return `
    <div class="finder-icon-visual">
      <img src="${src}" alt="" width="56" height="56" />
    </div>`;
}

function bindFinderIcons(contentEl) {
  contentEl.querySelectorAll(".finder-icon").forEach((icon) => {
    const openHandler = () => {
      if (icon.dataset.folder) {
        openFinder(icon.dataset.folder);
      } else if (icon.dataset.launch) {
        launchDockApp(icon.dataset.launch);
      } else if (icon.dataset.pdf) {
        if (typeof window.openPdfViewer === "function") {
          window.openPdfViewer(
            icon.dataset.pdf,
            icon.querySelector(".finder-icon-label")?.innerText ?? "",
          );
        }
      } else if (icon.dataset.img) {
        if (typeof window.openImageViewer === "function") {
          window.openImageViewer(
            icon.dataset.img,
            icon.querySelector(".finder-icon-label")?.innerText ?? "",
          );
        }
      }
    };

    icon.addEventListener("dblclick", openHandler);
    icon.addEventListener("click", () => {
      if (window.matchMedia("(max-width: 768px)").matches) {
        openHandler();
      }
    });
  });
}

function launchDockApp(id) {
  if (id === "terminal") {
    document.querySelector('.dock-icon[title="SQL Terminal"]')?.click();
    return;
  }
  if (id === "finder") {
    return;
  }
  const sel = `.dock-icon[data-app="${id}"]`;
  document.querySelector(sel)?.click();
}

function buildFinderContent(route) {
  if (route === "recents") {
    return `
      <div class="finder-icon finder-icon--reflect" data-pdf="assets/img/Resume - Troy.pdf">
        ${docVisual()}
        <div class="finder-icon-label">Resume - Troy.pdf</div>
      </div>
      <div class="finder-icon finder-icon--reflect" data-folder="Projects">
        ${folderVisual()}
        <div class="finder-icon-label">Projects</div>
      </div>
      <div class="finder-icon finder-icon--reflect" data-launch="contacts">
        ${appTileVisual("assets/img/app-icons/contacts/256.png", "Contacts")}
        <div class="finder-icon-label">Contacts</div>
      </div>`;
  }

  if (route === "applications") {
    return `
      <div class="finder-icon" data-launch="terminal">
        ${appTileVisual("assets/img/app-icons/terminal/256.png", "SQL Terminal")}
        <div class="finder-icon-label">SQL Terminal</div>
      </div>
      <div class="finder-icon" data-launch="settings">
        ${appTileVisual("assets/img/app-icons/system-preferences/256.png", "Settings")}
        <div class="finder-icon-label">Settings</div>
      </div>
      <div class="finder-icon" data-launch="mail">
        ${appTileVisual("assets/img/app-icons/mail/512.png", "Mail")}
        <div class="finder-icon-label">Mail</div>
      </div>
      <div class="finder-icon" data-launch="contacts">
        ${appTileVisual("assets/img/app-icons/contacts/256.png", "Contacts")}
        <div class="finder-icon-label">Contacts</div>
      </div>
      <div class="finder-icon" data-launch="finder">
        ${appTileVisual("assets/img/app-icons/finder/256.png", "Finder")}
        <div class="finder-icon-label">Finder</div>
      </div>`;
  }

  if (route === "documents") {
    return `
      <div class="finder-icon" data-folder="Resume">
        ${folderVisual()}
        <div class="finder-icon-label">Resume</div>
      </div>
      <div class="finder-icon" data-folder="Projects">
        ${folderVisual()}
        <div class="finder-icon-label">Projects</div>
      </div>
      <div class="finder-icon" data-folder="Passion Fueled">
        ${folderVisual()}
        <div class="finder-icon-label">Passion Fueled</div>
      </div>`;
  }

  if (route === "Resume") {
    return `
      <div class="finder-icon" data-pdf="assets/img/Resume - Troy.pdf">
        ${docVisual()}
        <div class="finder-icon-label">Resume - Troy.pdf</div>
      </div>`;
  }

  if (route === "Projects") {
    return `
      <div class="finder-icon" data-folder="Passion Fueled">
        ${folderVisual()}
        <div class="finder-icon-label">Passion Fueled</div>
      </div>`;
  }

  if (route === "Passion Fueled") {
    return `<p class="finder-empty-message">Folder is empty</p>`;
  }

  return `<p class="finder-empty-message">Folder is empty</p>`;
}

function titleForRoute(route) {
  const map = {
    recents: "Recents",
    applications: "Applications",
    documents: "Documents",
    Resume: "Resume",
    Projects: "Projects",
    "Passion Fueled": "Passion Fueled",
  };
  return map[route] ?? route;
}

function isEmptyContent(route) {
  return route === "Passion Fueled";
}

export function initFinderApp() {
  const overlay = document.getElementById("finderOverlay");
  if (!overlay) return;

  const windowEl = overlay.querySelector(".finder-window");
  const closeDot = overlay.querySelector(".mac-close");
  const minDot = overlay.querySelector(".mac-min");

  function close() {
    gsap.to(windowEl, {
      opacity: 0,
      scale: 0.9,
      duration: 0.2,
      ease: "power2.in",
      onComplete: () => {
        overlay.classList.remove("is-visible");
        windowEl.classList.remove("is-maximized");
        setFinderDockOpen(false);
      },
    });
  }

  closeDot?.addEventListener("click", (e) => {
    e.stopPropagation();
    close();
  });

  minDot?.addEventListener("click", (e) => {
    e.stopPropagation();
    close();
  });

  overlay
    .querySelectorAll(".finder-sidebar-item:not(.finder-sidebar-item--disabled)")
    .forEach((item) => {
      const activate = () => {
        if (item.dataset.finderView) openFinder(item.dataset.finderView);
        else if (item.dataset.target) openFinder(item.dataset.target);
      };
      item.addEventListener("click", activate);
      item.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activate();
        }
      });
    });

  const backBtn = document.getElementById("finderBack");
  const forwardBtn = document.getElementById("finderForward");

  backBtn?.addEventListener("click", () => {
    if (window.finderHistoryIndex > 0) {
      window.finderHistoryIndex--;
      const target = window.finderHistory[window.finderHistoryIndex];
      openFinder(target, false);
    }
  });

  forwardBtn?.addEventListener("click", () => {
    if (window.finderHistoryIndex < window.finderHistory.length - 1) {
      window.finderHistoryIndex++;
      const target = window.finderHistory[window.finderHistoryIndex];
      openFinder(target, false);
    }
  });
}

window.finderHistory = ["recents"];
window.finderHistoryIndex = 0;

export function openFinder(route, pushToHistory = true) {
  const overlay = document.getElementById("finderOverlay");
  if (!overlay) return;

  if (pushToHistory) {
    if (window.finderHistoryIndex < window.finderHistory.length - 1) {
      window.finderHistory = window.finderHistory.slice(
        0,
        window.finderHistoryIndex + 1,
      );
    }
    if (window.finderHistory[window.finderHistoryIndex] !== route) {
      window.finderHistory.push(route);
      window.finderHistoryIndex++;
    }
  }

  const backBtn = document.getElementById("finderBack");
  const forwardBtn = document.getElementById("finderForward");
  if (backBtn) {
    backBtn.style.opacity = window.finderHistoryIndex > 0 ? "1" : "0.3";
    backBtn.style.pointerEvents =
      window.finderHistoryIndex > 0 ? "auto" : "none";
  }
  if (forwardBtn) {
    forwardBtn.style.opacity =
      window.finderHistoryIndex < window.finderHistory.length - 1
        ? "1"
        : "0.3";
    forwardBtn.style.pointerEvents =
      window.finderHistoryIndex < window.finderHistory.length - 1
        ? "auto"
        : "none";
  }

  const titleEl = document.getElementById("finderTitle");
  const statusEl = document.getElementById("finderStatusText");
  if (titleEl) titleEl.textContent = titleForRoute(route);
  if (statusEl) statusEl.textContent = `guest > ${titleForRoute(route)}`;

  setFinderDockOpen(true);
  updateSidebarActive(overlay, route);

  const contentEl = document.getElementById("finderContent");
  if (contentEl) {
    contentEl.innerHTML = buildFinderContent(route);
    contentEl.classList.toggle("finder-content--recents", route === "recents");
    contentEl.classList.toggle("finder-content--empty", isEmptyContent(route));
    bindFinderIcons(contentEl);
  }

  if (!overlay.classList.contains("is-visible")) {
    overlay.classList.add("is-visible");
    gsap.fromTo(
      overlay.querySelector(".finder-window"),
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 0.25, ease: "power2.out" },
    );
  }
  if (typeof window.focusWindow === "function")
    window.focusWindow(".finder-window");
}

window.openFinder = openFinder;

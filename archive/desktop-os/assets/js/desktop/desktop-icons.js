const STORAGE_KEY = "desktop-icon-positions";
const DRAG_THRESHOLD = 6;
const ICON_WIDTH = 80;
const ICON_HEIGHT = 104;
const MARGIN_RIGHT = 16;
const MARGIN_TOP = 16;
const ICON_GAP = 2;

/** @returns {string} */
function getIconId(icon) {
  return icon.dataset.folder ?? icon.dataset.app ?? icon.dataset.command ?? "";
}

/** @returns {{ id: string; x: number; y: number }[]} */
function loadPositions() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** @param {HTMLElement[]} icons */
function savePositions(icons) {
  const positions = icons.map((icon) => ({
    id: getIconId(icon),
    x: parseFloat(icon.style.left) || 0,
    y: parseFloat(icon.style.top) || 0,
  }));
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
}

/** @returns {{ x: number; y: number }} */
function getDefaultPosition(index, areaWidth) {
  return {
    x: areaWidth - MARGIN_RIGHT - ICON_WIDTH,
    y: MARGIN_TOP + index * (ICON_HEIGHT + ICON_GAP),
  };
}

/** @param {HTMLElement} icon */
function applyPosition(icon, x, y) {
  gsap.set(icon, { x: 0, y: 0, left: x, top: y });
}

/** @param {HTMLElement} icon */
function commitDragOffset(icon) {
  const dx = gsap.getProperty(icon, "x");
  const dy = gsap.getProperty(icon, "y");
  if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return false;

  const left = (parseFloat(icon.style.left) || 0) + dx;
  const top = (parseFloat(icon.style.top) || 0) + dy;
  applyPosition(icon, left, top);
  return true;
}

/** @param {HTMLElement} icon */
function suppressNextClick(icon) {
  icon.addEventListener(
    "click",
    (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
    },
    { capture: true, once: true },
  );
}

export function initDraggableDesktopIcons() {
  const area = document.querySelector(".desktop-icons-area");
  const workarea = document.getElementById("desktop-workarea");
  if (!area || !workarea || typeof Draggable === "undefined") return;

  const icons = [...area.querySelectorAll(".desktop-file-icon")];
  if (!icons.length) return;

  const storedById = new Map(loadPositions().map((p) => [p.id, p]));
  const areaWidth = area.clientWidth;

  icons.forEach((icon, index) => {
    const saved = storedById.get(getIconId(icon));
    const { x, y } = saved ?? getDefaultPosition(index, areaWidth);
    applyPosition(icon, x, y);
  });

  icons.forEach((icon) => {
    Draggable.create(icon, {
      type: "x,y",
      bounds: workarea,
      minimumMovement: DRAG_THRESHOLD,
      onDragStart() {
        document.body.classList.add("is-dragging");
      },
      onDragEnd() {
        document.body.classList.remove("is-dragging");
        if (commitDragOffset(icon)) {
          suppressNextClick(icon);
        }
        savePositions(icons);
      },
    });
  });
}

let sheetLayerEl = null;
let activeClose = null;

export function setSheetLayer(el) {
  sheetLayerEl = el;
}

export function closeActiveSheet() {
  activeClose?.();
  activeClose = null;
}

/**
 * @param {{ title: string, onMount: (body: HTMLElement, sheet: HTMLElement) => void | (() => void), onUnmount?: () => void }} opts
 */
export function openAppSheet(opts) {
  const layer = sheetLayerEl;
  if (!layer) return null;

  closeActiveSheet();

  layer.classList.add("ios-sheet-layer--active");
  layer.setAttribute("aria-hidden", "false");
  layer.innerHTML = "";

  const backdrop = document.createElement("div");
  backdrop.className = "ios-sheet-backdrop";

  const sheet = document.createElement("div");
  sheet.className = "ios-sheet";
  sheet.setAttribute("role", "dialog");
  sheet.setAttribute("aria-modal", "true");
  sheet.innerHTML = `
    <div class="ios-sheet__handle-wrap"><div class="ios-sheet__handle" aria-hidden="true"></div></div>
    <header class="ios-sheet__nav">
      <button type="button" class="ios-sheet__back" aria-label="Close">‹</button>
      <h2 class="ios-sheet__title"></h2>
      <span class="ios-sheet__nav-spacer" aria-hidden="true"></span>
    </header>
    <div class="ios-sheet__body"></div>
  `;

  const titleEl = sheet.querySelector(".ios-sheet__title");
  titleEl.textContent = opts.title;
  titleEl.id = "iosSheetTitle";
  sheet.setAttribute("aria-labelledby", "iosSheetTitle");

  layer.appendChild(backdrop);
  layer.appendChild(sheet);

  const body = sheet.querySelector(".ios-sheet__body");
  const appUnmount = opts.onMount(body, sheet);

  let closed = false;

  const moveListeners = {
    mm: null,
    mu: null,
    tm: null,
    te: null,
  };

  const close = () => {
    if (closed) return;
    closed = true;
    activeClose = null;
    if (moveListeners.mm) window.removeEventListener("mousemove", moveListeners.mm);
    if (moveListeners.mu) window.removeEventListener("mouseup", moveListeners.mu);
    if (moveListeners.tm) window.removeEventListener("touchmove", moveListeners.tm);
    if (moveListeners.te) window.removeEventListener("touchend", moveListeners.te);

    sheet.classList.remove("ios-sheet--open");
    backdrop.classList.remove("ios-sheet-backdrop--open");
    window.setTimeout(() => {
      if (typeof appUnmount === "function") appUnmount();
      opts.onUnmount?.();
      layer.innerHTML = "";
      layer.classList.remove("ios-sheet-layer--active");
      layer.setAttribute("aria-hidden", "true");
    }, 360);
  };

  activeClose = close;

  const backBtn = sheet.querySelector(".ios-sheet__back");
  backBtn.addEventListener("click", close);
  backdrop.addEventListener("click", close);

  requestAnimationFrame(() => {
    backdrop.classList.add("ios-sheet-backdrop--open");
    sheet.classList.add("ios-sheet--open");
  });

  const handleWrap = sheet.querySelector(".ios-sheet__handle-wrap");
  let dragStartY = 0;
  let dragging = false;

  const readY = (e) =>
    e.touches ? e.touches[0].clientY : e.clientY;

  const onMove = (e) => {
    if (!dragging) return;
    const y = readY(e);
    const dy = Math.max(0, y - dragStartY);
    sheet.style.transform = `translateY(${dy}px)`;
    sheet.style.transition = "none";
  };

  const onEnd = () => {
    if (!dragging) return;
    dragging = false;
    sheet.style.transition = "";
    const m = sheet.style.transform.match(/translateY\(([\d.]+)px\)/);
    const v = m ? parseFloat(m[1]) : 0;
    sheet.style.transform = "";
    if (v > 100) close();
  };

  handleWrap.addEventListener("mousedown", (e) => {
    dragging = true;
    dragStartY = e.clientY;
    moveListeners.mm = onMove;
    moveListeners.mu = onEnd;
    window.addEventListener("mousemove", moveListeners.mm);
    window.addEventListener("mouseup", moveListeners.mu);
  });

  handleWrap.addEventListener(
    "touchstart",
    (e) => {
      dragging = true;
      dragStartY = readY(e);
      moveListeners.tm = onMove;
      moveListeners.te = onEnd;
      window.addEventListener("touchmove", moveListeners.tm, { passive: true });
      window.addEventListener("touchend", moveListeners.te);
    },
    { passive: true },
  );

  return { close, sheet, body };
}

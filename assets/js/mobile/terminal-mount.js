const state = {
  parent: null,
  before: null,
  hadMinimized: true,
};

export function mountMonitorInto(host) {
  const bezel = document.querySelector(".monitor-bezel");
  if (!bezel || !host) return;

  if (!state.parent) {
    state.parent = bezel.parentNode;
    state.before = bezel.nextSibling;
    state.hadMinimized = bezel.classList.contains("is-minimized");
  }

  bezel.classList.remove("is-minimized");
  host.appendChild(bezel);
}

export function restoreMonitorPlacement() {
  const bezel = document.querySelector(".monitor-bezel");
  if (!bezel || !state.parent) return;

  state.parent.insertBefore(bezel, state.before);
  if (state.hadMinimized) bezel.classList.add("is-minimized");
  state.parent = null;
  state.before = null;
}

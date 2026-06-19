const state = {
  parent: null,
  before: null,
};

/** Move #terminal into the mobile sheet (output only — no monitor chrome). */
export function mountTerminalInto(host) {
  const terminal = document.getElementById("terminal");
  if (!terminal || !host) return;

  if (!state.parent) {
    state.parent = terminal.parentNode;
    state.before = terminal.nextSibling;
  }

  terminal.classList.add("ios-terminal-panel");
  host.appendChild(terminal);
}

export function restoreTerminalPlacement() {
  const terminal = document.getElementById("terminal");
  if (!terminal || !state.parent) return;

  terminal.classList.remove("ios-terminal-panel");
  state.parent.insertBefore(terminal, state.before);
  state.parent = null;
  state.before = null;
}

/** @deprecated Use restoreTerminalPlacement */
export function restoreMonitorPlacement() {
  restoreTerminalPlacement();
}

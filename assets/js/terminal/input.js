import { cmdInput, inputDisplay, terminalEl } from "../core/state.js";
import { handleCommand } from "./commands.js";

const KNOWN_COMMANDS = [
  "SELECT * FROM about",
  "SELECT * FROM resume",
  "SELECT * FROM experience",
  "SELECT * FROM education",
  "SELECT * FROM skills",
  "SELECT * FROM projects",
  "SELECT * FROM contact",
  "HELP",
  "CLEAR",
];

export function initTerminalInput() {
  cmdInput.addEventListener("input", () => {
    inputDisplay.textContent = cmdInput.value;
  });

  cmdInput.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const current = cmdInput.value.toLowerCase();
      const match = KNOWN_COMMANDS.find((cmd) =>
        cmd.toLowerCase().startsWith(current),
      );
      if (match) {
        cmdInput.value = match;
        inputDisplay.textContent = match;
      }
      return;
    }

    if (e.key !== "Enter") return;
    const raw = cmdInput.value;
    cmdInput.value = "";
    inputDisplay.textContent = "";
    if (!raw.trim()) return;
    handleCommand(raw.trim());
  });

  document.addEventListener("click", (e) => {
    if (window.getSelection().toString()) return;

    if (
      e.target.tagName === "INPUT" ||
      e.target.tagName === "TEXTAREA" ||
      e.target.isContentEditable
    ) {
      return;
    }

    const monitor = document.querySelector(".monitor-bezel");
    const isMinimized = monitor?.classList.contains("is-minimized");

    if (monitor && !isMinimized) {
      const isMobile = window.matchMedia("(max-width: 768px)").matches;
      if (isMobile) {
        if (terminalEl && terminalEl.contains(e.target)) {
          cmdInput.focus();
        }
      } else {
        cmdInput.focus();
      }
    }
  });

  const initialMonitor = document.querySelector(".monitor-bezel");
  if (
    initialMonitor &&
    !initialMonitor.classList.contains("is-minimized") &&
    !window.matchMedia("(max-width: 768px)").matches
  ) {
    cmdInput.focus();
  }
}

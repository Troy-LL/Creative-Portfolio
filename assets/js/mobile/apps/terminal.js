import { handleCommand } from "../../terminal/commands.js";
import { cmdInput, inputDisplay } from "../../core/state.js";
import { mountTerminalInto, restoreTerminalPlacement } from "../terminal-mount.js";

const CHIPS = [
  "SELECT * FROM resume",
  "SELECT * FROM projects",
  "SELECT * FROM contact",
  "SELECT * FROM about",
  "HELP",
];

export function mountMobileTerminal(host) {
  host.classList.add("ios-sheet__body--terminal");

  const wrap = document.createElement("div");
  wrap.className = "ios-terminal-wrap";

  const chips = document.createElement("div");
  chips.className = "ios-terminal-chips";
  CHIPS.forEach((label) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "ios-terminal-chip";
    b.textContent = label;
    b.addEventListener("click", () => {
      handleCommand(label);
    });
    chips.appendChild(b);
  });

  const inputRow = document.createElement("div");
  inputRow.className = "ios-terminal-input-row";
  const input = document.createElement("input");
  input.type = "text";
  input.autocomplete = "off";
  input.placeholder = "SQL command…";
  input.setAttribute("enterkeyhint", "go");

  const run = document.createElement("button");
  run.type = "button";
  run.className = "ios-terminal-run";
  run.textContent = "Run";

  const runCmd = () => {
    const raw = input.value.trim();
    if (!raw) return;
    input.value = "";
    if (cmdInput) {
      cmdInput.value = raw;
      if (inputDisplay) inputDisplay.textContent = raw;
    }
    handleCommand(raw);
  };

  run.addEventListener("click", runCmd);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") runCmd();
  });

  inputRow.appendChild(input);
  inputRow.appendChild(run);

  const termHost = document.createElement("div");
  termHost.className = "ios-terminal-output-host";
  termHost.setAttribute("aria-live", "polite");
  termHost.setAttribute("aria-label", "Command output");

  wrap.appendChild(chips);
  wrap.appendChild(termHost);
  wrap.appendChild(inputRow);
  host.appendChild(wrap);
  mountTerminalInto(termHost);

  return () => {
    host.classList.remove("ios-sheet__body--terminal");
    restoreTerminalPlacement();
    wrap.remove();
  };
}

import { output } from "../core/state.js";

export function resetTerminal() {
  if (output) {
    output.innerHTML = `
      <div class="terminal-banner">SQL_TERM v2.0 - PORTFOLIO DATABASE</div>
      <pre class="line dim">Type <span class="bright">HELP</span> to see available commands.</pre>
      <pre class="line">&nbsp;</pre>
    `;
  }
}

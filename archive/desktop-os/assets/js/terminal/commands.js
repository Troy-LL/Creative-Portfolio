import { output, scrollDown } from "../core/state.js";
import { DATA } from "../data/portfolio-data.js";

export function handleCommand(raw) {
  appendLine(`guest@portfolio ~> ${raw}`, "green");

  const cmd = raw.toLowerCase().trim();

  if (cmd === "clear") {
    output.innerHTML = "";
    scrollDown();
    return;
  }

  if (cmd === "help" || cmd === "?") {
    renderResult(DATA.help);
    return;
  }

  const match = cmd.match(/^select\s+\*\s+from\s+(\w+)$/);
  if (match) {
    const table = match[1];
    if (DATA[table]) {
      appendLine("", "");
      appendLine(`Executing: SELECT * FROM ${table}`, "dim");
      appendLine(`${DATA[table].length} row(s) returned.`, "dim");
      appendLine("", "");
      renderResult(DATA[table]);
      return;
    }
    appendLine("", "");
    appendLine(`ERROR 1146: Table '${table}' doesn't exist.`, "error");
    appendLine(
      `Available tables: about, experience, education, skills, projects, contact, resume`,
      "dim",
    );
    appendLine("", "");
    scrollDown();
    return;
  }

  appendLine("", "");
  appendLine(`ERROR: Unrecognized command.`, "error");
  appendLine(`Type HELP for available commands.`, "dim");
  appendLine("", "");
  scrollDown();
}

export function appendLine(text, cls) {
  const pre = document.createElement("pre");
  pre.className = `line ${cls || ""}`;
  pre.textContent = text;
  output.appendChild(pre);
}

export function renderResult(lines) {
  const fragment = document.createDocumentFragment();
  lines.forEach((text) => {
    if (text.startsWith("BANNER:")) {
      const div = document.createElement("div");
      div.className = "terminal-banner animated-item";
      div.textContent = text.replace("BANNER:", "").trim();
      div.style.opacity = "0";
      div.style.transform = "translateX(-8px)";
      fragment.appendChild(div);
    } else {
      const pre = document.createElement("pre");
      pre.className = "line green animated-item";
      pre.textContent = text;
      pre.style.opacity = "0";
      pre.style.transform = "translateX(-8px)";
      fragment.appendChild(pre);
    }
  });
  output.appendChild(fragment);

  const newLines = output.querySelectorAll(
    '.animated-item[style*="opacity: 0"]',
  );
  gsap.to(newLines, {
    opacity: 1,
    x: 0,
    duration: 0.15,
    stagger: 0.03,
    ease: "power2.out",
    onUpdate: scrollDown,
    onComplete: () => {
      newLines.forEach((el) => {
        el.style.opacity = "";
        el.style.transform = "";
        el.classList.remove("animated-item");
      });
      scrollDown();
    },
  });

  appendLine("", "");
  scrollDown();
}

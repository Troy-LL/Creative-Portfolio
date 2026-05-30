import { output, scrollDown } from "../core/state.js";
import { DATA } from "../data/portfolio-data.js";

let activeOutput = output;
let renderMode = "crt";

export function setCommandTarget(el, mode = "crt") {
  activeOutput = el || output;
  renderMode = mode;
}

export function resetCommandTarget() {
  activeOutput = output;
  renderMode = "crt";
}

function getActiveOutput() {
  return activeOutput || output;
}

function lineClass(cls) {
  if (renderMode === "native") {
    if (cls === "error") return "terminal-app-line terminal-app-line--error";
    if (cls === "dim") return "terminal-app-line terminal-app-line--dim";
    if (cls === "header") return "terminal-app-line terminal-app-line--header";
    if (cls === "green") return "terminal-app-line";
    return "terminal-app-line";
  }
  return `line ${cls || ""}`.trim();
}

function nativeScroll() {
  const body = document.querySelector(".terminal-app-body");
  if (body) {
    requestAnimationFrame(() => {
      body.scrollTo({ top: body.scrollHeight, behavior: "smooth" });
    });
  }
}

function doScroll() {
  if (renderMode === "native") nativeScroll();
  else scrollDown();
}

export function handleCommand(raw) {
  appendLine(`guest@portfolio ~> ${raw}`, "green");

  const cmd = raw.toLowerCase().trim();

  if (cmd === "clear") {
    getActiveOutput().innerHTML =
      renderMode === "native"
        ? `<div class="terminal-app-banner">SQL_TERM v2.0 — Portfolio Database</div>`
        : "";
    doScroll();
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
    doScroll();
    return;
  }

  appendLine("", "");
  appendLine(`ERROR: Unrecognized command.`, "error");
  appendLine(`Type HELP for available commands.`, "dim");
  appendLine("", "");
  doScroll();
}

export function appendLine(text, cls) {
  const target = getActiveOutput();
  if (renderMode === "native") {
    if (!text.trim() && !cls) {
      target.appendChild(document.createElement("br"));
      return;
    }
    const p = document.createElement("p");
    p.className = lineClass(cls);
    p.textContent = text;
    target.appendChild(p);
    return;
  }

  const pre = document.createElement("pre");
  pre.className = lineClass(cls);
  pre.textContent = text;
  target.appendChild(pre);
}

export function renderResult(lines) {
  const target = getActiveOutput();
  const fragment = document.createDocumentFragment();

  lines.forEach((text) => {
    if (text.startsWith("BANNER:")) {
      const div = document.createElement("div");
      div.className =
        renderMode === "native"
          ? "terminal-app-banner animated-item"
          : "terminal-banner animated-item";
      div.textContent = text.replace("BANNER:", "").trim();
      div.style.opacity = "0";
      div.style.transform = "translateX(-8px)";
      fragment.appendChild(div);
    } else {
      const el = document.createElement(renderMode === "native" ? "p" : "pre");
      el.className =
        renderMode === "native"
          ? "terminal-app-line animated-item"
          : "line green animated-item";
      el.textContent = text;
      el.style.opacity = "0";
      el.style.transform = "translateX(-8px)";
      fragment.appendChild(el);
    }
  });

  target.appendChild(fragment);

  const newLines = target.querySelectorAll('.animated-item[style*="opacity: 0"]');

  if (typeof gsap !== "undefined") {
    gsap.to(newLines, {
      opacity: 1,
      x: 0,
      duration: 0.15,
      stagger: 0.03,
      ease: "power2.out",
      onUpdate: doScroll,
      onComplete: () => {
        newLines.forEach((el) => {
          el.style.opacity = "";
          el.style.transform = "";
          el.classList.remove("animated-item");
        });
        doScroll();
      },
    });
  } else {
    newLines.forEach((el) => el.classList.remove("animated-item"));
    doScroll();
  }

  appendLine("", "");
  doScroll();
}

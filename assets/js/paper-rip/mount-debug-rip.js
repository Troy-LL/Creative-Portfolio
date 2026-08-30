/**
 * Press-to-crumple center-rip: card bitmap adheres to the Verlet mesh.
 * Hold (no drag required) builds crumple + tear tension.
 */

import { createPaperSim } from "./paper-sim.js";
import { drawCardOnMesh, snapshotCardFace } from "./card-warp.js";

/**
 * @param {object} opts
 * @param {HTMLElement} opts.stage
 * @param {HTMLElement} opts.card
 * @param {HTMLElement} opts.rig
 */
export function mountDebugRip(opts) {
  const { stage, card, rig } = opts;
  const face = card.querySelector(".css-card__face") || card;

  let sim = null;
  let canvas = null;
  /** @type {HTMLCanvasElement|null} */
  let texture = null;
  let running = false;
  let enabled = false;
  let raf = 0;
  let pointerId = null;
  let showMesh = true;

  function ensureCanvas() {
    if (canvas) return canvas;
    canvas = document.createElement("canvas");
    canvas.className = "paper-rip-debug";
    canvas.setAttribute("aria-label", "Press card to crumple");
    stage.appendChild(canvas);
    return canvas;
  }

  function layout() {
    const r = rig.getBoundingClientRect();
    const sr = stage.getBoundingClientRect();
    const c = ensureCanvas();
    const w = Math.max(2, Math.round(r.width));
    const h = Math.max(2, Math.round(r.height));
    c.width = w;
    c.height = h;
    c.style.width = `${w}px`;
    c.style.height = `${h}px`;
    c.style.left = `${r.left - sr.left}px`;
    c.style.top = `${r.top - sr.top}px`;
    return { w, h };
  }

  async function rebuild() {
    const { w, h } = layout();
    // Coarse grid (~10×6) — fewer squares = easier crumple into a ball
    const cell = 40;
    const cols = Math.max(8, Math.min(12, Math.round(w / cell) + 1));
    const rows = Math.max(5, Math.min(7, Math.round(h / cell) + 1));
    sim = createPaperSim({ width: w, height: h, cols, rows });
    texture = await snapshotCardFace(face, w, h);
  }

  function toLocal(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * canvas.width,
      y: ((e.clientY - r.top) / r.height) * canvas.height,
    };
  }

  function paint() {
    if (!sim || !canvas || !texture) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawCardOnMesh(ctx, texture, sim, showMesh);
  }

  function loop() {
    if (!running || !sim) return;
    sim.step();
    paint();
    raf = requestAnimationFrame(loop);
  }

  function startLoop() {
    if (running) return;
    running = true;
    raf = requestAnimationFrame(loop);
  }

  function stopLoop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function onDown(e) {
    if (!enabled || !sim || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    pointerId = e.pointerId;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    const p = toLocal(e);
    sim.beginGrab(p.x, p.y);
    card.classList.add("is-ripping");
  }

  function onUp(e) {
    if (pointerId != null && e.pointerId !== pointerId) return;
    pointerId = null;
    sim?.endGrab();
    card.classList.remove("is-ripping");
  }

  async function enable() {
    if (enabled) return;
    enabled = true;
    ensureCanvas();
    canvas.classList.add("is-active");
    card.classList.add("is-tearable");
    // Capture while the real face is still visible — then bind to mesh
    await rebuild();
    card.classList.add("is-mesh-bound");
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    startLoop();
    paint();
  }

  function disable() {
    enabled = false;
    stopLoop();
    card.classList.remove("is-tearable", "is-ripping", "is-mesh-bound");
    if (canvas) {
      canvas.classList.remove("is-active");
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
    }
    sim?.reset();
  }

  function destroy() {
    disable();
    canvas?.remove();
    canvas = null;
    sim = null;
    texture = null;
  }

  async function reset() {
    await rebuild();
    if (enabled) paint();
  }

  return {
    enable,
    disable,
    destroy,
    reset,
    setShowMesh(on) {
      showMesh = !!on;
    },
    get sim() {
      return sim;
    },
    get active() {
      return enabled;
    },
  };
}
